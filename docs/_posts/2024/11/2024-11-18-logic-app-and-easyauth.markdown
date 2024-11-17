---
title: Standard Logic App and authentication with EasyAuth
image: /assets/posts/2024/11/18/logic-app-and-easyauth/authentication1.png
date: 2024-11-18 06:00:00 +0300
layout: posts
categories: azure
tags: azure logic-app easyauth
---

I've previously blogged about EasyAuth e.g., 
[App Service and OpenID Connect with Salesforce]({% post_url 2024/03/2024-03-25-app-service-and-openid-connect %})
and
[Application Gateway and App Service authentication]({% post_url 2024/04/2024-04-08-appgw-and-app-service-authentication %}).

In this post, I'll show how to use authentication with EasyAuth in a
[Standard Logic App](https://learn.microsoft.com/en-us/azure/logic-apps/single-tenant-overview-compare#standard-logic-app-and-workflow).
This post _heavily_ builds on top of the post: 
[Trigger workflows in Standard logic apps with Easy Auth](https://techcommunity.microsoft.com/t5/azure-integration-services-blog/trigger-workflows-in-standard-logic-apps-with-easy-auth/ba-p/3207378).

Scenario:

- Logic App is secured with Entra ID authentication
- Logic App has an HTTP trigger
- Only **2 specific client applications** are allowed to call the Logic App
- PowerShell to create necessary Entra ID app registrations
- Infrastructure as code in Bicep

We'll create 3 app registrations, so that we can test authentication with Logic App:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/easyauth.svg" %}

First, we'll create the app registration used by the Logic App authentication:

```powershell
# Workflow application:
$integrationApp = New-AzADApplication `
  -DisplayName "Integration Workflow" `
  -SignInAudience AzureADMyOrg
Update-AzADApplication -InputObject $integrationApp `
  -IdentifierUri "api://$($integrationApp.AppId)"
New-AzADServicePrincipal -ApplicationId $integrationApp.AppId
```

Similarly, we'll create 3 client applications and their secrets:

```powershell
# Integration client application 1:
$integrationClientApp1 = New-AzADApplication `
  -DisplayName "Integration Client 1" `
  -SignInAudience AzureADMyOrg
New-AzADServicePrincipal -ApplicationId $integrationClientApp1.AppId
$integrationClientApp1Secret = New-AzADAppCredential `
  -ObjectId $integrationClientApp1.Id `
  -EndDate (Get-Date).AddYears(1)
```

Repeat the above for the other client applications:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/app-regs.png" %}

Next, we'll prepare for the infrastructure-as-Code deployment.
We have to pass _clientId_ and _integrationClientIds_ as parameters, so that the
Logic App can be configured with the correct authentication settings.
_IntegrationClientIds_ is an array of client application IDs that are allowed to call the Logic App.
No other client applications are allowed to call the Logic App.
Here's the deployment:

```powershell
# Prepare parameters for the deployment:
$clientId = $integrationApp.AppId
$integrationClientIds = $integrationClientApp1.AppId, $integrationClientApp2.AppId

# Deploy the Standard Logic App with authentication enabled:
$deployment = .\deploy.ps1 -ClientId $clientId -IntegrationClientIds $integrationClientIds
$deployment.outputs.uri.value
```

Few key points from the deployment script:

- [logicAppsAccessControlConfiguration](https://github.com/JanneMattila/azure-logic-apps-demos/blob/1a2e32276f1be4c8d5df82dbfa76bf66654d29c9/easyauth/main.bicep#L128-L135) is used to disable SAS authentication in triggers
- [authsettingsV2](https://github.com/JanneMattila/azure-logic-apps-demos/blob/main/easyauth/main.bicep#L165-L188) is used to configure EasyAuth settings including `allowedApplications`
- [WEBSITE_AUTH_AAD_ALLOWED_TENANTS](https://github.com/JanneMattila/azure-logic-apps-demos/blob/bf31f513b6ad9e0d21f1942338b042d08c14aa3e/easyauth/main.bicep#L108-L111) app setting is used to restrict the tenant to the current tenant
- [WEBSITE_AUTH_AAD_REQUIRE_CLIENT_SERVICE_PRINCIPAL](https://github.com/JanneMattila/azure-logic-apps-demos/blob/1a2e32276f1be4c8d5df82dbfa76bf66654d29c9/easyauth/main.bicep#L112-L115) app setting requires that incoming token to have object id (`oid`) claim

After the deployment, we can see the following resources in the resource group:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/resource-group.png" %}

Now, we can implement simple HTTP trigger-based workflow using Azure Portal and leverage ready-made templates:

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/template.png" %}

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/workflow1.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/workflow2.png" %}

I'll add simple payload to the response:

{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/workflow4.png" %}

---

Now, we are ready to test our Logic App. I'll first test with the `Integration Client 1` application. Let's get the token for the application:

```powershell
# Integration Client 1 test:
$tenantId = (Get-AzContext).Tenant.Id
$clientPassword = ConvertTo-SecureString $integrationClientApp1Secret.SecretText -AsPlainText -Force
$credentials = New-Object System.Management.Automation.PSCredential($integrationClientApp1.AppId, $clientPassword)
Connect-AzAccount -ServicePrincipal -Credential $credentials -TenantId $tenantId

$integrationClient1Token = Get-AzAccessToken -Resource $integrationApp.AppId -AsSecureString
$integrationClient1Token.Token | ConvertFrom-SecureString -AsPlainText | Set-Clipboard
```

Let's quickly study the token in [jwt.ms](https://jwt.ms/):

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/jwt1.png" %}

We can see that:

- The intended audience (`aud`) of the token matches the `Integration Workflow`
- Application ID (`appid`) matches the `Integration Client 1`

Now, we can test invoking the Logic App with the token:

```powershell
Invoke-RestMethod `
  -Uri $requestUri `
  -Authentication Bearer `
  -Token $integrationClient1Token.Token
```

The response is:

```
Hello Client App!
```

We can repeat the same steps for the `Integration Client 2` application and see the same response.
Everything works as expected.

Let's test with the `Integration Client 3 - Not enabled` application.
Token seems to be similar as before and AppId matches our configured app:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/jwt2.png" %}

_However_, when we try to call the Logic App with the `Integration Client 3 - Not enabled` application, we get:

> **Invoke-RestMethod: You do not have permission to view this directory or page.**

This is of course expected, since this application is not in the allowed client application list.

Let's quickly see the configured setting of our Logic App:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/authentication1.png" %}

Here's a difference when comparing to typical App Service EasyAuth configurations:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/authentication2.png" %}

So, we still need to allow unauthenticated access, since it is used by other operations e.g., by the Logic App designer.

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/authentication3.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/authentication4.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/authentication5.png" %}

More information about configuration options can be found from the official documentation:

[Configure your App Service or Azure Functions app to use Microsoft Entra sign-in](https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-provider-aad?tabs=workforce-configuration)

[Enable OAuth 2.0 with Microsoft Entra ID](https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-securing-a-logic-app?tabs=azure-portal#enable-oauth-20-with-microsoft-entra-id)

What is the difference between `allowedApplications` and `identities` in the configuration?

- You can use `identities` to limit the access to specific directory object ids (`oid`)
- You can use `allowedApplications` to limit the access to specific client ids (`appid` or `azp`)
- When you have an application that accesses the API as the signed-in user (_delegated_ permissions), then the object id (`oid`) is the user's object id

I'll leave the _delegated_ permissions scenario for another blog post.

You can further down narrow the access by defining more granular application roles:
[Daemon client application (service-to-service calls)](https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-provider-aad?tabs=workforce-configuration#daemon-client-application-service-to-service-calls)
Here is my
[App Service authentication and service-to-service integration](https://github.com/JanneMattila/some-questions-and-some-answers/blob/master/q%26a/aad_app_service_and_s2s.md)
example about it.

## Conclusion

The above steps showed how to secure a Standard Logic App with EasyAuth authentication.
Please remember, that this was only about the identity part.
There are other aspects to consider when securing your Logic App including network restrictions etc.

This scenario was about the *incoming requests to Logic App*.
If you need to *call other services from the Logic App, you need to consider the outgoing requests* as well.
Typically, you would use Managed Identity for that.

You can find the full source code from my GitHub repository. Just open `setup.ps1` and run commands line by line
and you have the same setup as I had in this blog post:

{% include githubEmbed.html text="JanneMattila/azure-logic-apps-demos/easyauth" link="JanneMattila/azure-logic-apps-demos/tree/main/easyauth" %}

I hope you find this useful!
