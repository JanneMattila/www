---
layout: posts
title:  "Understanding Virtual Network service endpoints"
image: /assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/alert-list.png
date:   2023-11-20 06:00:00 +0300
categories: azure
tags: azure security defender
---
_Virtual Network service endpoints_ topic has come up few times in last month, so I decided to write a blog post about it.
It's not a new thing but it's still something that people have missed or don't quite understood how it works in practise.
Therefore, I'll try to go it through with very concrete example.

From [Virtual Network service endpoints](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-service-endpoints-overview) documentation:

> Today, any routes in your virtual network that force internet traffic
> to your on-premises and/or virtual appliances also force Azure service
> traffic to take the same route as the internet traffic.
> Service endpoints provide optimal routing for Azure traffic.
> ...
> **Endpoints always take service traffic directly from your virtual network to the service on the Microsoft Azure backbone network.**

## Test setup

[Installing PowerShell on Ubuntu](https://learn.microsoft.com/en-us/powershell/scripting/install/install-ubuntu?view=powershell-7.3)

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/azure-resources.png" %}

Here is _simplified version_ of the script:

```powershell
$storageResourceGroup = "rg-vnet-service-endpoints-demo"
$storageName = "stvnetstorageendpoints"
$operationsTableName = "operations"
$ticksPerDay = [timespan]::FromDays(1).Ticks

"Get Storage context"
$storage = Get-AzStorageAccount -ResourceGroupName $storageResourceGroup -Name $storageName
$context = $storage.Context

New-AzStorageTable -Name $operationsTableName -Context $context -ErrorAction Continue
$operationsTable = (Get-AzStorageTable -Name $operationsTableName -Context $context).CloudTable

$messageNumber = 1
while ($true) {
    $now = Get-Date -AsUtc
    $partitionKey = $now.ToString("yyyy-MM-dd")
    $rowKey = $ticksPerDay - $now.TimeOfDay.Ticks

    $row = [PSCustomObject]@{
        PartitionKey = $partitionKey
        RowKey       = $rowKey
        Properties   = @{ 
            "Message"       = "OK"
            "MessageNumber" = $messageNumber++
            "Timestamp"     = $now
        }
    }

    "Adding operation"
    Add-AzTableRow `
        -Table $operationsTable `
        -PartitionKey $row.PartitionKey `
        -RowKey $row.RowKey `
        -Property $row.Properties

    Start-Sleep -Seconds 1
}
```

### Test 1: No UDRs and no service endpoints

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/vm1.png" %}

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/no-service-endpoints.png" %}


### Test 2: UDR and no service endpoints


{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/vm2.png" %}

```powershell
# Add route to NVA
$routeTable = Get-AzRouteTable -ResourceGroupName "rg-vnet-service-endpoints-demo" -Name "rt-app"
Add-AzRouteConfig -Name "to-nva" -AddressPrefix 0.0.0.0/0 -NextHopType "VirtualAppliance" -NextHopIpAddress 10.10.10.10 -RouteTable $routeTable 
$routeTable | Set-AzRouteTable

Start-Sleep 120

# Remove route
$routeTable | Remove-AzRouteConfig -Name "to-nva" | Set-AzRouteTable
```

{% include imageEmbed.html link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/route.png" %}

{% include imageEmbed.html link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/table-120-seconds.png" %}

### Test 3: UDR and Storage service endpoint

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/vm3.png" %}

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/service-endpoint-storage.png" %}

Best way to see the _effective routes_ is to go to:

**Virtual Machine > Networking > Network interface > Effective routes**

Note: Virtual machine has to be running in order to see the effective routes.

{% include imageEmbed.html link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/effective-routes.png" %}

There are two `VirtualNetworkServiceEndpoint` routes with many address prefixes.
You can pick one and validate that it's indeed Storage IP address range:

```powershell
Get-AzureDatacenterIPOrNo -IP 191.239.203.0 | Format-Table
```

Here is the output:

```text
IpRange          Source                      SystemService Ip            Region
-------          ------                      ------------- --            ------
191.239.203.0/28 ServiceTags_Public_20231106 AzureStorage  191.239.203.0 
191.239.203.0/28 ServiceTags_Public_20231106 AzureStorage  191.239.203.0 westeurope
191.239.200.0/22 ServiceTags_Public_20231106               191.239.203.0 westeurope
191.239.200.0/22 ServiceTags_Public_20231106               191.239.203.0
```

### Other resources

[Does my traffic stay on the Microsoft Network? -- Adam Stuart](https://www.youtube.com/watch?v=ssrAPwOKw4g)

### Summary

<!--

https://github.com/Azure/azure-powershell/issues/16861

https://www.automagical.eu/posts/using-azure-storage-tables/

https://github.com/AndrevdG/AzStorageTableEntity

-->