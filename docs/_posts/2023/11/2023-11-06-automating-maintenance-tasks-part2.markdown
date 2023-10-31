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

**Surprisingly little has changed in this area since I wrote those posts.**

Of course, [Bicep](https://github.com/Azure/bicep) has now taken the position of ARM templates.

So maybe it's not a big surprise that in this post I'll use Bicep to deploy our maintenance task infrastructure
with the help of PowerShell.

## Deployment

Let's start by identifying our infrastructure needs for our maintenance task automation:

- Azure Function App
  - App Service Plan: `Windows`, `Consumption`
  - Stack: `PowerShell`
- [Storage Accounts](https://learn.microsoft.com/en-us/azure/azure-functions/storage-considerations)
  - for function app
  - for deployment resources
- User-assigned managed identity
- Application Insights
  - Log Analytics workspace

From the above list, majority of the resources are obvious and self-explanatory.

_However_, you might be wondering why we need _two_ storage accounts.
At the time of writing this post, Azure Functions does not yet support pulling
deployment packages using managed identity. Therefore, I've split usage into two separate storage accounts.
**First** storage account is used for the function app itself and it is protected by Entra ID.
Function App connects to it using managed identity.

If I would like to connect to that storage account, then I would get this:

{% include imageEmbed.html link="/assets/posts/2023/11/06/automating-maintenance-tasks-part2/storage-access1.png" %}

Above happens, because I don't have required [roles](https://learn.microsoft.com/en-us/azure/storage/blobs/authorize-access-azure-active-directory)
assigned to me in order to access that content. 

If I would like to connect using access keys, then I would get this:

{% include imageEmbed.html link="/assets/posts/2023/11/06/automating-maintenance-tasks-part2/storage-access2.png" %}

Above happens, because [Shared Key authorization](https://learn.microsoft.com/en-us/azure/storage/common/shared-key-authorization-prevent?tabs=portal)
is disabled for that storage account.

**Second** storage account is used for the deployment resources and that is not protected by Entra ID:

{% include imageEmbed.html link="/assets/posts/2023/11/06/automating-maintenance-tasks-part2/storage-smb.png" %}

_Why would I prefer to use user-assigned managed identity instead of system-assigned managed identity?_

I prefer to use user-assigned managed identities, because very often in large organizations
you don't have permissions to assign correct roles to the identities. Imagine requesting
role assignments to management group level to modify resources. It might take time to get that approved.
So, you easily end up waiting _quite some time_ for someone to approve and assign that role to the identity. 

Now if you suddenly need to delete your compute resources and create them again,
you would have to ask that role assignment again _if you use system-assigned managed identity_.
But since we use user-assigned managed identity, 
we can just use the existing identity with existing accesses without any problems.
That applies even if we would have to change the architecture to use e.g., Azure Container Apps instead of Azure Functions.

Here are our resources to be deployed:

{% include imageEmbed.html link="/assets/posts/2023/11/06/automating-maintenance-tasks-part2/bicep-visualizer.png" %}

I have created Bicep files into `deploy/MaintenanceTasks` folder in our example repository:

{% include githubEmbed.html text="JanneMattila/azure-functions-and-powershell" link="JanneMattila/azure-functions-and-powershell/tree/main/deploy/MaintenanceTasks" %}

And as I explained in the beginning of the post,
the deployment is encapsulated behind `deploy.ps1`.

Before executing that script, you need to login to Azure and select the correct subscription:

```powershell
Connect-AzAccount
Select-AzSubscription -SubscriptionName "Your subscription name"
```

Now you can deploy the resources by running below command
(read instructions on how to create [Incoming Webhooks](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook?tabs=dotnet) to Teams to get the `$webhookUrl`):

```powershell
$webhookUrl = "...your-incoming-webhook-url-to-teams.."
$result = .\deploy.ps1 -WebhookUrl $webhookUrl
```

`$result` contains the outputs from our Bicep deployment.
You can study them by running the following commands:

```powershell
$result.Outputs | Format-List
$result.Outputs["funcApp"].value
$result.Outputs["funcAppUri"].value

$funcApp = $result.Outputs["funcApp"].value
$funcAppUri = $result.Outputs["funcAppUri"].value
```

You can use [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-core-tools-reference?tabs=v2#func-azure-functionapp-publish) to publish the function app.
I have here `pushd` and `popd` commands to change directory to the function app folder and back.

```powershell
pushd ../../src/MaintenanceTasks/
func azure functionapp publish $funcApp
popd
```

But if you want to use the context from your Azure PowerShell session, then you can use this:

```powershell
pushd ../../src/MaintenanceTasks/
$accessToken = (Get-AzAccessToken).Token
func azure functionapp publish $funcApp --access-token $accessToken
popd
```

Now you should see the function app in the portal:

{% include imageEmbed.html link="/assets/posts/2023/11/06/automating-maintenance-tasks-part2/azure-resources.png" %}

> **Important: Now you should assign [Virtual Machine Contributor](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#virtual-machine-contributor)**
> **(or similar role) which enables shutting down of VMs for our managed identity.**
> Scope can be management group, subscription, or resource group.

## Test

You can now invoke our deployed HTTP trigger using:

```powershell
$subscriptionId = (Get-AzContext).Subscription.Id
$resourceGroupName = "rg-maintenance-tasks"
$functionName = "HttpScanVirtualMachines"

$functionKeys = Invoke-AzRestMethod -Path "/subscriptions/$subscriptionId/resourceGroups/$resourceGroupName/providers/Microsoft.Web/sites/$funcApp/functions/$functionName/listkeys?api-version=2022-03-01" -Method POST

$code = ($functionKeys.content | ConvertFrom-Json).default

curl "https://$funcAppUri/api/ScanVirtualMachines?code=$code"
```

Here is an example output:

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
  "Continues": false
}
```

You can invoke the Timer trigger using:

```powershell
$keys = Invoke-AzRestMethod -Path "/subscriptions/$subscriptionId/resourceGroups/$resourceGroupName/providers/Microsoft.Web/sites/$funcApp/host/default/listkeys?api-version=2022-03-01" -Method POST
$masterKey = ($keys.content | ConvertFrom-Json).masterKey

curl --request POST -H "Content-Type: application/json" --data '{}' "https://$funcAppUri/admin/functions/TimerScanVirtualMachines?code=$masterKey"
```

Since we're using application insights, then you should see the telemetry in the portal:

{% include imageEmbed.html link="/assets/posts/2023/11/06/automating-maintenance-tasks-part2/timer-monitor.png" %}

{% include imageEmbed.html link="/assets/posts/2023/11/06/automating-maintenance-tasks-part2/timer-ai.png" %}

You can use them to create alerts if there are errors in the function app.

## Deploying from pipelines and actions

GitHub has excellent [Azure Functions Action](https://github.com/marketplace/actions/azure-functions-action)
marketplace page with links to e.g., [Deploy PowerShell project to Azure Function App](https://github.com/Azure/actions-workflow-samples/blob/master/FunctionApp/windows-powershell-functionapp-on-azure.yml).

Azure DevOps has also [Azure Functions task](hhttps://learn.microsoft.com/en-us/azure/devops/pipelines/tasks/reference/azure-function-app-v2?view=azure-pipelines)
which is similarly documented [here](https://learn.microsoft.com/en-us/azure/azure-functions/functions-how-to-azure-devops?tabs=powershell%2Cyaml&pivots=v2).

You can use one of the [many](https://learn.microsoft.com/en-us/azure/azure-functions/deployment-zip-push)
documented ways to deploy your function app no matter which CI/CD tool you use.

## Summary

Now you should have a good understanding of how you can deploy your maintenance tasks to Azure.
I want to really repeat my previous statement that Azure Functions and PowerShell is a very powerful combo
and if you're not familiar with it then I recommend that you check it out.

I hope you find this useful!
