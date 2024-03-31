---
title: Application Gateway and App Service authentication
image: /assets/posts/2024/04/08/appgw-and-app-service-authentication/resources.png
date: 2024-04-08 06:00:00 +0300
layout: posts
categories: azure
tags: azure appgw
---
I wrote about
[Application Gateway and dynamic custom rules in Web Application Firewall]({% post_url 2024/04/2024-04-01-appgw-and-dynamic-custom-rules %})
in my previous post. 
In this post, I'll continue to build on top of those learnings and connect dots with App Service authentication
from which I also wrote recently
[App Service and OpenID Connect with Salesforce]({% post_url 2024/03/2024-03-25-app-service-and-openid-connect %}).

This time I have the following scenario:

- Two web application hosted in App Service
  - First application `App` allows anonymous access
  - Second application `AdminApp` is protected by App Service authentication
    - Entra ID as the identity provider
    - This should be reachable only at `/admin` and any other traffic should go to the first application:
{% include mermaid.html postfix="1" text="
graph TD
    User -->|https://host/...|AppGw
    AppGw -->|https://host/| App
    AppGw -->|https://host/admin| AdminApp
" %}
- `AdminApp` could be limited to be accessible from private network only, 
  but it was decided to be used from internet
- Application Gateway is in the front of the App Service
  - Managed rule sets are enabled in the Web Application Firewall
  - Redirects HTTP to HTTPS:
{% include mermaid.html postfix="2" text="
sequenceDiagram
    actor User
    participant AppGw
    participant App
    User->>AppGw: http://host/
    AppGw->>AppGw: Redirect rule
    AppGw->>User: Redirect to HTTPS
    User->>AppGw: https://host/
    AppGw->>App: Proxy request https://app/
    App->>AppGw: Return content
    AppGw->>User: Return content
" %}

<br/>
Here is the authentication flow for the above scenarios:<br/>
_Click diagram to expand_

{% include mermaid.html postfix="3" text="
sequenceDiagram
    participant Entra ID
    actor User
    participant AppGw
    participant AdminApp
    User->>AppGw: https://host/admin
    AppGw->>AdminApp: Proxy request<br/>https://adminapp/admin
    AdminApp->>AppGw: EasyAuth redirects to Entra ID
    Note left of AdminApp: redirect_uri:<br/>https://host/admin/signin-oidc 
    AppGw->>User: Redirect to Entra ID
    User->>Entra ID: https://login.microsoftonline.com/...
    Note right of Entra ID: Login
    Entra ID->>User: Redirect to<br/>https://host/admin/signin-oidc
    User->>AppGw: https://host/admin/signin-oidc
    AppGw->>AdminApp: Proxy request<br/>https://adminapp/admin/signin-oidc
    Note left of AdminApp: EasyAuth processes authentication
    AdminApp->>AppGw: Return content
    AppGw->>User: Return content
" %}

## Deployment

In order to deploy our applications successfully behind reverse proxy scenario,
there are a few things we need to understand:

[Preserve the original HTTP host name between a reverse proxy and its back-end web application](https://learn.microsoft.com/en-us/azure/architecture/best-practices/host-name-preservation)

[App Service and Authentication and authorization](https://learn.microsoft.com/en-us/azure/app-service/overview-authentication-authorization)

[Configure ASP.NET Core to work with proxy servers and load balancers](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer?view=aspnetcore-8.0)

[Application Gateway and Modifications to the request](https://learn.microsoft.com/en-us/azure/application-gateway/how-application-gateway-works#modifications-to-the-request)

From the above _good reading list_ we've learned following things:

- We need to preserve the original host name in the request to the App Service
  - In practice this means that our App Service should be configured with same custom domain name as the Application Gateway
- We need to make sure that our application works behind reverse proxy
  - Application should work with `X-Forwarded-*` headers
  - Our application should work when accessed using `/admin` path
- Application Gateway adds `X-Original-Host` header to the backend request but it does not insert `X-Forwarded-Host` header
  - App Service authentication uses `X-Forwarded-Host` header to determine the redirect URL
  - We need to create _rewrite rule_ in the Application Gateway to insert `X-Forwarded-Host` header to the backend requests 
    **or** configure the App Service to use `X-Original-Host` header

Here are the high-level steps for our deployment:

1. Create Entra ID App Registration
   - This will be used in the App Service authentication
2. Create pre-deployment DNS records
  - CNAME record for the domain pointing to the App Service
  - TXT record for domain verification done by the App Service
3. Create certificate for App Gateway
4. Deploy Azure infrastructure assets
5. Create post-deployment DNS record
  - A record for the domain pointing to the public IP of the Application Gateway
6. Test the setup

Let's next go through these steps in more detail.

## 1. Create Entra ID App Registration

I've written about
[Entra ID Group automation with PowerShell]({% post_url 2024/02/2024-02-05-entra-id-group-automation %})
which basically shows how I approach the Entra ID automation.

I'll use the same approach here to create the App Registration for the Entra ID:

```powershell
# Public fully qualified custom domain name
$domain = "myapp.jannemattila.com"

# Create Entra ID app used in authentication
$appPath = "/admin" # In this demo "admin" is the "secured" application
$json = @"
{
  "displayName": "$domain",
  "signInAudience": "AzureADMyOrg",
  "requiredResourceAccess": [
    {
      "resourceAppId": "00000003-0000-0000-c000-000000000000",
      "resourceAccess": [
        {
          "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
          "type": "Scope"
        }
      ]
    },
  ],
  "web": {
    "implicitGrantSettings": {
      "enableIdTokenIssuance": true
    },
    "redirectUris": [
      "https://$domain$appPath/.auth/login/aad/callback"
    ]
  }
}
"@

$json

$applicationResponse = Invoke-AzRestMethod -Uri "https://graph.microsoft.com/v1.0/applications" -Method POST -Payload $json
$application = $applicationResponse.Content | ConvertFrom-Json
$application.appId

$secretResponse = Invoke-AzRestMethod -Uri "https://graph.microsoft.com/v1.0/applications/$($application.id)/addPassword" -Method POST
$secret = $secretResponse.Content | ConvertFrom-Json

$clientId = $application.appId
$clientSecretPlainText = $secret.secretText

$clientSecret = ConvertTo-SecureString -String $clientSecretPlainText -Force -AsPlainText
```

After executing the above script, you should have the `clientId` and `clientSecret` variables saved for yourself
and following application deployed to the Entra ID:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/myapp.png" %}

We're going to use these values in our deployment later on.

## 2. Create pre-deployment DNS records

In our setup we have to now create the following DNS records:

1. CNAME record for the domain pointing to the App Service
2. TXT record for domain verification done by the App Service
3. A record for the domain pointing to the public IP of the Application Gateway

We cannot yet our A record because we don't have the public IP of the Application Gateway yet.
That needs to be post deployment step.

CNAME record we can create pre-deployment, because we set the domain name of the App Service in our deployment.
App Service domain verification is something that we cannot set ourselves, but we can get the verification id
using following script:

```powershell
# Get custom domain verification id
$params = @{
  ResourceProviderName = "Microsoft.App"
  ResourceType = "getCustomDomainVerificationId"
  ApiVersion = "2023-08-01-preview"
  Method = "POST"
}
$customDomainVerificationId = (Invoke-AzRestMethod @params).Content | ConvertFrom-Json
# Note: This is unique _per_ subscription!
$customDomainVerificationId

# Create TXT record "asuid.myapp" to your DNS zone -> $customDomainVerificationId
# Create CNAME record in your DNS zone -> $domain -> <yourappservice>.azurewebsites.net
# After deployment, create A record in your DNS zone -> $domain -> <public IP of AppGw>
```

Now we're ready to create the CNAME record for the domain pointing to the App Service:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/cname.png" %}

Similarly, we can create the TXT record for the domain verification
identifier we got from the previous script:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/txt.png" %}

Next we can create certificate for the App Gateway.

## 3. Create certificate for App Gateway

In this demo, I'm going to use self-signed certificate for the App Gateway but in real world scenario
you would use a certificate from a trusted certificate authority.

Here is the script to create the self-signed certificate for our domain (run script as administrator):

```powershell
# Public fully qualified custom domain name
$domain = "myapp.jannemattila.com"

# Certificate password
$certificatePasswordPlainText = "<your certificate password>"
$certificatePassword = ConvertTo-SecureString -String $certificatePasswordPlainText -Force -AsPlainText

$cert = New-SelfSignedCertificate -certstorelocation cert:\localmachine\my -dnsname $domain

Export-PfxCertificate -Cert $cert -FilePath cert.pfx -Password $certificatePassword
```

After executing the above script, you should have the `cert.pfx` file available for yourself.
We'll place it next to our deployment files.

Now we're ready to deploy the Azure infrastructure assets.

## 4. Deploy Azure infrastructure assets

In our previous steps we've created assets that we now need to pass to our deployment script:

```powershell
$result = .\deploy.ps1 `
  -CertificatePassword $certificatePassword `
  -ClientId $clientId `
  -ClientSecret $clientSecret `
  -CustomDomain $domain

# Add this to A record into your DNS zone
$result.Outputs.ip.value
```

After the deployment script has finished, you should have the public IP of the Application Gateway available.
That we're going to use in next step.

Our deployment is using
[App Service managed certificate](https://learn.microsoft.com/en-us/azure/app-service/configure-ssl-certificate?tabs=apex#create-a-free-managed-certificate)
which requires a bit more complex Bicep code.
There is good background for this topic in the Bicep repository discussions:

{% include githubEmbed.html text="Azure/bicep/discussions/5006" link="Azure/bicep/discussions/5006" %}

Here are the deployed resources:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/resources.png" %}

## 5. Create post-deployment DNS record

Before we can add A record to our DNS Zone, we have to remove the previous CNAME record.
After that we're ready to create the A record with the public IP of the Application Gateway:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/a.png" %}

## 6. Test the setup

First we need to test the HTTP to HTTPS redirection in Application Gateway:

```powershell
# Will redirect to HTTPS
curl "http://$domain" --verbose
curl "http://$domain/admin/" --verbose
```

Both should redirect the traffic to HTTPS.

If you have been testing with CNAMEd domain, 
you might need to flush the DNS resolver cache before you the your A record updated to your machine:

```powershell
ipconfig /flushdns
```

Second we need to test the anonymous access:

```powershell
# Will return anonymous page content
curl "https://$domain" --verbose --insecure
curl "https://$domain/any/path/here" --verbose --insecure
```

We're using `--insecure` in the above commands because we're using self-signed certificate.
If you open URL in the browser, you'll see the certificate error:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/certerror.png" %}

You have to use **Advanced > Continue to the website** to proceed.

And lastly, we start to test the App Service authentication:

```powershell
# Forces authentication
curl "https://$domain/admin" --verbose --insecure
```

You should get `401 Unauthorized` with redirect to the Entra ID login.

When you try to run that process in your browser, you should get to this error page:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/autherror.png" %}

If you use browser developer tools and analyze the flow, everything looks good.

Let's analyze our Application Gateway firewall logs:

```sql
AGWFirewallLogs
| where Action == "Blocked"
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/firewalllogs1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/firewalllogs2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/firewalllogs3.png" %}

We can quickly see that our Web Application Firewall is blocking the request.
See more details about [managed rulesets](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/application-gateway-crs-rulegroups-rules).

The rule `949110` is actually _special_ rule since it blocks if the
[anomaly scoring](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/application-gateway-crs-rulegroups-rules?tabs=drs21#anomaly-scoring)
is too high.
If you look carefully the above logs, then you noticed following text there:

> **Inbound Anomaly Score Exceeded (Total Score: 6)**

Let's continue our digging by executing following query:

```sql
AGWFirewallLogs
| where RequestUri == "/admin/.auth/login/aad/callback"
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/firewalllogs4.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/firewalllogs5.png" %}

So the interesting rules are actually:

- [920230 - Multiple URL Encoding Detected](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/application-gateway-crs-rulegroups-rules?tabs=drs21#anomaly-scoring:~:text=Abuse%20Attack%20Attempt-,920230,-Multiple%20URL%20Encoding)
- [942430 - Restricted SQL Character Anomaly Detection (args): # of special characters exceeded (12)](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/application-gateway-crs-rulegroups-rules?tabs=drs21#anomaly-scoring:~:text=SQL%20Injection%20Attack-,942430,-Restricted%20SQL%20Character)

We have now few options to fix these [false positives](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/web-application-firewall-troubleshoot#fixing-false-positives):

Create exclusions to the managed rule sets for `920230` and `942430` rules for URL `/admin/.auth/login/aad/callback`

```powershell
exclusions: [
  {
    matchVariable: 'RequestArgKeys'
    selector: '/admin/.auth/login/aad/callback'
    selectorMatchOperator: 'EndsWith'
    exclusionManagedRuleSets: [
      {
        ruleSetType: 'Microsoft_DefaultRuleSet'
        ruleSetVersion: '2.1'

        ruleGroups: [
          {
            ruleGroupName: 'PROTOCOL-ENFORCEMENT'
            rules: [
              {
                ruleId: '920230'
              }
            ]
          }
          {
            ruleGroupName: 'SQLI'
            rules: [
              {
                ruleId: '942440'
              }
            ]
          }
        ]
      }
    ]
  }
]
}
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/appgw-kql.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/backend-override-true.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/redirect.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/admin.png" %}

## Troubleshooting tips

TBA:
- Check redirect url
- Check app service diagnostic
- Check browser developer tools

## Conclusion

In this post, I showed how to combine App Service authentication with Application Gateway and Web Application Firewall.
I used Entra ID as the identity provider and created a custom domain for the App Service.

This was originally published in my GitHub repository:

{% include githubEmbed.html text="JanneMattila/azure-application-gateway-demos/appgw-and-easyauth" link="JanneMattila/azure-application-gateway-demos/tree/main/appgw-and-easyauth" %}

I hope you find this useful!
