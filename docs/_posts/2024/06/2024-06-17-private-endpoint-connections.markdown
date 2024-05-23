---
title: Find cross-tenant private endpoint connections
image: /assets/posts/2024/06/17/private-endpoint-connections/appgw.png
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

Let's look this example from the eyes of our dear fictitious companies: Contoso and Litware.
Contoso is a service provider and Litware is a customer of that service.
In order to share data between these companies, Contoso has created storage account
and Litware will connect to that storage account using private endpoint.

Here is high-level overview of the above scenario:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/storage-pec1.png" %}

Contoso has created `stprovider` storage account into resource group `rg-provider`:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/provider1.png" %}

Contoso shares the `ResourceID` of the storage account with Litware:

```
/subscriptions/<contoso>/resourceGroups/rg-provider/providers/Microsoft.Storage/storageAccounts/stprovider
```

And since they're going to use `blob` for data sharing, they'll share sub-resource `blob` with Litware as well.

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

Litware can now see this approved connection and with both messages are stored in
the private endpoint as well:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/pe9.png" %}

If Contoso tries to access now the private endpoint, they'll see same error as Litware did before:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/pe10.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/pe11.png" %}

Now the handshake is complete and Litware can start using the private endpoint to access the storage account.

## Finding cross-tenant private endpoint connections

The above scenario might not be relevant to every company, so maybe you want to 
[limit cross-tenant private endpoint connections](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/limit-cross-tenant-private-endpoint-connections).
This Azure Policy based approach can helps you to prevent them to be created
and you can always make exemptions if needed.

Next, I'll show you how to find all the cross-tenant private endpoint connections in your environment.

Let's study Storage Account we created in the above example:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/private-endpoint-connections/pe12.png" %}

We can see that both parties have resource IDs to the other party's target resources.
This is the key to finding cross-tenant private endpoint connections.

https://learn.microsoft.com/en-us/azure/governance/resource-graph/reference/supported-tables-resources



[Get-AzPrivateEndpointConnection](https://learn.microsoft.com/en-us/powershell/module/az.network/get-azprivateendpointconnection?view=azps-11.6.0)

https://learn.microsoft.com/en-us/rest/api/storagerp/private-endpoint-connections/list?view=rest-storagerp-2023-01-01&tabs=HTTP

https://github.com/Azure/azure-powershell/blob/main/src/Network/Network/PrivateLinkService/PrivateLinkServiceProvider/ProviderConfiguration.cs

https://github.com/Azure/azure-powershell/blob/main/documentation/development-docs/examples/private-link-resource-example.md?plain=1


https://learn.microsoft.com/en-us/azure/private-link/manage-private-endpoint?tabs=manage-private-link-powershell


