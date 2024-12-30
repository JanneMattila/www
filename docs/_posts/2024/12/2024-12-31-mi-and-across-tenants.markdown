---
layout: posts
title: Managed Identity access across tenants
image: /assets/posts/2024/12/31/mi-across-tenants/mi-across-tenants.png
date: 2024-12-31 06:00:00 +0300
categories: azure
tags: azure managed-identify federation
---

When I saw post
[Effortlessly access cloud resources across Azure tenants without using secrets](https://devblogs.microsoft.com/identity/access-cloud-resources-across-tenants-without-secrets/)
I immediately wanted to take it for a spin.
_For background information, please check out the article first._

Jumping directly to my demo architecture:

{% include imageEmbed.html link="/assets/posts/2024/12/31/mi-across-tenants/mi-across-tenants-start.png" %}

As you can see from my diagram, I have my two favorite companies _Contoso_ and _Litware_
wanting to collaborate across their environments. 
_Contoso_ provides some services for _Litware_ and needs Azure access to do that.
Obviously, _Litware_ wants to control that access and they've now agreed to 
use the above setup for access management solution.

Let's start the setup from _Contoso_ side first.

### Contoso

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

The above uses 
[Bicep templates for Microsoft Graph](https://learn.microsoft.com/en-us/graph/templates/overview-bicep-templates-for-graph)
for creating app registration to Entra ID.

Couple of important parts from the above:

`AzureADMultipleOrgs` as the `signInAudience` value means that it's multi-tenant app
and can be used by other tenants as well.

`api://AzureADTokenExchange` is the value for `audiences`
that can appear in the external token for Microsoft Entra ID.
For more information read 
[Overview of federated identity credentials in Microsoft Entra ID](https://learn.microsoft.com/en-us/graph/api/resources/federatedidentitycredentials-overview?view=graph-rest-1.0).

Here is the managed identity that was created:

{% include imageEmbed.html link="/assets/posts/2024/12/31/mi-across-tenants/umi.png" %}

Here is the app registration that got created:

{% include imageEmbed.html link="/assets/posts/2024/12/31/mi-across-tenants/umi-app-reg-multitenant2.png" %}

It's configured to be _multitenant_:

{% include imageEmbed.html link="/assets/posts/2024/12/31/mi-across-tenants/umi-app-reg-multitenant.png" %}

And finally, here are the _Federated credentials_:

{% include imageEmbed.html link="/assets/posts/2024/12/31/mi-across-tenants/umi2.png" %}

Here are the configuration details of the _Federated credentials_:

{% include imageEmbed.html link="/assets/posts/2024/12/31/mi-across-tenants/umi3.png" %}

Important parts from the above _Federated credentials_:

`Issuer` is set to be tenant `f96...d2f` (_Contoso_). 

`Subject` is set to be managed identity `02d...57d`.
It matches the managed identity _Object (principal) ID_:

{% include imageEmbed.html link="/assets/posts/2024/12/31/mi-across-tenants/umi-principal.png" %}

To test this out, I'll just create Virtual Machine and assign that
managed identity to it:

{% include imageEmbed.html link="/assets/posts/2024/12/31/mi-across-tenants/umi4.png" %}

Before I jump into code, I'll give these links for you to study for more background information
on how managed identities and federate credentials work:

[How managed identities for Azure resources work with Azure virtual machines](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/how-managed-identities-work-vm)

[Access token request with a federated credential](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow#third-case-access-token-request-with-a-federated-credential)

[Configure an application to trust a managed identity](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation-config-app-trust-managed-identity?tabs=microsoft-entra-admin-center)

Okay, now we're ready to execute _Raw HTTP Requests_ and study how this setup works.
_Obviously_, in real applications you would use higher-level libraries and SDKs for handling
all of this, but I want this to be as low-level as possible so that you would understand what 
happens in those libraries.

For this demo setup I'm using extremely powerful combo:
[VS Code](https://code.visualstudio.com/),
[Remote Development using SSH](https://code.visualstudio.com/docs/remote/ssh),
and
[REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
extension.

To connect to a remote machine, just use the _Remote-SSH_ commands:
{% include imageEmbed.html imagesize="60%" link="/assets/posts/2024/12/31/mi-across-tenants/vscode-remote-ssh.png" %}

The bottom left corner shows that you're connected to the remote:

{% include imageEmbed.html imagesize="40%" link="/assets/posts/2024/12/31/mi-across-tenants/vscode-remote-ssh2.png" %}

Now we're ready with VS Code setup:

{% include imageEmbed.html size="100%" link="/assets/posts/2024/12/31/mi-across-tenants/vscode.png" %}

Since I'm now directly connected to my Azure VM, I can start executing HTTP requests directly from the editor.

First, we'll fetch the managed identity token for resource `api://AzureADTokenExchange`:

```powershell
###
# @name miTokenResponse
GET http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=api://AzureADTokenExchange
Metadata: true
```

Here's the output:

```json
{
  "access_token": "eyJ0...1Q",
  "client_id": "f31...d43",
  "expires_in": "86400",
  "expires_on": "1735625546",
  "ext_expires_in": "86399",
  "not_before": "1735538846",
  "resource": "api://AzureADTokenExchange",
  "token_type": "Bearer"
}
```

I'll copy the received access token to 
[https://jwt.ms](https://jwt.ms/) for analysis:

{% include imageEmbed.html link="/assets/posts/2024/12/31/mi-across-tenants/jwt-umi.png" %}

Here is the abbreviated version of the content:

```json
{
  "aud": "fb60f99c-7a34-4190-8149-302f77469936",
  "iss": "https://login.microsoftonline.com/f96...0d2f/v2.0",
  "azp": "f31...d43",
  "azpacr": "2",
  "idtyp": "app",
  "oid": "02d...57d",
  "sub": "02d...57d",
  "tid": "f96...d2f",
}
```

From the above token everything else is as expected
except `aud` (audience) with value `fb60f99c-7a34-4190-8149-302f77469936`.
That value happens to be _AAD Token Exchange Endpoint_ application so it's synonymous to `api://AzureADTokenExchange`:

{% include imageEmbed.html link="/assets/posts/2024/12/31/mi-across-tenants/aad-token-endpoint.png" %}

Home tenant of that above app is `f8cdef31-a31e-4b4a-93e4-5f571e91255a` which is
[Microsoft Service's Microsoft Entra tenant ID](https://learn.microsoft.com/en-us/troubleshoot/entra/entra-id/governance/verify-first-party-apps-sign-in#verify-a-first-party-microsoft-service-principal-through-powershell).

Since we happen to have this setup ready in our _Contoso_ tenant, 
we can try to use that directly against our home tenant:

```powershell
{% raw %}
### Get Storage token to Contoso tenant
# @name entraTokenResponse
POST https://login.microsoftonline.com/{{home_tenant_id}}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

scope=https://storage.azure.com/.default
&client_id={{home_client_id}}
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion={{miTokenResponse.response.body.access_token}}
&grant_type=client_credentials
{% endraw %}
```

Here's the output:

```json
{
  "token_type": "Bearer",
  "expires_in": 3599,
  "ext_expires_in": 3599,
  "access_token": "eyJ...c1g"
}
```

This is the token received from the above:

{% include imageEmbed.html link="/assets/posts/2024/12/31/mi-across-tenants/jwt-home-tenant-storage.png" %}

Here is the abbreviated version of the content:

```json
{
  "aud": "https://storage.azure.com",
  "iss": "https://login.microsoftonline.com/f96...0d2f/v2.0",
  "appid": "d70...c6f",
  "appidacr": "2",
  "idp": "https://sts.windows.net/f96...d2f/",
  "idtyp": "app",
  "tid": "f96...d2f"
}
```

So, we have now tested that we can use the federated credentials for acquiring access tokens in our _Contoso_ tenant.

If you paid attention in the above _app registration_ view, then you noticed that we didn't
create _service principal_ into our home tenant since we don't plan use it for e.g., granting
access. Here is an another _Multi-Tenant Example App 2_ application which has a service principal created
and that can be used in role assignments:

{% include imageEmbed.html imagesize="80%" link="/assets/posts/2024/12/31/mi-across-tenants/app-reg2.png" %}

The above setup was pretty clear and now we're able to continue the collaboration
with _Litware_ and we will share details about our app with them.

### Litware

You **might at first think** that the setup starts by creating _a new App Registration_
at the _Litware_ tenant with same values as in the above _Contoso_ setup
for _Issuer_ and _Subject_:

`Issuer` is set to be tenant of _Contoso_: `f96...d2f`. 

`Subject` is set to be identifier of the managed identity in the _Contoso_ tenant: `02d...57d`.

If you _would_ do the above, and share your newly created
_Application (client) ID_ `target_client_id` and
_Directory (tenant) ID_ `target_tenant_id` and 
ask them to test at _Contoso_, then you would run into issues:

```powershell
{% raw %}
### Get Storage token to Litware tenant
# @name entraStorageTokenResponse
POST https://login.microsoftonline.com/{{target_tenant_id}}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

scope=https://storage.azure.com/.default
&client_id={{target_client_id}}
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion={{miTokenResponse.response.body.access_token}}
&grant_type=client_credentials
{% endraw %}
```

The request would fail with the following error message:

> **AADSTS700236**: Entra ID tokens issued by issuer
> 'https://login.microsoftonline.com/f96...d2f/v2.0'
> may not be used for federated identity credential
> flows for applications or managed identities registered in this tenant. 

Connecting this federation via _a new app registration_ is not the way to go.
Let's review documentation about [How and why applications are added to Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity-platform/how-applications-are-added):

> A reference back to an application object through the application ID property<br/>
> ...<br/>
> **An application has one application object in its home directory** that
> is **referenced by one or more service principals in each of the directories where it operates**
> (including the application's home directory).

So, we need to **provision the app into the _Litware_ tenant**.
Read more about 
[Grant tenant-wide admin consent to an application](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/grant-admin-consent).

In this scenario, _Litware_ admins use
[New-AzADServicePrincipal](https://learn.microsoft.com/en-us/powershell/module/az.resources/new-azadserviceprincipal?view=azps-13.0.0)
to create a new service principal with existing application identifier:

```powershell
New-AzADServicePrincipal -ApplicationId "d70...c6f"
```

They can use 
[Azure Cloud Shell](https://learn.microsoft.com/en-us/azure/cloud-shell/overview) for that:

{% include imageEmbed.html link="/assets/posts/2024/12/31/mi-across-tenants/new-spn.png" %}

The application identifier used in the above (`"d70...c6f"`) matches _Application (client) ID_
of the multi-tenant app in the _Contoso_ tenant:

{% include imageEmbed.html link="/assets/posts/2024/12/31/mi-across-tenants/multi-tenant-client-id.png" %}

Remember that the above command works **only** if _Contoso_ has remembered
to create their application as multitenant app.

After the command has successfully finished, _Litware_ admins can find this application in their _Enterprise apps_ view:

{% include imageEmbed.html link="/assets/posts/2024/12/31/mi-across-tenants/enterprise-apps.png" %}

Let's now repeat the previous test again with updated application identifier `target_client_id`
in _Contoso_ environment:

```powershell
{% raw %}
### Get Storage token to Litware tenant
# @name entraStorageTokenResponse
POST https://login.microsoftonline.com/{{target_tenant_id}}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

scope=https://storage.azure.com/.default
&client_id={{target_client_id}}
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion={{miTokenResponse.response.body.access_token}}
&grant_type=client_credentials
{% endraw %}
```

Here's the output:

```json

{
  "token_type": "Bearer",
  "expires_in": 3598,
  "ext_expires_in": 3598,
  "access_token": "eyJ...WfQ"
}
```

{% include imageEmbed.html link="/assets/posts/2024/12/31/mi-across-tenants/jwt-another-tenant-storage.png" %}

Here is the abbreviated version of the content:

```json
{
  "aud": "https://storage.azure.com",
  "iss": "https://sts.windows.net/eac...691/",
  "appid": "d70...c6f",
  "appidacr": "2",
  "idp": "https://sts.windows.net/eac...691/",
  "idtyp": "app",
  "oid": "9b5...477",
  "sub": "9b5...477",
  "tid": "eac...691"
}
```

From the above token, we can see that identifiers have been changed to match
_Litware_ tenant identifiers, and everything is as expected.

_Litware_ admins can now proceed to grant required access to that application to their
Azure subscriptions so that _Contoso_ can do their required actions on those resources.

E.g., `Reader` access to `NetworkWatcherRG` resource group:

{% include imageEmbed.html link="/assets/posts/2024/12/31/mi-across-tenants/grant-reader-access.png" %}

Now _Contoso_ can change their code to request token for managing Azure (scope `https://management.azure.com/.default`):

```powershell
{% raw %}
### Get ARM token to Litware tenant
# @name entraManagementTokenResponse
POST https://login.microsoftonline.com/{{target_tenant_id}}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

scope=https://management.azure.com/.default
&client_id={{target_client_id}}
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion={{miTokenResponse.response.body.access_token}}
&grant_type=client_credentials
{% endraw %}
```

Here's the output:

```json
{
  "token_type": "Bearer",
  "expires_in": 3598,
  "ext_expires_in": 3598,
  "access_token": "eyJ...WfQ"
}
```

{% include imageEmbed.html link="/assets/posts/2024/12/31/mi-across-tenants/jwt-another-tenant-azure.png" %}

Here is the abbreviated version of the content:

```json
{
  "aud": "https://management.azure.com",
  "iss": "https://sts.windows.net/eac...691/",
  "appid": "d70...c6f",
  "appidacr": "2",
  "idp": "https://sts.windows.net/eac...691/",
  "idtyp": "app",
  "oid": "9b5...477",
  "sub": "9b5...477",
  "tid": "eac...691"
}
```

That token can be used to call Azure Rest APIs:

```powershell
{% raw %}
### Query resource groups from Litware subscription
GET https://management.azure.com/subscriptions/{{target_subscription_id}}/resourceGroups?api-version=2024-08-01
Content-Type: application/json
Authorization: Bearer {{entraManagementTokenResponse.response.body.access_token}}
{% endraw %}
```

Here's the output:

```json
{
  "value": [
    {
      "id": "/subscriptions/04d...824/resourceGroups/NetworkWatcherRG",
      "name": "NetworkWatcherRG",
      "type": "Microsoft.Resources/resourceGroups",
      "location": "northeurope",
      "properties": {
        "provisioningState": "Succeeded"
      }
    }
  ]
}
```

**Hurray!** We have now verified that _Contoso_ can now access _Litware_ resources without sharing any secrets.

Here's our updated architecture diagram to illustrate the above:

{% include imageEmbed.html link="/assets/posts/2024/12/31/mi-across-tenants/mi-across-tenants.png" %}

### Code

Here is the full code snippet used in the above examples:

```powershell
{% raw %}
@home_tenant_id = {{$dotenv home_tenant_id}}
@home_client_id = {{$dotenv home_client_id}}

@target_tenant_id = {{$dotenv target_tenant_id}}
@target_client_id = {{$dotenv target_client_id}}
@target_subscription_id = {{$dotenv target_subscription_id}}

###
# @name miTokenResponse
GET http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=api://AzureADTokenExchange
Metadata: true

### Get Storage token to Contoso tenant
# @name entraTokenResponse
POST https://login.microsoftonline.com/{{home_tenant_id}}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

scope=https://storage.azure.com/.default
&client_id={{home_client_id}}
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion={{miTokenResponse.response.body.access_token}}
&grant_type=client_credentials

### Get Storage token to Litware tenant
# @name entraStorageTokenResponse
POST https://login.microsoftonline.com/{{target_tenant_id}}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

scope=https://storage.azure.com/.default
&client_id={{target_client_id}}
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion={{miTokenResponse.response.body.access_token}}
&grant_type=client_credentials

### Get ARM token to Litware tenant
# @name entraManagementTokenResponse
POST https://login.microsoftonline.com/{{target_tenant_id}}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

scope=https://management.azure.com/.default
&client_id={{target_client_id}}
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion={{miTokenResponse.response.body.access_token}}
&grant_type=client_credentials

### Query resource groups from Litware subscription
GET https://management.azure.com/subscriptions/{{target_subscription_id}}/resourceGroups?api-version=2024-08-01
Content-Type: application/json
Authorization: Bearer {{entraManagementTokenResponse.response.body.access_token}}
{% endraw %}
```

You can find all the above code examples in my GitHub repo:

{% include githubEmbed.html text="JanneMattila/bicep-demos/graph" link="JanneMattila/bicep-demos/tree/master/graph" %}

## Conclusion

This feature announced at the post
[Effortlessly access cloud resources across Azure tenants without using secrets](https://devblogs.microsoft.com/identity/access-cloud-resources-across-tenants-without-secrets/)
is powerful and will be most likely used in various automations and deployments across tenants.

Of course, monitoring and managing these federated identity credentials is natural next step.
Maybe that's a topic for future blog posts.

I hope you find this useful!
