---
title: Virtual Network deployments with or without subnets
image: /assets/posts/2024/04/22/vnet-and-subnets/subnets1.png
date: 2024-04-22 06:00:00 +0300
layout: posts
categories: azure
tags: azure networking
---
[Azure Virtual Network](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-overview)
is getting update that allows you to update the VNET without having to add your subnets to your configuration.
This has sometimes caused challenges with infrastructure teams and application teams
since they're both managing different parts of the infrastructure.
There have been ways to live with this, but this allows us to use another approach in the future.

## Before the change

Let's first deploy VNET with Azure PowerShell:

```powershell
$location = "swedencentral"

$resourceGroupName = "rg-vnet"
$vnetName = "vnet-app"

$subnets = @(
  @{
    name          = "snet-app1"
    addressPrefix = "10.0.1.0/24"
  },
  @{
    name          = "snet-app2"
    addressPrefix = "10.0.2.0/24"
  }
)

New-AzResourceGroup -Name $resourceGroupName -Location $location -Force

New-AzVirtualNetwork `
  -Name $vnetName `
  -ResourceGroupName $resourceGroupName `
  -Location $location `
  -AddressPrefix "10.0.0.0/8" `
  -Subnet $subnets `
  -Force
```

Similarly, you can use Bicep (or ARM template):

```powershell
param location string = resourceGroup().location

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: 'vnet-app'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/8'
      ]
    }
    subnets: [
      {
        name: 'snet-app1'
        properties: {
          addressPrefix: '10.0.1.0/24'
        }
      }
      {
        name: 'snet-app2'
        properties: {
          addressPrefix: '10.0.2.0/24'
        }
      }
    ]
  }
}
```

Here is the result:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/vnet-and-subnets/vnet2.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/vnet-and-subnets/subnets1.png" %}

If I now re-run the deployment but change e.g., address space but **without** the subnets:

```powershell
New-AzVirtualNetwork `
  -Name $vnetName `
  -ResourceGroupName $resourceGroupName `
  -Location $location `
  -AddressPrefix "10.0.0.0/16" `
  -Force
```

Bicep version without subnets:

```powershell
param location string = resourceGroup().location

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: 'vnet-app'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
  }
}
```

Now the result is that the subnets are removed from the VNET:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/vnet-and-subnets/vnet1.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/vnet-and-subnets/subnets2.png" %}

Here is the GitHub issue with _a lot of history_ and discussion around this feature:

{% include githubEmbed.html text="Azure/azure-quickstart-templates/issues/2786" link="Azure/azure-quickstart-templates/issues/2786" %}

Since this is long outstanding feature request,
[BicepLang](https://twitter.com/BicepLang)
tweeted about the change announcement
(with typo about the years which is fixed in the follow-up response):

{% include xEmbed.html id="BicepLang/status/1734293541038498003" %}

Here is the post from the Azure Networking team about this:

[Azure Virtual Network now supports updates without subnet property](https://techcommunity.microsoft.com/t5/azure-networking-blog/azure-virtual-network-now-supports-updates-without-subnet/ba-p/4067952)


## After the change

Now let's deploy the same VNET but let's use the latest API version available for the virtualNetworks resource type:

```powershell
# Get the API versions for the virtualNetworks resource type
((Get-AzResourceProvider  -ProviderNamespace "Microsoft.Network").ResourceTypes | `
  Where-Object ResourceTypeName -eq "virtualNetworks").ApiVersions | `
  Format-Table
```

Output shows that there is a API version `2023-11-01` available:

```plaintext
2023-11-01
2023-09-01
2023-09-01
2023-05-01
...
```

Here is our initial deployment with subnets:

```powershell
$location = "swedencentral"

$resourceGroupName = "rg-vnet"
$vnetName = "vnet-app"

$subnets = @(
  @{
    name          = "snet-app1"
    addressPrefix = "10.0.1.0/24"
  },
  @{
    name          = "snet-app2"
    addressPrefix = "10.0.2.0/24"
  }
)

New-AzResourceGroup -Name $resourceGroupName -Location $location -Force

New-AzVirtualNetwork `
  -Name $vnetName `
  -ResourceGroupName $resourceGroupName `
  -Location $location `
  -AddressPrefix "10.0.0.0/16" `
  -Subnet $subnets `
  -Force
```

Let's use REST API to update the VNET without subnets,
so we can freely use any API version we want e.g., `2023-11-01`:

```powershell
# Payload to update the address space
$payload = @{
  location   = $location
  properties = @{
    addressSpace = @{
      addressPrefixes = @(
        "10.0.0.0/8"
      )
    }
  }
} | ConvertTo-Json -Depth 10

$parameters = @{
  Method               = "PUT"
  ApiVersion           = "2023-11-01"
  Name                 = $vnetName
  ResourceGroupName    = $resourceGroupName
  ResourceProviderName = "Microsoft.Network"
  ResourceType         = "virtualNetworks"
  Payload              = $payload
}
Invoke-AzRestMethod @parameters
```

Or same with Bicep:

```powershell
param location string = resourceGroup().location

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-11-01' = {
  name: 'vnet-app'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/8'
      ]
    }
  }
}
```

Result is that you still have subnets in the VNET:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/vnet-and-subnets/subnets1.png" %}

## Conclusion

This is a good enhancement to the Azure Virtual Network deployments.
Let's see how this will be used in the future.

I have many times recommended to use the latest available versions of the
[API versions](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/best-practices#api-version)
in Bicep and ARM templates when _you're doing active development_.
In the future, I'll have to remember to mention more about these behavioral and default configuration related
changes before you start to use the latest API versions for your existing templates.
This is a good example of such behavioral change from `2023-09-01` to `2023-11-01`
in `Microsoft.Network/virtualNetworks`.

I hope you find this useful!
