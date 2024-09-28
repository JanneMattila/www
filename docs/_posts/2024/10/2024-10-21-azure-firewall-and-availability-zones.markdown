---
title: Migrate Azure Firewall to use Availability Zones
image: /assets/posts/2024/10/21/azure-firewall-and-availability-zones/workbook3.png
date: 2024-10-21 06:00:00 +0300
layout: posts
categories: azure
tags: azure firewall
---

You might have deployed Azure Firewall using the Azure Portal experience:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/create-firewall.png" %}

After the deployment, you start to add network and applications rules to your firewall:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/fw1.png" %}

After some time, you use **Azure Advisor** and its ready-made workbook about **Reliability**:

[aka.ms/advisorworkbooks](https://aka.ms/advisorworkbooks)

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/workbook1.png" %}

Under _Services -> Networking -> Azure Firewall_ you can find more information about your deployed firewalls:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/workbook2.png" %}

You notice that the Azure Firewall you have deployed  is not using **Availability Zones**:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/workbook3.png" %}

As you might have learned from my blog, I'm heavily promoting usage of _Availability Zones_ for
critical services and **yes**, your centralized Azure Firewall is one of those services.

In order to test this out, I'll use demo environment that
I have previously blogged about
[Learn Azure Firewall with isolated demo environment]({% post_url 2023/10/2023-10-02-learn-azure-firewall-with-isolated-demo-environment %}).

Code from the demo environment is available in GitHub:

{% include githubEmbed.html text="JanneMattila/azure-firewall-demo" link="JanneMattila/azure-firewall-demo" %}

Since my example setup has Azure Firewall with  **Availability Zones** enabled, I'll just comment out
that part from the demo setup in **firewall.bicep** file:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/vscode-diff.png" %}

After the demo environment deployment, we can check that we don't have availability zones in our firewall defined:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/arm2.png" %}

Now we're ready to test our options.

## Migration

We're in luck, since Azure Firewall FAQ has a section about this:

[How can I configure availability zones after deployment?](https://learn.microsoft.com/en-us/azure/firewall/firewall-faq#how-can-i-configure-availability-zones-after-deployment)

It gives us instructions how to migrate Azure Firewall to use Availability Zones.
I took the steps and converted them to match my demo environment:

```powershell
$vnet = Get-AzVirtualNetwork -Name "vnet-hub" -ResourceGroupName $resourceGroupName
$pip = Get-AzPublicIpAddress -Name "pip-firewall" -ResourceGroupName $resourceGroupName
$azfw = Get-AzFirewall -Name "afw-hub" -ResourceGroupName $resourceGroupName
$azfw.Deallocate()
Set-AzFirewall -AzureFirewall $azfw

$azfw.Allocate($vnet, $pip)
$azFw.Zones = 1, 2, 3
$azfw | Set-AzFirewall
```

To better calculate the time it takes to migrate the Azure Firewall, I'll use **Measure-Command**
and re-structure the code a bit:

```powershell
$vnet = Get-AzVirtualNetwork -ResourceGroupName $resourceGroupName -Name "vnet-hub"
$pip = Get-AzPublicIpAddress -ResourceGroupName $resourceGroupName -Name "pip-firewall"
$azfw = Get-AzFirewall -Name "afw-hub" -ResourceGroupName $resourceGroupName

Measure-Command -Expression {
    $azfw.Deallocate()
    Set-AzFirewall -AzureFirewall $azfw
} | Format-Table

Measure-Command -Expression {
    $azfw.Allocate($vnet, $pip)
    $azFw.Zones = 1, 2, 3
    $azfw | Set-AzFirewall
} | Format-Table
```

First part:

```powershell
Measure-Command -Expression {
    $azfw.Deallocate()
    Set-AzFirewall -AzureFirewall $azfw
} | Format-Table

Days Hours Minutes Seconds Milliseconds
---- ----- ------- ------- ------------
0    0     6       27      915
```

Second part:

```powershell
Measure-Command -Expression {
    $azfw.Allocate($vnet, $pip)
    $azFw.Zones = 1, 2, 3
    $azfw | Set-AzFirewall
} | Format-Table

Days Hours Minutes Seconds Milliseconds
---- ----- ------- ------- ------------
0    0     6       28      16
```

After the migration, which took less than 15 minutes in this test, we can update Workbook view to see the updated Azure Firewall configuration:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/workbook4.png" %}

Similarly, availability zones are visible in the properties as well:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/arm1.png" %}

---

If you try to change the availability zone settings without deallocating the firewall, you'll get an error:

> **Set-AzFirewall**: Azure Firewall /subscriptions/.../afw-hub<br/>
> **has an existing availability zone constraint and the request**<br/>
> **has availability zone constraint 1, 2, 3, which do not match**<br/>
> StatusCode: 400<br/>
> ReasonPhrase: Bad Request<br/>
> ErrorCode: **AzureFirewallAvailabilityZonesCannotBeModified**

## Re-deployment

If for some reason you can't migrate the Azure Firewall, you can delete it and re-deploy it with the correct settings.
There is related documentation available:
[Relocate Azure Firewall to another region](https://learn.microsoft.com/en-us/azure/operational-excellence/relocation-firewall?tabs=azure-portal)

There are few things to keep in mind before deleting the Azure Firewall:

Export the configurations: Export template (current state) and Save template (deployment history). See 
[Choose the right export option](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/export-template-powershell#choose-the-right-export-option)
for more details:

Export template:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/exporttemplate2.png" %}

Save template from deployment history:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/deployments1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/deployments2.png" %}

If Diagnostic settings are not part of your template, then check that separately:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/fw-delete3.png" %}

Important: Firewall rules are not in the firewall, they are in the Azure Firewall Policy - Do not delete it. Better place a lock on it and even better export it as well.

But I believe the most important part is the **private IP address** of the Azure Firewall:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/fw-delete2.png" %}

**If that changes, then you need to update everything that references it e.g., route tables used in spokes**.
However, if you delete firewall, then next deployment should select that same private IP address since it's not in use.
Alternatively, you can use static private IP address in the deployment.
For setting up static private IP address, you can leverage Bicep deployment.

Here is example Bicep file that deploys Azure Firewall with Availability Zones and static private IP address:

```bicep
resource firewall 'Microsoft.Network/azureFirewalls@2024-01-01' = {
  name: 'afw-hub'
  location: resourceGroup().location
  zones: [
    '1'
    '2'
    '3'
  ]
  properties: {
    threatIntelMode: 'Alert'
    hubIPAddresses: {
      // Static private IP address
      privateIPAddress: '10.0.1.4'
    }
    sku: {
      name: 'AZFW_VNet'
      tier: 'Standard'
    }
    firewallPolicy: {
      id: ''
    }
    ipConfigurations: [
      {
        name: 'fw-pip1'
        properties: {
          subnet: {
            id: ''
          }
          publicIPAddress: {
            id: ''
          }
        }
      }
    ]
  }
}
```

## Conclusion

Migration of Azure Firewall to use Availability Zones should be fairly easy and quick operation.
But of course you need to plan it carefully and have maintenance window for it.

<!--
- Azure Firewall: deployed without AZs, delete re-deploy with AZs or change location
  - Export from deployment history
  - Export from current state
  - Compare
  - Add AZs
  - Deploy
  - https://learn.microsoft.com/en-us/azure/firewall/firewall-faq#how-can-i-stop-and-start-azure-firewall
  - https://learn.microsoft.com/en-us/azure/operational-excellence/relocation-firewall?tabs=azure-portal
  - https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/export-template-powershell#choose-the-right-export-option
  - Community
    - https://gist.github.com/bergsj/7b6b9a8ea5fb97674c5ba7e2f2190b57
    - https://github.com/WillyMoselhy/AzureFirewallPolicyExportImport
    - https://github.com/proximagr/automation/blob/master/Export%20Azure%20Firewall%20Policy%20Rules.ps1
    - https://github.com/proximagr/automation/blob/master/Import%20Azure%20Firewall%20Policy%20Rules.ps1
    - https://aidanfinn.com/?p=21584
-->
