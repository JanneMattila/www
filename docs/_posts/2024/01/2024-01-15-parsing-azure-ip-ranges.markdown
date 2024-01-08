---
layout: posts
title:  Parsing Azure IP Ranges and Service Tags JSON file
image: /assets/posts/2023/12/11/k8s-api-deprecations/http-paths.png
date:   2024-01-15 06:00:00 +0300
categories: azure
tags: azure management firewall
---

{% include githubEmbed.html text="JanneMattila/AzureDatacenterIPOrNo" link="JanneMattila/AzureDatacenterIPOrNo" %}

[Automating maintenance tasks with Azure Functions and PowerShell]({% post_url 2023/10/2023-10-30-automating-maintenance-tasks-part1 %})

[Service tags](https://learn.microsoft.com/en-us/azure/virtual-network/service-tags-overview)

<!--

- Service tags parsing using PowerShell
  - Maintenance task automation
  - https://learn.microsoft.com/en-us/azure/virtual-network/service-tags-overview
  - Firewall vendor updates to support cloud
    - Azure Firewall
    - Palo Alto & External Dynamic Lists (EDL)
      - https://docs.paloaltonetworks.com/pan-os/9-1/pan-os-admin/policy/use-an-external-dynamic-list-in-policy/external-dynamic-list
      - https://github.com/salsop/azure-servicetags-container
      - https://github.com/enzo-g/azureIPranges
  - "So much prior art"

-->

```powershell
# Update this name based on service and region
$name = "ApiManagement.WestEurope"

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

Example output:

```text
13.69.64.76/31
13.69.66.144/28
20.86.92.254/31
23.101.67.140/32
51.145.179.78/32
137.117.160.56/32
2603:1020:206:402::140/124
2603:1020:206:403::60/124
```
