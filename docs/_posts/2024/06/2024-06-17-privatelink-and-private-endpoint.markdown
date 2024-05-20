---
title: Privatelink and Private Endpoint
image: /assets/posts/2024/06/17/privatelink-and-private-endpoint/appgw.png
date: 2024-06-17 06:00:00 +0300
layout: posts
categories: azure
tags: azure networking
---

https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/limit-cross-tenant-private-endpoint-connections

https://medium.com/@mbnarayn/demystifying-azure-private-link-private-endpoints-and-service-endpoints-7b309ba96fa1

https://learn.microsoft.com/en-us/rest/api/managed-grafana/private-endpoint-connections/approve?view=rest-managed-grafana-2023-09-01&tabs=HTTP

https://learn.microsoft.com/en-us/rest/api/storagerp/private-endpoint-connections/list?view=rest-storagerp-2023-01-01&tabs=HTTP

https://learn.microsoft.com/en-us/powershell/module/az.network/get-azprivateendpointconnection?view=azps-11.6.0

Get-AzPrivateLinkServiceConnection
Get-AzPrivateEndpointConnection

resources
| where type =~ "microsoft.network/privateendpoints"

https://github.com/Azure/azure-powershell/blob/main/src/Network/Network/PrivateLinkService/PrivateLinkServiceProvider/ProviderConfiguration.cs

https://github.com/Azure/azure-powershell/blob/main/documentation/development-docs/examples/private-link-resource-example.md?plain=1

{
    "id": "/subscriptions/4996cfa8-dd39-415b-a61c-db0f570047a4/resourceGroups/rg-pe/providers/Microsoft.Storage/storageAccounts/storpe0000000001/privateEndpointConnections/storpe0000000001.2469a85c-edd0-4aad-adf8-724d39229c2d",
    "name": "storpe0000000001.2469a85c-edd0-4aad-adf8-724d39229c2d",
    "type": "Microsoft.Storage/storageAccounts/privateEndpointConnections",
    "properties": {
        "provisioningState": "Succeeded",
        "privateEndpoint": {
            "id": "/subscriptions/04d6ee86-acba-4f1a-8990-d86cec229824/resourceGroups/rg-private-endpoint/providers/Microsoft.Network/privateEndpoints/pe-to-another-tenant"
        },
        "privateLinkServiceConnectionState": {
            "status": "Approved",
            "description": "Request from customer XYZ approved by CR #12345",
            "actionRequired": "None"
        }
    }
}

https://learn.microsoft.com/en-us/azure/private-link/manage-private-endpoint?tabs=manage-private-link-powershell

- Get-AzPrivateLinkResource
  - https://learn.microsoft.com/en-us/powershell/module/az.network/get-azprivatelinkresource?view=azps-11.5.0
  - https://learn.microsoft.com/en-us/azure/private-link/manage-private-endpoint?tabs=manage-private-link-powershell#determine-groupid-and-membername

Get-AzPrivateLinkResource -PrivateLinkResourceId "/subscriptions/4996cfa8-dd39-415b-a61c-db0f570047a4/resourceGroups/rg-pe/providers/Microsoft.Storage/storageAccounts/storpe0000000001"

  
  https://learn.microsoft.com/en-us/azure/governance/resource-graph/reference/supported-tables-resources
<!--

-->

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/17/privatelink-and-private-endpoint/appgw.png" %}

TBA: Analyze your deployed  private endpoints to another tenants.