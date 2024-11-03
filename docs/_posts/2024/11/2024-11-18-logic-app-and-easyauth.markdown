---
title: Standard Logic App and EasyAuth
image: /assets/share.png
date: 2024-11-18 06:00:00 +0300
layout: posts
categories: azure
tags: azure logic-app easyauth
---

I've previously blogged about EasyAuth e.g., 
[App Service and OpenID Connect with Salesforce]({% post_url 2024/03/2024-03-25-app-service-and-openid-connect %})
and
[Application Gateway and App Service authentication]({% post_url 2024/04/2024-04-08-appgw-and-app-service-authentication %}).

In this post, I'll show how to use EasyAuth with a Standard Logic App.
This post _heavily_ builds on top of the post: 
[Trigger workflows in Standard logic apps with Easy Auth](https://techcommunity.microsoft.com/t5/azure-integration-services-blog/trigger-workflows-in-standard-logic-apps-with-easy-auth/ba-p/3207378).

Scenario:

- Logic App is secured with Entra ID authentication
- Logic App has an HTTP trigger
- Only **2 specific client applications** are allowed to call the Logic App
- PowerShell to create necessary Entra ID app registrations
- Infrastructure as code in Bicep

We'll create 3 app registrations, so that we can test the EasyAuth with Logic App:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/easyauth.svg" %}

First, we'll create the app registration used by the Logic App EasyAuth:

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

Next, we'll prepare for the Infrastructure-as-Code deployment.
We have to pass _clientId_ and _integrationClientIds_ as parameters, so that the
Logic App can be configured with the correct EasyAuth settings.
_IntegrationClientIds_ is an array of client application IDs that are allowed to call the Logic App.
No other client applications are allowed to call the Logic App.
Here's the deployment:

```powershell
# Prepare parameters for the deployment:
$clientId = $integrationApp.AppId
$integrationClientIds = @($integrationClientApp1.AppId, $integrationClientApp2.AppId)

# Deploy the Standard Logic App with EasyAuth enabled:
$deployment = .\deploy.ps1 -ClientId $clientId -IntegrationClientIds $integrationClientIds
$deployment.outputs.uri.value
```

Few key points from the deployment script:

- [logicAppsAccessControlConfiguration](https://github.com/JanneMattila/azure-logic-apps-demos/blob/087d80d5d09db9ce5f168f60d6075db29e4d8fa5/easyauth/main.bicep#L124-L131) is used to disable SAS authentication in triggers
- [authsettingsV2](https://github.com/JanneMattila/azure-logic-apps-demos/blob/087d80d5d09db9ce5f168f60d6075db29e4d8fa5/easyauth/main.bicep#L161-L184) is used to configure EasyAuth settings including `allowedApplications`

After the deployment, we can see the following resources in the resource group:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/resource-group.png" %}

Now, we can implement simple HTTP trigger based workflow using Azure Portal and leveraging ready-made templates:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/template.png" %}

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/workflow1.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/workflow2.png" %}

I'll copy the URL from the HTTP trigger, so that we can test the configuration:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/workflow3.png" %}

I'll add simple payload to the response:

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/workflow4.png" %}

I'll test first with the `Integration Client 1` application:

```powershell
# Integration Client 1 test:
$tenantId = (Get-AzContext).Tenant.Id
$clientPassword = ConvertTo-SecureString $integrationClientApp1Secret.SecretText -AsPlainText -Force
$credentials = New-Object System.Management.Automation.PSCredential($integrationClientApp1.AppId, $clientPassword)
Connect-AzAccount -ServicePrincipal -Credential $credentials -TenantId $tenantId

$integrationClient1Token = Get-AzAccessToken -Resource $integrationApp.AppId -AsSecureString
$integrationClient1Token.Token | ConvertFrom-SecureString -AsPlainText
$integrationClient1Token.Token | ConvertFrom-SecureString -AsPlainText | Set-Clipboard
# Study in jwt.ms
```

Let's quickly study the token in [jwt.ms](https://jwt.ms/):

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/jwt1.png" %}

We can see that:

- Intended audience of the token matches the `Integration Workflow`
- AppId matches the `Integration Client 1`

Now, we can test the Logic App with the `client1` application:

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

Let's test with the `Integration Client 3 - Not enabled` application.
Token seems to be similar as before and AppId matches our configured app:

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/jwt2.png" %}

However, when we try to call the Logic App with the `client3` application, we get:

> **Invoke-RestMethod: You do not have permission to view this directory or page.**

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/authentication1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/authentication2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/authentication3.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/authentication4.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/18/logic-app-and-easyauth/authentication5.png" %}

More information can be found from the official documentation: [Configure your App Service or Azure Functions app to use Microsoft Entra sign-in](https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-provider-aad?tabs=workforce-configuration)

{% include githubEmbed.html text="JanneMattila/azure-logic-apps-demos/easyauth" link="JanneMattila/azure-logic-apps-demos/tree/main/easyauth" %}

