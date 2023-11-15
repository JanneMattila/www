---
layout: posts
title:  "Understanding Virtual Network service endpoints"
image: /assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/alert-list.png
date:   2023-11-20 06:00:00 +0300
categories: azure
tags: azure security defender
---
_Virtual Network service endpoints_ topic has come up few times in the last month, 
so I decided to write a blog post about it.
It's not a new thing but it's still something that people have missed or haven't quite understood how it works in practise.
Therefore, I'll try to go it through with very concrete example.

From [Virtual Network service endpoints](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-service-endpoints-overview) documentation:

> Today, any routes in your virtual network that force internet traffic
> to your on-premises and/or virtual appliances also force Azure service
> traffic to take the same route as the internet traffic.
> Service endpoints provide optimal routing for Azure traffic.
> ...
> **Endpoints always take service traffic directly from your virtual network to the service on the Microsoft Azure backbone network.**

## Test setup

To show this in practise, I'm going to build following test setup:

Application running in virtual machine and it's sending data to [Azure Table Storage](https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-overview).
Virtual machine is running in subnet which has [User-Defined Route (UDR)](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-udr-overview) and it forces **all** traffic to _Network Virtual Appliance (NVA)_.

Here are the Azure resources that are needed for this test setup:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/azure-resources.png" %}

