# $location = "West Central US"
$location = "Central US EUAP"
# $location = "East US 2 EUAP"

((Get-AzResourceProvider  -ProviderNamespace "Microsoft.Network").ResourceTypes | `
  Where-Object ResourceTypeName -eq "virtualNetworks").ApiVersions | `
  Format-Table

$resourceGroupName = "rg-vnet"
$vnetName = "vnet-app"
$addressPrefix = "10.0.0.0/16"

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
  -AddressPrefix $addressPrefix `
  -Subnet $subnets `
  -Force

# Payload to update the address space
# Note: This is not a complete payload. It is only the properties that need to be updated.
$payload = @{
  location   = $location
  properties = @{
    addressSpace = @{
      addressPrefixes = @(
        "10.0.0.0/8"
      )
    }
  }
}
$json = $payload | ConvertTo-Json -Depth 10
$json

$parameters = @{
  Method               = "PUT" # This is important!
  ApiVersion           = "2023-09-01"
  Name                 = $vnetName
  ResourceGroupName    = $resourceGroupName
  ResourceProviderName = "Microsoft.Network"
  ResourceType         = "virtualNetworks"
  Payload              = $json
}
Invoke-AzRestMethod @parameters

# { "error": { "code":"ResourceReadFailed", "target":"vnet-demo", "message":"Azure Policy required full resource content to evaluate the request. The request to GET resource '/subscriptions/4996c 
#              fa8-dd39-415b-a61c-db0f570047a4/resourceGroups/rg-vnet-demo/providers/Microsoft.Network/virtualNetworks/vnet-demo' failed with status 'BadRequest'."} }

# { "error": { "code":"OnlyTagsSupportedForPatch", "message":"PATCH request content includes properties property. Only tags property is currently supported.", "details":[]}}

Remove-AzResourceGroup -Name $resourceGroupName -Force
