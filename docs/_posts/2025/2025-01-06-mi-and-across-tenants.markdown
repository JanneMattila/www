---
layout: posts
title: Managed Identity access across tenants
image: /assets/posts/2025/01/06/mi-across-tenants/mi-across-tenants.png
date: 2025-01-06 06:00:00 +0300
categories: azure
tags: appdev azure openai unity
---

When I saw post
[Effortlessly access cloud resources across Azure tenants without using secrets](https://devblogs.microsoft.com/identity/access-cloud-resources-across-tenants-without-secrets/)
I immediately wanted to take it for a spin.
_For background information, please checkout the article first._

Jumping directly to my demo architecture:

{% include imageEmbed.html link="/assets/posts/2025/01/06/mi-across-tenants/mi-across-tenants.png" %}

As you can see from my diagram, I have my two favorite companies _Contoso_ and _Litware_
wanting to collaborate across their tenants. 
_Contoso_ provides some services to _Litware_ and needs Azure access to do that.
Obviously, _Litware_ wants to control the access and they've now agreed to 
use the above setup for access management solution.

Let's start the setup from _Contoso_ side first.

### Contoso setup

Contoso starts their setup by creating managed identity and app registration.
Here's the Bicep of that setup:

```powershell
extension microsoftGraphV1

param location string = resourceGroup().location

resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'umi-multi-tenant-example'
  location: location
}

resource myApp 'Microsoft.Graph/applications@v1.0' = {
  displayName: 'Multi-Tenant Example App'
  uniqueName: 'my-multi-tenant-application'
  signInAudience: 'AzureADMultipleOrgs'

  resource myMsiFic 'federatedIdentityCredentials@v1.0' = {
    name: 'my-multi-tenant-application/${managedIdentity.name}'
    description: 'Federated Identity Credentials for Managed Identity'
    audiences: [
      'api://AzureADTokenExchange'
    ]
    issuer: '${environment().authentication.loginEndpoint}${tenant().tenantId}/v2.0'
    subject: managedIdentity.properties.principalId
  }
}
```

Couple of important parts from the above:

`AzureADMultipleOrgs` as the `signInAudience` value means that it's multi-tenant app
and can be used from other tenants as well.

`api://AzureADTokenExchange` as the `audiences` value is used to
establish a connection between your managed identity and Entra ID.
For more information read 
[Overview of federated identity credentials in Microsoft Entra ID](https://learn.microsoft.com/en-us/graph/api/resources/federatedidentitycredentials-overview?view=graph-rest-1.0).

Here is the managed identity that got created:

{% include imageEmbed.html link="/assets/posts/2025/01/06/mi-across-tenants/umi.png" %}

Here is the app registration that got created and it's _Federated credentials_:

{% include imageEmbed.html link="/assets/posts/2025/01/06/mi-across-tenants/umi2.png" %}

Here are the details of the _Federated credentials_:

{% include imageEmbed.html link="/assets/posts/2025/01/06/mi-across-tenants/umi3.png" %}

Important parts from the above _Federated credentials_:

`Issuer` is set to be tenant `f96...d2f` (Contoso). 

`Subject` is set to be managed identity `02d...57d`.
It matches the managed identity _Object (principal) ID_:

{% include imageEmbed.html link="/assets/posts/2025/01/06/mi-across-tenants/umi-principal.png" %}

In order to test this out, I'll just create Virtual Machine and assign that
managed identity to it:

{% include imageEmbed.html link="/assets/posts/2025/01/06/mi-across-tenants/umi4.png" %}

Before I jump into code, I'll give these links for you to study for more background information
how managed identities and federate credentials work:

[How managed identities for Azure resources work with Azure virtual machines](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/how-managed-identities-work-vm)

[Access token request with a federated credential](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow#third-case-access-token-request-with-a-federated-credential)

Okay now we're ready to execute _Raw HTTP Requests_ and study how this setup works.
I'm using extremely powerful combo:
[VS Code](https://code.visualstudio.com/),
[Remote Development using SSH](https://code.visualstudio.com/docs/remote/ssh),
and
[REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
extension in my demo setup.

To connect to remote machine, just use the _Remote-SSH_ commands:
{% include imageEmbed.html imagesize="60%" link="/assets/posts/2025/01/06/mi-across-tenants/vscode-remote-ssh.png" %}

The bottom left corner shows that you're connected to the remote:

{% include imageEmbed.html imagesize="40%" link="/assets/posts/2025/01/06/mi-across-tenants/vscode-remote-ssh2.png" %}

Now we're ready with VS Code setup:

{% include imageEmbed.html size="100%" link="/assets/posts/2025/01/06/mi-across-tenants/vscode.png" %}

First, we'll fetch the managed identity token for resource `api://AzureADTokenExchange`:

```powershell
###
# @name miTokenResponse
GET http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=api://AzureADTokenExchange
Metadata: true
```

I'll copy the received access token to 
[https://jwt.ms](https://jwt.ms/) for analysis:

{% include imageEmbed.html link="/assets/posts/2025/01/06/mi-across-tenants/jwt-umi.png" %}

From the above token everything else is as expected
except `aud` (audience) with value `f8cdef31-a31e-4b4a-93e4-5f571e91255a`. That value happens to be
[Microsoft Service's Microsoft Entra tenant ID](https://learn.microsoft.com/en-us/troubleshoot/entra/entra-id/governance/verify-first-party-apps-sign-in#verify-a-first-party-microsoft-service-principal-through-powershell).

Since we happen to have this setup in our _Contoso_ tenant, 
we can try to use that directly against our home tenant. 
I don't think this has use case (federated credentials in your home tenant)
but we can certainly try that:

```powershell
{% raw %}
### Home tenant
# @name entraTokenResponse
POST https://login.microsoftonline.com/{{home_tenant_id}}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

scope=api://AzureADTokenExchange/.default
&client_id={{home_client_id}}
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion={{miTokenResponse.response.body.access_token}}
&grant_type=client_credentials
{% endraw %}
```

This is the token received from the above:

{% include imageEmbed.html link="/assets/posts/2025/01/06/mi-across-tenants/jwt-home-tenant.png" %}

TBA: Test with e.g., Management Azure. Grant RBAC and test. Explain that you can do this directly without federated setup.

TBD: Again, no big surprises here. 

Now, we can communicate with _Litware_ to enable this access from their end.

### Litware setup

TBA: Contoso to share these details to Litware.

You **might at first think** that the setup starts by creating _a new App Registration_
at the _Litware_ tenant with same values as in the above _Contoso_ setup
for _Issuer_ and _Subject_:

`Issuer` is set to be tenant of _Contoso_: `f96...d2f`. 

`Subject` is set to be identifier of the managed identity in the _Contoso_ tenant: `02d...57d`.

If you _would_ do the above, and you would test this at setup at the _Contoso_, then 
you would run into issues:

TBA: Litware to share tenant id and client id to Contoso.

```powershell
{% raw %}
### To Litware tenant
# @name entraTokenResponse
POST https://login.microsoftonline.com/{{target_tenant_id}}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

scope=api://AzureADTokenExchange/.default
&client_id={{target_client_id}}
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion={{miTokenResponse.response.body.access_token}}
&grant_type=client_credentials
{% endraw %}
```

TBD: Scope.

- You have manually created new app reg to target tenant:

> **AADSTS700213**: No matching federated identity record found for
> presented assertion subject '02d...57d'.
> Check your federated identity credential Subject,
> Audience and Issuer against the presented assertion.

- You update the subject to match '02d...57d'

> **AADSTS700236**: Entra ID tokens issued by issuer
> 'https://login.microsoftonline.com/f96...d2f/v2.0'
> may not be used for federated identity credential
> flows for applications or managed identities registered in this tenant. 

Okay adding this via _a new app registration_ is not the way to go.
Let's review documentation about [How and why applications are added to Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity-platform/how-applications-are-added):

> A reference back to an application object through the application ID property<br/>
> ...<br/>
> **An application has one application object in its home directory** that
> is **referenced by one or more service principals in each of the directories where it operates**
> (including the application's home directory).

<!-- 
[Grant tenant-wide admin consent to an application](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/grant-admin-consent)
 -->

[New-AzADServicePrincipal](https://learn.microsoft.com/en-us/powershell/module/az.resources/new-azadserviceprincipal?view=azps-13.0.0)

```powershell
New-AzADServicePrincipal -ApplicationId "d70...c6f"
```

{% include imageEmbed.html link="/assets/posts/2025/01/06/mi-across-tenants/new-spn.png" %}

You can find this in the _Enterprise apps_:

{% include imageEmbed.html link="/assets/posts/2025/01/06/mi-across-tenants/enterprise-apps.png" %}

If we now repeat the above test at the _Contoso_ side, then we wouldn't get anymore errors
and we would get correct token:

{% include imageEmbed.html link="/assets/posts/2025/01/06/mi-across-tenants/jwt-another-tenant.png" %}

From the above token, we can see that identifiers have been changed to match
_Litware_ tenant.

_Litware_ admins can now grant access to that application. 
E.g., `Reader` access to `NetworkWatcherRG` resource group:

{% include imageEmbed.html link="/assets/posts/2025/01/06/mi-across-tenants/grant-reader-access.png" %}

Now _Contoso_ can change the code to request token for managing Azure:

{% include imageEmbed.html link="/assets/posts/2025/01/06/mi-across-tenants/jwt-another-tenant-management.png" %}

### Code

Here is the full code snippet used in the above:

```powershell
{% raw %}
@managed_identity_client_id = {{$dotenv managed_identity_client_id}}

@home_tenant_id = {{$dotenv home_tenant_id}}
@home_client_id = {{$dotenv home_client_id}}

@target_tenant_id = {{$dotenv target_tenant_id}}
@target_client_id = {{$dotenv target_client_id}}
@target_subscription_id = {{$dotenv target_subscription_id}}

###
# @name miTokenResponse
GET http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=api://AzureADTokenExchange
Metadata: true

### Home tenant ✅
# @name entraTokenResponse
POST https://login.microsoftonline.com/{{home_tenant_id}}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

scope=api://AzureADTokenExchange/.default
&client_id={{home_client_id}}
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion={{miTokenResponse.response.body.access_token}}
&grant_type=client_credentials

### Home tenant to specific service ✅
# @name entraTokenResponse
POST https://login.microsoftonline.com/{{home_tenant_id}}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

scope=https://storage.azure.com/.default
&client_id={{home_client_id}}
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion={{miTokenResponse.response.body.access_token}}
&grant_type=client_credentials

### To another tenant (after admin adding SPN) ✅
# @name entraTokenResponse
POST https://login.microsoftonline.com/{{target_tenant_id}}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

scope=api://AzureADTokenExchange/.default
&client_id={{target_client_id}}
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion={{miTokenResponse.response.body.access_token}}
&grant_type=client_credentials

### To another tenant to specific service ✅
# @name entraStorageTokenResponse
POST https://login.microsoftonline.com/{{target_tenant_id}}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

scope=https://storage.azure.com/.default
&client_id={{target_client_id}}
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion={{miTokenResponse.response.body.access_token}}
&grant_type=client_credentials

### To another tenant to specific service ✅
# @name entraManagementTokenResponse
POST https://login.microsoftonline.com/{{target_tenant_id}}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

scope=https://management.azure.com/.default
&client_id={{target_client_id}}
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion={{miTokenResponse.response.body.access_token}}
&grant_type=client_credentials

### Query resource groups ✅
GET https://management.azure.com/subscriptions/{{target_subscription_id}}/resourceGroups?api-version=2024-08-01
Content-Type: application/application/json
Authorization: Bearer {{entraManagementTokenResponse.response.body.access_token}}
{% endraw %}
```

## Conclusion

TBA: Close relative to my previous post ...cross tenant access.
You want to monitor SPNs coming from another tenant.
