---
title: Network security groups and Flush Connection property
image: /assets/share.png
date: 2030-12-31 06:00:00 +0300
layout: posts
categories: azure
tags: azure chaos-studio chaos-engineering chaos-mesh kubernetes aks
---

I previously wrote about
[Network security groups and existing connections]({% post_url 2024/03/2024-03-18-network-security-groups-and-existing-connections %})
which explains how Network Security Groups (NSG) work in Azure.

However, there is a new property `flushConnection` in
[Network Security Group](https://learn.microsoft.com/en-us/azure/templates/microsoft.network/networksecuritygroups?pivots=deployment-language-bicep):
<!--
- NSG Flush Connection
  - https://learn.microsoft.com/en-us/powershell/module/az.network/new-aznetworksecuritygroup?view=azps-13.3.0
  - https://learn.microsoft.com/en-us/azure/templates/microsoft.network/networksecuritygroups?pivots=deployment-language-bicep
  - https://learn.microsoft.com/en-us/dotnet/api/microsoft.azure.management.network.models.networksecuritygroup.flushconnection?view=azure-dotnet

https://learn.microsoft.com/en-us/dotnet/api/microsoft.azure.management.network.models.virtualnetwork.flowtimeoutinminutes?view=azure-dotnet
-->

> **flushConnection**<br/>
> When enabled, **flows created from Network Security Group connections will be re-evaluated when rules are updates**.
> Initial enablement will trigger re-evaluation.

To enable this functionality, you need to set `flushConnection` to `true`:

```bicep
resource nsg 'Microsoft.Network/networkSecurityGroups@2023-11-01' = {
  name: nsgName
  location: location
  properties: {
    flushConnection: true // <- This is the new property
    securityRules: [
      {
        name: 'HttpInbound'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '80'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny' // Toggle with 'Allow'
          priority: 100
          direction: 'Inbound'
        }
      }
    ]
  }
}
```

Let's see how it looks in practice. I'll repeat the same example as in the previous post but with the new property.

```powershell
New-AzResourceGroupDeployment: C:\GitHub\JanneMattila\bicep-demos\nsg\deploy.ps1:38:11
Line |
  38 |  $result = New-AzResourceGroupDeployment `
     |            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     | 11.00.00 - The deployment 'Local-2024-06-25-10-59-44' failed with error(s). Showing 1 out of 1 error(s). Status Message: Network Security Group Connection Flushing is 
     | not enabled yet for uksouth region. Please set networkSecurityGroup.FlushConnection property to false. (Code: FlushingNetworkSecurityGroupConnectionIsNotEnabled)      
     | CorrelationId: 674b9a1f-7516-44d0-81c2-db7666973e76
```
