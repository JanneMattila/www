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
    - This should be reachable only at `/admin` and any other traffic should go to the first application
- Application Gateway in front of the App Service
  - Managed rule sets are enabled in the Web Application Firewall

High-level steps for our deployment:

1. Create Entra ID App Registration
2. Create pre-deployment DNS records
  - CNAME record for the domain pointing to the App Service
  - TXT record for domain verification
3. Create certificate for App Gateway
4. Deploy Azure infrastructure assets
5. Create post-deployment DNS records
  - A record for the domain pointing to the public IP of the Application Gateway
6. Test the setup

{% include mermaid.html postfix="1" text="
graph TD
    User -->|https://host/...|AppGw
    AppGw -->|https://host/| App
    AppGw -->|https://host/admin| AdminApp
" %}


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

{% include mermaid.html postfix="3" text="
sequenceDiagram
    participant Entra ID
    actor User
    participant AppGw
    participant AdminApp
    User->>AppGw: http://host/admin
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

https://learn.microsoft.com/en-us/azure/architecture/best-practices/host-name-preservation

https://learn.microsoft.com/en-us/azure/app-service/overview-authentication-authorization#considerations-for-using-built-in-authentication

[Configure ASP.NET Core to work with proxy servers and load balancers](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer?view=aspnetcore-8.0)

[Modifications to the request](https://learn.microsoft.com/en-us/azure/application-gateway/how-application-gateway-works#modifications-to-the-request)

Here's a high-level overview of App Service authentication process:

{% include mermaid.html postfix="4" text="
sequenceDiagram
    actor User
    User->>EasyAuth: Access web app<br/>as a anonymous user
    EasyAuth->>User: Redirect to<br/>authentication provider
    User->>AuthProvider: Login
    AuthProvider->>User: Redirect back to web app
    User->>EasyAuth: Access web app<br/>as a authenticated user
    Note right of EasyAuth: Add identity<br/>to HTTP headers
    EasyAuth->>AppService: Request 
    Note right of AppService: Access<br/>headers
    AppService->>User: Response
" %}

## 1. Create Entra ID App Registration

[Entra ID Group automation with PowerShell]({% post_url 2024/02/2024-02-05-entra-id-group-automation %})

```powershell
# Public fully qualified custom domain name
$domain = "myapp.jannemattila.com"

# Create Azure AD app used in authentication
$appPathIfNeeded = "/admin" # In this demo "admin" is the "secured" application
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
      "https://$domain$appPathIfNeeded/.auth/login/aad/callback"
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

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/myapp.png" %}

## 2. Create pre-deployment DNS records

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

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/txt.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/cname.png" %}

## 3. Create certificate for App Gateway

```powershell
# Public fully qualified custom domain name
$domain = "myapp.jannemattila.com"

# Certificate password
$certificatePasswordPlainText = "<your certificate password>"
$certificatePassword = ConvertTo-SecureString -String $certificatePasswordPlainText -Force -AsPlainText

$cert = New-SelfSignedCertificate -certstorelocation cert:\localmachine\my -dnsname $domain

Export-PfxCertificate -Cert $cert -FilePath cert.pfx -Password $certificatePassword
```

## 4. Deploy Azure infrastructure assets

```powershell
$result = .\deploy.ps1 `
  -CertificatePassword $certificatePassword `
  -ClientId $clientId `
  -ClientSecret $clientSecret `
  -CustomDomain $domain

# Add this to A record into your DNS zone
$result.Outputs.ip.value
```

```powershell
{
  priority: 10
  name: 'RuleAllowEasyAuth'
  action: 'Allow'
  ruleType: 'MatchRule'
  matchConditions: [
    {
      operator: 'EndsWith'
      negationConditon: false
      transforms: [
        'Lowercase'
      ]
      matchVariables: [
        {
          variableName: 'RequestUri'
        }
      ]
      matchValues: [
        '/admin/.auth/login/aad/callback'
      ]
    }
  ]
}
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/resources.png" %}

## 5. Create post-deployment DNS records

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/a.png" %}

## 6. Test the setup

First we need to test the HTTP to HTTPS redirection in Application Gateway:

```powershell
# Will redirect to HTTPS
curl "http://$domain" --verbose
curl "http://$domain/admin/" --verbose
```

Second we need to test the anonymous access:

```powershell
# Will return anonymous page content
curl "https://$domain" --verbose --insecure
curl "https://$domain/any/path/here" --verbose --insecure
```

And lastly, we start to test the App Service authentication:

```powershell
# Forces authentication
curl "https://$domain/admin" --verbose --insecure
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/appgw-kql.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/backend-override-true.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/08/appgw-and-app-service-authentication/redirect.png" %}

## Conclusion

In this post, I showed how to combine App Service authentication with Application Gateway and Web Application Firewall.
I used Entra ID as the identity provider and created a custom domain for the App Service.

This was originally published in my GitHub repository:

{% include githubEmbed.html text="JanneMattila/azure-application-gateway-demos/appgw-and-easyauth" link="JanneMattila/azure-application-gateway-demos/tree/main/appgw-and-easyauth" %}

I hope you find this useful!
