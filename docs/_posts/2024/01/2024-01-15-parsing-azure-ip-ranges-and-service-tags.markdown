---
layout: posts
title:  Parsing Azure IP Ranges and Service Tags JSON file
image: /assets/posts/2024/01/15/parsing-azure-ip-ranges-and-service-tags/nsg2.png
date:   2024-01-15 06:00:00 +0300
categories: azure
tags: azure management firewall
---
Sometimes you need to restrict traffic from your network
to only allowlisted Azure IP addresses or to allowed services.

Very simple example could be enabling _Application Insights_ monitoring
in an otherwise closed network. 
To achieve this, you need to know all the 
IP addresses used by Application Insights and enable
traffic to those IP addresses in your firewalls.
These individual service specific IP addresses are grouped together
into IP address prefixes and those prefixes are then grouped together into
[Service tags](https://learn.microsoft.com/en-us/azure/virtual-network/service-tags-overview).
That page tells that `AzureMonitor` service tag contains all the IP prefixes
for Application Insights.

If you are using [Azure Firewall](https://learn.microsoft.com/en-us/azure/firewall/overview),
then you can use these service tags directly in your firewall rules. 
More information can be found [here](https://learn.microsoft.com/en-us/azure/firewall/service-tags).

Example Azure Firewall rule:

{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/01/15/parsing-azure-ip-ranges-and-service-tags/fw.png" %}

Example Network Security Group rule:

{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/01/15/parsing-azure-ip-ranges-and-service-tags/nsg.png" %}

If you have some other firewall vendor, then you need to check if they support
service tags directly e.g., [Palo Alto Networks & External Dynamic Lists (EDL)](https://docs.paloaltonetworks.com/resources/edl-hosting-service). 

If you don't have support for service tags in your firewall, then you need to use IP address prefixes directly.
This is not ideal, since you need to update your firewall rules every time
when new IP address prefixes are added or removed.
This is why automating this process is important.

Updates to [Azure IP Ranges and Service Tags (Public Cloud)](https://www.microsoft.com/en-us/download/details.aspx?id=56519) are published as JSON file.
Important things to highlight from the download page:

> This file is **updated weekly**.<br/>
> New ranges appearing in the file will not be used in Azure for at least one week.<br/>
> Please **download the new json file every week** and perform the necessary
> changes at your site to correctly identify services running in Azure

Okay let's test this out.

First, let's look at connection string from one of my Application Insights resources
(line breaks added for readability):

```text
InstrumentationKey=d4a1648a-2321-4cdf-b011-3e8444d41edc;
IngestionEndpoint=https://northeurope-2.in.applicationinsights.azure.com/;
LiveEndpoint=https://northeurope.livediagnostics.monitor.azure.com/
```

It contains two addresses connecting to `northeurope` region.

Let's see what IP addresses are behind those addresses.
We can use my tool for that:

{% include githubEmbed.html text="JanneMattila/AzureDatacenterIPOrNo" link="JanneMattila/AzureDatacenterIPOrNo" %}

The first address looks like this:

```powershell
$ip = (Resolve-DnsName "northeurope-2.in.applicationinsights.azure.com").IP4Address
Get-AzureDatacenterIPOrNo -IP $ip | Format-Table
```
Output:
```text
Region      Source                      IpRange         SystemService Ip
------      ------                      -------         ------------- --
            ServiceTags_Public_20231225 20.166.40.64/28 AzureMonitor  20.166.40.67
northeurope ServiceTags_Public_20231225 20.166.40.64/28 AzureMonitor  20.166.40.67
northeurope ServiceTags_Public_20231225 20.166.0.0/16                 20.166.40.67
            ServiceTags_Public_20231225 20.166.0.0/16                 20.166.40.67
```

Similarly, the second address looks like this:

```powershell
$ip = (Resolve-DnsName "northeurope.livediagnostics.monitor.azure.com").IP4Address
Get-AzureDatacenterIPOrNo -IP $ip | Format-Table
```
Output:
```text
Region      Source                      IpRange         SystemService Ip
------      ------                      -------         ------------- --
            ServiceTags_Public_20231225 20.50.68.128/29 AzureMonitor  20.50.68.128
northeurope ServiceTags_Public_20231225 20.50.68.128/29 AzureMonitor  20.50.68.128
northeurope ServiceTags_Public_20231225 20.50.64.0/20                 20.50.68.128
            ServiceTags_Public_20231225 20.50.64.0/20                 20.50.68.128
```

So, indeed those addresses are from `AzureMonitor` service tag in `northeurope` region.
They are also part of the global `AzureMonitor` service tag but we're going to
focus on the region-specific service tags.

I've taken relevant pieces of the code from the above repository and
compiled them into this script example.
It downloads the JSON file and then picks up the relevant IP address prefixes
based on the service tag name and region name.

Here's the script:

```powershell
# Update this name based on service and region
$name = "AzureMonitor.NorthEurope"

# Fetch the JSON file
$response = Invoke-WebRequest "https://www.microsoft.com/en-us/download/details.aspx?id=56519"
$fileStartIndex = $response.Content.IndexOf("ServiceTags_Public_")
$fileEndIndex = $response.Content.IndexOf(".json", $fileStartIndex)
$fileName = $response.Content.Substring($fileStartIndex, $fileEndIndex - $fileStartIndex)
$downloadLink = "https://download.microsoft.com/download/7/1/D/71D86715-5596-4529-9B13-DA13A5DE5B63/$fileName.json"
$data = Invoke-RestMethod $downloadLink

# Find all relevant IP addresses
$addresses = @()
foreach ($item in $data.values) {
  if ($item.name -eq $name) {
    foreach ($ip in $item.properties.addressPrefixes) {
      $addresses += $ip
    }
  }
}

# Print the results
$addresses
```

Example abbreviated output:

```text
13.69.229.64/29
...
20.50.68.128/29
...
20.166.40.64/28
```

The previously mentioned addresses are on this list as expected.

Now you need to schedule this script to be executed regularly and then update your firewall rules accordingly.
Previously I've blogged about 
[Automating maintenance tasks with Azure Functions and PowerShell]({% post_url 2023/10/2023-10-30-automating-maintenance-tasks-part1 %}),
so that's definitely one option.

I hope you find this useful!
