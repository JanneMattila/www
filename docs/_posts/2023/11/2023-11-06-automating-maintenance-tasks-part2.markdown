---
layout: posts
title:  "Automating maintenance tasks with Azure Functions and PowerShell - Part 2: Deployment"
image: /assets/posts/2023/11/06/automating-maintenance-tasks-part2/teams.png
date:   2023-11-06 06:00:00 +0300
categories: azure
tags: azure functions powershell scripting automation cicd devops
---
In my previous blog post [Automating maintenance tasks with Azure Functions and PowerShell - Part 1: Development]({% post_url 2023/10/2023-10-30-automating-maintenance-tasks-part1 %})
I covered how you can _create and develop_ these maintenance tasks in Azure Functions and PowerShell.

In this post I'll cover how you can _deploy_ these maintenance tasks to Azure.

## Background

Before going to the actual deployment example, I recommend that you check out my previous posts
on this topic to get some idea how I approach this topic:

[Azure deployment entry point](https://github.com/JanneMattila/some-questions-and-some-answers/blob/master/q%26a/azure_deployment_entry_point.md)

[To ARM, or not to ARM, that is the question](https://dev.to/janne_mattila/to-arm-or-not-to-arm-that-is-the-question-420i)

**Suprisingly little has changed in this area since I wrote those posts.**

Of course, [Bicep](https://github.com/Azure/bicep) has now taken the position of ARM templates.

So maybe it's not a big suprise, that in this post I'll use Bicep to deploy our maintenance task infrastructure.

## Deployment example

Let's start by identifying our infrastructure needs for our maintenance task:

- Azure Function App
  - App Service Plan: `Windows`, `Consumption`
  - Stack: `PowerShell`
- [Storage Accounts](https://learn.microsoft.com/en-us/azure/azure-functions/storage-considerations)
  - for function app
  - for deployment resources
- User-assigned managed identity
- Application Insights
  - Log Analytics workspace

From the above list, majority of the resources are quite obvious and self-explanatory.

_However_, you might we wondering why we need _two_ storage accounts.
At the time of writing this post, Azure Functions does not yet support pulling
deployment packages using managed identity. Therefore, I've split that into two seperate storage accounts.
**First** storage account is used for the function app itself and that is protected by Entra ID.
Function App connects to it using managed identity.

If I would like to connect to that storage account, then I would get this:

{% include imageEmbed.html link="/assets/posts/2023/11/06/automating-maintenance-tasks-part2/storage-access1.png" %}

Above happens, because I don't have [roles](https://learn.microsoft.com/en-us/azure/storage/blobs/authorize-access-azure-active-directory)
to access that content. 

If I would like to connect using access keys, then I would get this:

{% include imageEmbed.html link="/assets/posts/2023/11/06/automating-maintenance-tasks-part2/storage-access2.png" %}

Above happens, because [Shared Key authorization](https://learn.microsoft.com/en-us/azure/storage/common/shared-key-authorization-prevent?tabs=portal)
is disabled for that storage account.

**Second** storage account is used for the deployment resources and that is not protected by Entra ID:

{% include imageEmbed.html link="/assets/posts/2023/11/06/automating-maintenance-tasks-part2/storage-smb.png" %}

_Why would I prefer to use user-assigned managed identity instead of system-assigned managed identity?_

I prefer to use user-assigned managed identities, because very often in large organizations
you don't have permissions to assign correct roles to the identities. Imagine requesting
role assignment to management group level to modify resources. It might take time to get that approved.
So you easily end up waiting _quite some time_ for someone to approve and assign the role to the identity. 
Now if suddenly need to delete your compute resources and create them again,
then you would have to ask that role assignment again _if you would use system-assigned managed identity_.
But since we use user-assigned managed identity, 
we can just use the existing identity with existing accesses and role without any problems.
That applies even if we would have to change the architecture to use e.g., Azure Container Apps instead of Azure Functions.

Here is our resources to be deployed:

{% include imageEmbed.html link="/assets/posts/2023/11/06/automating-maintenance-tasks-part2/bicep-visualizer.png" %}

I have prepared Bicep files in to our example repository into `deploy/MaintenanceTasks` folder:

{% include githubEmbed.html text="JanneMattila/azure-functions-and-powershell" link="JanneMattila/azure-functions-and-powershell/tree/main/deploy/MaintenanceTasks" %}

And as I explained in the beginning the deployment is encapsulated behind `deploy.ps1`.
Before executing that script, you need to login to Azure and select correct subscription:

```powershell
Connect-AzAccount
Set-AzContext -Subscription "Your subscription name"
```

Now you can deploy the resources by running below command
(read instructions on how to create [Incoming Webhooks](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook?tabs=dotnet) to Teams):

```powershell
$webhookUrl = "...your-incoming-webhook-url-to-teams.."
$result = .\deploy.ps1 -WebhookUrl $webhookUrl
```

`$result` contains now the outputs from our Bicep deployment.

```powershell
$result.Outputs | Format-List
$result.Outputs["funcApp"].value
$result.Outputs["funcAppUri"].value

$funcApp = $result.Outputs["funcApp"].value
$funcAppUri = $result.Outputs["funcAppUri"].value
```

You can use [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-core-tools-reference?tabs=v2#func-azure-functionapp-publish) to publish the function app:

```powershell
pushd ../../src/MaintenanceTasks/
func azure functionapp publish $funcApp
popd
```

```powershell
pushd ../../src/MaintenanceTasks/
$accessToken = (Get-AzAccessToken).Token
func azure functionapp publish $funcApp --access-token $accessToken
popd
```

{% include imageEmbed.html link="/assets/posts/2023/11/06/automating-maintenance-tasks-part2/azure-resources.png" %}

```powershell
$subscriptionId = (Get-AzContext).Subscription.Id
$resourceGroupName = "rg-maintenance-tasks"
$functionName = "HttpScanVirtualMachines"

$functionKeys = Invoke-AzRestMethod -Path "/subscriptions/$subscriptionId/resourceGroups/$resourceGroupName/providers/Microsoft.Web/sites/$funcApp/functions/$functionName/listkeys?api-version=2022-03-01" -Method POST

$code = ($functionKeys.content | ConvertFrom-Json).default

curl "https://$funcAppUri/api/ScanVirtualMachines?code=$code"
```

Here is example output:

```json
{
  "VirtualMachines": [
    {
      "Name": "vm-runbook-worker",
      "Subscription": "4....4",
      "ResourceGroup": "automation-account-rg",
      "Location": "westus3",
      "Schedule": "8-10"
    }
  ],
  "Continues": true
}
```

You can invoke the Timer trigger using:

```powershell
$keys = Invoke-AzRestMethod -Path "/subscriptions/$subscriptionId/resourceGroups/$resourceGroupName/providers/Microsoft.Web/sites/$funcApp/host/default/listkeys?api-version=2022-03-01" -Method POST
$masterKey = ($keys.content | ConvertFrom-Json).masterKey

curl --request POST -H "Content-Type: application/json" --data '{}' "https://$funcAppUri/admin/functions/TimerScanVirtualMachines?code=$masterKey"
```

## Summary

<!--

Roles:
Virtual Machine Contributor
https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#virtual-machine-contributor

-->