Application is simple PowerShell script that sends data to Azure Table Storage.
I'm using Ubuntu virtual machine so I 
[installed PowerShell](https://learn.microsoft.com/en-us/powershell/scripting/install/install-ubuntu?view=powershell-7.3)
to it.

Here is _simplified vanilla PowerShell version_ of the script using managed identity and Azure Table Storage REST API:

```powershell
$storageName = "stvnetstorageendpoints"
$operationsTableName = "operations"
$ticksPerDay = [timespan]::FromDays(1).Ticks
$messageNumber = 1

$url = "https://$storageName.table.core.windows.net/$operationsTableName"
$headers = @{
    "x-ms-version" = "2023-11-03"
    "Accept"       = "application/json;odata=nometadata"
    "Prefer"       = "return-no-content"
}

$token = Invoke-RestMethod `
    -Headers @{ Metadata = "true" } `
    -Uri "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://$storageName.table.core.windows.net/"
$secureAccessToken = ConvertTo-SecureString -AsPlainText -String $token.access_token

Invoke-RestMethod `
    -Body (ConvertTo-Json @{ "TableName" = "$operationsTableName" }) `
    -ContentType "application/json" `
    -Method "POST" `
    -Authentication Bearer `
    -Headers $headers `
    -Token $secureAccessToken `
    -Uri "https://$storageName.table.core.windows.net/Tables" `
    -ErrorAction SilentlyContinue

while ($true) {
    $body = ConvertTo-Json @{ 
        "PartitionKey"  = Get-Date -AsUtc -Format "yyyy-MM-dd"
        "RowKey"        = [string]($ticksPerDay - (Get-Date -AsUtc).TimeOfDay.Ticks)
        "MessageTime"   = Get-Date -AsUtc
        "Message"       = "OK"
        "MessageNumber" = $messageNumber++
    }

    Invoke-RestMethod `
        -Body $body `
        -ContentType "application/json" `
        -Method "POST" `
        -Authentication Bearer `
        -Headers $headers `
        -Token $secureAccessToken `
        -TimeoutSec 5 `
        -Uri $url | Out-Null

    Start-Sleep -Seconds 1
}
```

And as always, full source code is available in the GitHub:

{% include githubEmbed.html text="JanneMattila/powershell-demos" link="JanneMattila/powershell-demos" %}

Now we have all the pieces in place and we can start testing.

### Test 1: No UDRs and no service endpoints

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/vm1.png" %}

We haven't yet enabled any services endpoints for that subnet:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/no-service-endpoints.png" %}

No big suprises in this test. Everything works as expected.
Traffic flows using the _default system routes_. 
Public IP is used for outbound communication to the internet.

We can see data in the table storage exactly as we expected:

{% include imageEmbed.html link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/table-data.png" %}

_Okay this is slightly off-topic_ but you might be wondering, 
is the outbound traffic really using public IP address?

If you do `curl https://myip.jannemattila.com` response will you your Public IP.
So yes in that regards.

Therefore you might be tempted to think that you can use that IP for Storage account firewall:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/storage-fw.png" %}

But after you enable that you see that our application is not able to communicate to the storage account anymore:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/ssh-failed.png" %}

Error message is: 

```json
{
  "odata.error": {
    "code": "AuthorizationFailure",
    "message": {
    "lang": "en-US",
    "value": "This request is not authorized to perform this operation\nRequestId:5f73e099-a002-006e-5230-17757c000000\nTime:2023-11-14T19:30:02.6638006Z"
    }
  }
}
```

Reason is simple and documented in
[Restrictions for IP network rules](https://learn.microsoft.com/en-us/azure/storage/common/storage-network-security?tabs=azure-portal#restrictions-for-ip-network-rules).

> **You can't use IP network rules** in the following cases:<br/>
> ...
> **IP network rules have no effect on requests that originate from the same Azure region as the storage account**.
> ...
> Services deployed in the same region as the storage account **use private Azure IP addresses for communication**.
> So, you can't restrict access to specific Azure services based on their public outbound IP address range.

### Test 2: UDR and no service endpoints

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/vm2.png" %}

In this test setup we will use UDR to force all traffic to NVA.
But since this is test setup, we don't have NVA running and those packages will be send to `/dev/null` (=dropped).

With this script we can enable `0.0.0.0/0` route to NVA, let it impact for e.g., 120 seconds and then remove that route:

```powershell
# Add route to NVA
$routeTable = Get-AzRouteTable -ResourceGroupName "rg-vnet-service-endpoints-demo" -Name "rt-app"
Add-AzRouteConfig -Name "to-nva" -AddressPrefix 0.0.0.0/0 -NextHopType "VirtualAppliance" -NextHopIpAddress 10.10.10.10 -RouteTable $routeTable 
$routeTable | Set-AzRouteTable

Start-Sleep -Seconds 120

# Remove route
$routeTable | Remove-AzRouteConfig -Name "to-nva" | Set-AzRouteTable
```

When `to-vna` route is in use, you should see this in the route table:

{% include imageEmbed.html link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/route.png" %}

Any connections, like SSH, will get stuck during this time period.

This is also visible in our data since data upload was blocked for 2 minutes and 13 seconds:

{% include imageEmbed.html link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/table-120-seconds.png" %}

That was due to default value of `-TimeoutSec` parameter in
[Invoke-RestMethod](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/invoke-restmethod)
with `indefinite` timeout.

If I change that to e.g., 5 seconds, then I'll see packet drops:

{% include imageEmbed.html link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/table-120-seconds-packet-drop.png" %}

If I now improve upload logic by introducing simple queue for failed messages and re-process them, I can now see those errors in the table:

{% include imageEmbed.html link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/table-120-seconds-queue.png" %}

Error message is: `The request was canceled due to the configured HttpClient.Timeout of 5 seconds elapsing.`

Now we have seen that UDR works as expected. It forces all traffic to NVA
and our application is not able to send data to the table storage
in this test setup.

Since our UDR forced **all** the traffic to NVA, 
it means that no other outbound traffic to internet
actually worked during the test period.

### Test 3: UDR and Storage service endpoint

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/vm3.png" %}

In this test setup we will enable `Microsoft.Storage` service endpoint for the subnet:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/service-endpoint-storage.png" %}

Above setting changes the routing behavior in the network. 
Best way to see the _effective routes_ is to go to:

**Virtual Machine > Networking > Network interface > Effective routes**

> Virtual machine has to be running in order to see the effective routes.
> And unfortunately no, you cannot test this with just network interface.

Here are the effective routes from our test setup:

{% include imageEmbed.html link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/effective-routes.png" %}

There are two `VirtualNetworkServiceEndpoint` routes with _many many many_ address prefixes.
Yes, it would be nice to have some additional metadata in the view to make it easier to understand
which service endpoint is responsible for which route.
You can pick any of the IP addresses and validate that it's indeed from Storage account IP address range:

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

Above routing definitions are more specific and thus override our `to-nva` route.
Traffic is therefore directly routed to the Storage account.

Let's test this in practice. I will enable `to-nva` route for 120 seconds and then remove it
similarly as in previous test.

SSH gets stuck as previously:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/ssh-stuck.png" %}

However, our application continuous to pump data to the table storage without any issues:

{% include imageEmbed.html link="/assets/posts/2023/11/20/understanding-virtual-network-service-endpoints/table-storage-works.png" %}

So it works as expected. Traffic to the Storage account is not impacted by the UDR.
This also explains why you don't see this traffic in your NVA logs.

### Summary

I hope I managed to explain how Virtual Network service endpoints work in practise.
I think it's valuable to give tools for people to understand how things work.

https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-udr-overview#how-azure-selects-a-route

If multiple routes contain the same address prefix, Azure selects the route type, based on the following priority:
User-defined route
BGP route
System route

I can't recommend enough this video to get better understanding about routing in Azure:

["Does my traffic stay on the Microsoft Network?" -- Adam Stuart](https://www.youtube.com/watch?v=ssrAPwOKw4g)

I'm planning to write more about this topic in the future and especially about
SNAT port exchaustion which every now and then causes issues for people.

I hope you find this useful!
