---
title: Find cross-tenant private endpoint connections
image: /assets/posts/2024/06/17/private-endpoint-connections/storage-pec1.png
date: 2024-06-17 06:00:00 +0300
layout: posts
categories: azure
tags: azure networking
---

[Private endpoints](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview)
is a capability which allows you to access various services over a private connection.
Private endpoints are commonly used with services like Azure Storage, Azure SQL Database, and Azure Key Vault.
If you're developing your own service, then you can use
[Private Link Service](https://learn.microsoft.com/en-us/azure/private-link/private-link-service-overview).

Private endpoints can be used to connect services between different tenants.
This is useful when you have a service that you want to share with another tenant.
It can be storage account that you want the other party to connect and push data to.

Let's look this example from the eyes of our dear fictitious companies: **Contoso** and **Litware**.
Contoso is a service provider and Litware is a consumer of that service.
In order to share data between these companies, Contoso has created storage account
and Litware will connect to that storage account using private endpoint.

> **Note:**<br/>
> I'm using Storage account as an example here, but this can be any service that supports private endpoints.

Here is high-level overview of our scenario:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/storage-pec1.png" %}

Contoso has created `stprovider` storage account into resource group `rg-provider`:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/provider1.png" %}

Contoso shares the `ResourceID` of the storage account with Litware:

```
/subscriptions/<contoso>/resourceGroups/rg-provider/providers/Microsoft.Storage/storageAccounts/stprovider
```

And since they're going to use `blob` for data sharing, they'll share sub-resource `blob` with Litware as well.

---

> Hint:<br/>
> You can use [Get-AzPrivateLinkResource](https://learn.microsoft.com/en-us/powershell/module/az.network/get-azprivatelinkresource?view=azps-12.0.0&viewFallbackFrom=azps-11.5.0)
> cmdlet with resource ID to get all the supported
> sub-resource types for any service.

```powershell
Get-AzPrivateLinkResource `
  -PrivateLinkResourceId "/subscriptions/<contoso>/resourceGroups/rg-provider/providers/Microsoft.Storage/storageAccounts/stprovider" | `
  Format-Table
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/provider2.png" %}

You can read more about it at the
[Manage Azure private endpoints](https://learn.microsoft.com/en-us/azure/private-link/manage-private-endpoint?tabs=manage-private-link-powershell)
documentation.

---

Litware prepares their environment by creating resource group `rg-consumer`
and virtual network `vnet-consumer`:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/consumer1.png" %}

Now they're ready to create private endpoint to the storage account:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/pe1.png" %}

They input the `ResourceID` of the storage account and the sub-resource `blob`
as shared by Contoso. They also provide message that can be then
verified by Contoso later on when they're approving the connection:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/pe2.png" %}

After they have finished creating the private endpoint, they can see that the connection
is in `Pending` state:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/pe3.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/pe4.png" %}

If they now try to click the _Private link resource_ link in the above screenshot,
they'll get this error:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/pe5.png" %}

The above is of course expected, since it tries to navigate to the storage account
in Contoso's subscription and Litware does not have access to that subscription.

Now, Litware has to wait for Contoso to approve the connection.

Contoso now sees the pending request in their portal:

In storage account:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/pe6.png" %}

In Private Link Center:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/pe7.png" %}

They can now approve the connection and add their own message to the connection:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/pe8.png" %}

Litware can now see this approved connection and both messages are stored in
the private endpoint as well:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/pe9.png" %}

Similarly, Contoso sees the connection:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/pe12.png" %}

> **Note:**<br/>
> In the above screenshot, you can see that the original `requestMessage`
> is not stored in the connection.<br/>
> Therefore, it's good idea to just append your own note to the end of the original message.

If Contoso tries to access now the private endpoint, they'll see same error as Litware did before:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/pe10.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/pe11.png" %}

Now the handshake is complete and Litware can start using the private endpoint to access the storage account.

## Finding cross-tenant private endpoints and their connections

The above sharing scenario might not be relevant to every company, so maybe you want to 
[limit cross-tenant private endpoint connections](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/limit-cross-tenant-private-endpoint-connections).
This Azure Policy based approach helps you to prevent them to be created in the first place
and you can always make exemptions if needed.
This same sharing technique is used with managed private endpoints as well.

Next, I'll show you how to find all the cross-tenant private endpoints and their connections in your environment.

Let's study Storage Account we created in the above example:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/pe12.png" %}

We can see that we have resource IDs to the other party's target resource.
This is the key to finding cross-tenant private endpoint connections.

In the producer side, we can see this information stored in the `privateEndpointConnections` of the ARM object.
I want to use Resource Graph to find this information, so I looked prior art on this topic online.
I found this post which has good starting point for my Resource Graph query:

[An overview of Azure Managed Virtual Networks (Managed VNets)](https://www.jlaundry.nz/2024/overview_of_azure_managed_vnets/)

I wanted to collect additional information about the connection, so I decided to go full PowerShell way.
My implementation has these steps:

1. Get all subscriptions in the tenant.
2. Get all resources with `privateEndpointConnections`
3. Collect all the possible information about the connection.
  - Subscription and tenant information from both the source and target
4. Output the information to CSV file.

### Step 1: Get all subscriptions in the tenant

```sql
resourcecontainers
| where type == 'microsoft.resources/subscriptions'
| project  subscriptionId, name, tenantId
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/rg1.png" %}

In the above query, we're getting also all the tenant IDs used by the subscriptions.

### Step 2: Get all resources with `privateEndpointConnections`

```sql
resources
| where isnotnull(properties) and properties contains "privateEndpointConnections"
| where array_length(properties.privateEndpointConnections) > 0
| mv-expand properties.privateEndpointConnections
| extend status = properties_privateEndpointConnections.properties.privateLinkServiceConnectionState.status
| extend description = coalesce(properties_privateEndpointConnections.properties.privateLinkServiceConnectionState.description, "")
| extend privateEndpointResourceId = properties_privateEndpointConnections.properties.privateEndpoint.id
| extend privateEndpointSubscriptionId = tostring(split(privateEndpointResourceId, "/")[2])
| project id, name, location, type, resourceGroup, subscriptionId, tenantId, privateEndpointResourceId, privateEndpointSubscriptionId, status, description
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/rg2.png" %}

The above query heavily borrows the query structure presented in this
[post](https://www.jlaundry.nz/2024/overview_of_azure_managed_vnets/)
.

### Step 3: Collect all the possible information about the connection

I now use the previous information about the subscriptions and tenants to get more information about the connection.

If I have subscription and I don't tenant id of that subscription, then I'll make a simple call to get this information in the error message:

```powershell
$subscriptionResponse = Invoke-AzRestMethod -Path "/subscriptions/$($SubscriptionID)?api-version=2022-12-01"
$startIndex = $subscriptionResponse.Headers.WwwAuthenticate.Parameter.IndexOf("https://login.windows.net/")
$tenantID = $subscriptionResponse.Headers.WwwAuthenticate.Parameter.Substring($startIndex + "https://login.windows.net/".Length, 36)
```

`WWW-Authenticate` header contains the following error message:

```plain	
Bearer 
authorization_uri="https://login.windows.net/33e01921-4d64-4f8c-a055-5bdaffd5e33d",
error="invalid_token",
error_description="The access token is from the wrong issuer. 
It must match the tenant associated with this subscription. Please use correct authority to get the token."
```

From the above output, you can parse the tenant id e.g.,

`33e01921-4d64-4f8c-a055-5bdaffd5e33d`

Each of the tenant ids are then used to get more information about the tenant using Graph API:

```powershell
$tenantResponse = Invoke-AzRestMethod `
  -Uri "https://graph.microsoft.com/v1.0/tenantRelationships/findTenantInformationByTenantId(tenantId='$TenantID')"
$tenantInformation = ($tenantResponse.Content | ConvertFrom-Json)
$tenantInformation
```

The above has the following output:

```powershell
@odata.context      : https://graph.microsoft.com/v1.0/$metadata#microsoft.graph.tenantInformation
tenantId            : 33e01921-4d64-4f8c-a055-5bdaffd5e33d
federationBrandName : 
displayName         : MS Azure Cloud
defaultDomainName   : MSAzureCloud.onmicrosoft.com
```

This helps us better identify the tenants and see which ones are Microsoft managed and which ones are not.

### Step 4: Output the information to CSV file

After we have collected all the information, we can output it to CSV file.
Data in here is transposed so that it's easier to read:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/excel.png" %}

`External` column indicates if the connection is cross-tenant connection or not with `Yes` or `No` value.
If the value is `Managed by Microsoft`, then it's Microsoft managed tenant.

In short:

- `External` = `No` means that the connection is within the same tenant.
  - You should have many of these in your environment and these are mainly for information purposes.
    You can filter these out.
- `External` = `Managed by Microsoft` means that the tenant is Microsoft managed.
- `External` = `Yes` means that the connection is cross-tenant connection.
  - This is the value we're interested in. You can then filter the output based on this value.

Here is similar output but from different environment and some columns are removed:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/excel2.png" %}

### From Consumer (Litware) point of view

As shown in the above screenshots, Litware can see the connection in their portal:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/pe9.png" %}

We can do very similar process to `manualPrivateLinkServiceConnections` values.

Here is example output from that:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/excel3.png" %}

### Try it yourself

Here is the script to scan all the private endpoint connections in your environment:

{% include githubEmbed.html text="JanneMattila/some-questions-and-some-answers/scan-private-endpoint-connections.ps1" link="JanneMattila/some-questions-and-some-answers/blob/master/q%26a/scan-private-endpoint-connections.ps1" %}

```powershell
.\scan-private-endpoint-connections.ps1
```

I'll get list of all the private endpoint connections in my environment in CSV format.
And it has column to indicate if that is cross-tenant connection or not:

Here is abbreviated example of the output:

```plain
SubscriptionName        : development
SubscriptionID          : <contoso>
ResourceGroupName       : rg-provider
Name                    : stprovider
Type                    : Microsoft.Storage/storageAccounts
TargetResourceId        : /subscriptions/<litware>
                          /resourceGroups/rg-consumer
                          /providers/Microsoft.Network/privateEndpoints/pepstoragesvc
TargetSubscription      : <litware>
TargetTenantID          : <litware-tenant-id>
TargetTenantDisplayName : Litware
TargetTenantDomainName  : litware.onmicrosoft.com
Description             : Litware connecting to the shared storage account CR#12345 - APR#345
Status                  : Approved
External                : Yes
```

Similarly, you can scan the `manualPrivateLinkServiceConnections` values from the consumer side with this script:

{% include githubEmbed.html text="JanneMattila/some-questions-and-some-answers/scan-private-endpoints-with-manual-connections.ps1" link="JanneMattila/some-questions-and-some-answers/blob/master/q%26a/scan-private-endpoints-with-manual-connections.ps1" %}

```powershell
.\scan-private-endpoints-with-manual-connections.ps1
```

<!--
The above means that we need to scan our environment for these connections
using my favorite tool: PowerShell.
And since private endpoint connection is a child resource, then
we need to scan every resource that supports private endpoints.
This is a lot of calls to the Azure Resource Manager API.

Azure PowerShell has cmdlets to work with private endpoints and connections.<br/>
[Get-AzPrivateEndpointConnection](https://learn.microsoft.com/en-us/powershell/module/az.network/get-azprivateendpointconnection?view=azps-11.6.0)
is exactly what we need. It returns all the connections of the specified resource.

_And even better_, it just happens to have **optimization** which helps our implementation.
It has built-in list of resources that supports requesting this information,
and does fast exit if the resource does not support fetching this information.
You can find more details in the
[ProviderConfiguration.cs](https://github.com/Azure/azure-powershell/blob/main/src/Network/Network/PrivateLinkService/PrivateLinkServiceProvider/ProviderConfiguration.cs)
file. Look for `RegisterConfiguration` calls for each type.
-->

## Conclusion

I tried to explain how cross-tenant private endpoint connections work and how you can find them in your environment.
This is pretty complex topic and I hope I was able to explain it in a way that makes sense.

And I want to still highlight that this is about _connectivity_
and you still have authentication and authorization on top of this.
This is just one but important piece of the puzzle.

I hope you find this useful!
