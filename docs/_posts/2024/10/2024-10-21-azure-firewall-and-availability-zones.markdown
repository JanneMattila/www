---
title: Migrate Azure Firewall to use Availability Zones
image: /assets/posts/2024/10/21/azure-firewall-and-availability-zones/workbook3.png
date: 2024-10-21 06:00:00 +0300
layout: posts
categories: azure
tags: azure firewall
---

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/create-firewall.png" %}

Azure Advisor is a great tool for getting recommendations for your Azure resources. 
It also has ready-made workbooks available to you. You can find them here:

[aka.ms/advisorworkbooks](https://aka.ms/advisorworkbooks)

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/workbook1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/workbook2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/workbook3.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/arm1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/compare.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/compare2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/create-firewall-download-template.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/create-firewall-template.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/deployments1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/deployments2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/exporttemplate1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/exporttemplate2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/fw-delete0.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/fw-delete1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/fw-delete2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/fw-delete3.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/fw-delete4.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/fw1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/vscode-diff.png" %}

I blogged previously about
[Learn Azure Firewall with isolated demo environment]({% post_url 2023/10/2023-10-02-learn-azure-firewall-with-isolated-demo-environment %})

{% include githubEmbed.html text="JanneMattila/azure-firewall-demo" link="JanneMattila/azure-firewall-demo" %}

---

Workbook reflects the current state of the Azure Firewall with Availability Zones:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/workbook4.png" %}

Availability zones visible in the properties of the Azure Firewall:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/arm1.png" %}

## In-place migration

[How can I configure availability zones after deployment?](https://learn.microsoft.com/en-us/azure/firewall/firewall-faq#how-can-i-configure-availability-zones-after-deployment)

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

```text
Set-AzFirewall: Azure Firewall /subscriptions/4...4/resourceGroups/rg-azure-firewall-demo/providers/Microsoft.Network/azureFirewalls/afw-hub has an existing availability zone constraint  and the request has availability zone constraint 1, 2, 3, which do not match
StatusCode: 400
ReasonPhrase: Bad Request
ErrorCode: AzureFirewallAvailabilityZonesCannotBeModified
ErrorMessage: Azure Firewall /subscriptions/4...4/resourceGroups/rg-azure-firewall-demo/providers/Microsoft.Network/azureFirewalls/afw-hub has an existing availability zone constraint  and the request has availability zone constraint 1, 2, 3, which do not match
OperationID : faa8fc23-0f30-41d6-97a0-a1998c24e697
```

## Re-deploy with Availability Zones

Static IP

Diagnostic settings

## Conclusion

TBA

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
