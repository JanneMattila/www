---
title: Automations with Azure Pipelines or GitHub Actions
image: /assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/entra6.png
date: 2024-05-27 06:00:00 +0300
layout: posts
categories: azure
tags: azure powershell devops github actions
---

I have been previously blogging about various automation topics:

[Automating maintenance tasks with Azure Functions and PowerShell]({% post_url 2023/10/2023-10-30-automating-maintenance-tasks-part1 %})

[Automation PowerShell tasks with Container App Jobs]({% post_url 2024/05/2024-05-20-automating-powershell-tasks-with-container-apps %})

The above examples are using various Azure services for the automations.

**However**, many times even more simpler approach can do the job.
I'm all about choosing the right tool for the job.

In this post, I will show you how to automate tasks with
[Azure Pipelines](https://learn.microsoft.com/en-us/azure/devops/pipelines/get-started/what-is-azure-pipelines?view=azure-devops)
or
[GitHub Actions](https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions).

Both of these services are great for automating tasks and they are very easy to use.
They are feature rich and you can run them in managed agents or self-hosted agents.

Scenario:
- You have a PowerShell script `run.ps1` you need to run on a schedule two times a day
- Use Workload identity for managing the authentication

## Workload Identity

Before we start implementing Azure Pipelines or GitHub Actions, we need to prepare the setup for the Workload Identity.

First, let's register application to Entra ID:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/entra1.png" %}

We need to add _Federated credentials_ for our app registration so that it
matches the issuer and subject identifier of the Azure Pipelines or GitHub Actions
identity. This is important for the authentication to work.
We'll get back to this later:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/entra2.png" %}

Now, we're ready to go for the automation implementations.

_Note_: If you're new to Workload Identity, I recommend reading the following blog post:
[Arc-enabled Kubernetes and Microsoft Entra Workload ID]({% post_url 2024/05/2024-05-13-arc-enabled-kubernetes-and-entra-workload-id %})

## PowerShell script

Here's a simple PowerShell script that we want to run on a schedule:

```powershell
$resourceGroups = Get-AzResourceGroup

for ($i = 0; $i -lt $resourceGroups.Count; $i++) {
    $resourceGroup = $resourceGroups[$i]
    if ($null -eq $resourceGroup.tags) {
        continue
    }

    $listResourceGroup = $resourceGroup.tags.ContainsKey("list") ? $resourceGroup.tags["list"] : "false"

    if ([boolean]::Parse($listResourceGroup) -eq $true) {
        $resourceGroupName = $resourceGroup.ResourceGroupName
        $resourceGroupResources = Get-AzResource -ResourceGroupName $resourceGroupName

        Write-Host "----------------------------------"
        Write-Host "Resource Group: $resourceGroupName"
        Write-Host "Resource Group Resources:"
        for ($j = 0; $j -lt $resourceGroupResources.Count; $j++) {
            $resource = $resourceGroupResources[$j]
            $resourceName = $resource.Name
            $resourceType = $resource.Type
            $resourceLocation = $resource.Location

            Write-Host "Resource Name: $resourceName"
            Write-Host "Resource Type: $resourceType"
            Write-Host "Resource Location: $resourceLocation"
            Write-Host ""
        }
    }
}
```

This script lists all the resources in the resource groups that have a tag `list` set to `true`.

To run that script two times a day, you can use following [Cron](https://crontab.guru/) expression:

```yaml
0 */12 * * *
```

## Azure Pipelines

Let's start by creating service connection from Azure DevOps to Azure:

{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/ado1.png" %}
{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/ado2.png" %}

From the available options list, choose _Workload Identity federation (manual)_
because we want to understand how this is connected to the previously created Entra ID app registration:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/ado3.png" %}

Fill in the details for the service connection:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/ado4.png" %}

Notice that it does provide following values for the issuer and subject identifier:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/ado-federated.png" %}


Issuer:

```
https://vstoken.dev.azure.com/d16bb96a-a9de-4052-abe3-18bde0abb46c
```

Subject identifier:

```
sc://jannemattilademo/AzureDemo/DevelopmentConnection
```

Copy these values to the Entra ID app registration by adding a new Federated credential.
Choose _Other issuer_ from the list:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/entra3.png" %}

Paste the issuer and subject identifier values to the form and save the changes:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/entra4.png" %}

You can now validate and test the service connection from Azure DevOps.
If you haven't granted access to the target subscription for the given identity,
you'll get the following error:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/ado5.png" %}

After the have successfully validated and created the service connection,
you can use it in your pipelines.

Here's an example of a pipeline that runs on a schedule:

```yaml
schedules:
  - cron: "0 */12 * * *"
    displayName: Automated scan two times a day
    branches:
      include:
        - main
    always: "true" # No changes required to trigger the pipeline

trigger:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - src/automation-demo

name: 1.0.$(Rev:r)
jobs:
  - job: Automation
    pool:
      vmImage: ubuntu-latest
    steps:
      - task: AzurePowerShell@5
        inputs:
          azureSubscription: "$(AzureServiceConnectionName)"
          ScriptType: "FilePath"
          ScriptPath: "src/automation-demo/run.ps1"
          errorActionPreference: "stop"
          failOnStandardError: true
          pwsh: true
          azurePowerShellVersion: "LatestVersion"
```

The above pipeline runs the `run.ps1` script on a
[schedule](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/scheduled-triggers?view=azure-devops&tabs=yaml)
two times a day
using the
[Azure PowerShell v5 task](https://learn.microsoft.com/en-us/azure/devops/pipelines/tasks/reference/azure-powershell-v5?view=azure-pipelines).

Now we can test the pipeline by running it manually:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/ado6.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/ado7.png" %}

We can validate that the _Scheduled runs_ are as expected:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/ado8.png" %}

After a day we can see that the pipeline has ran two times as expected:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/ado-schedule.png" %}

## GitHub Actions

Setting up 
[GitHub Actions connection](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure?tabs=azure-portal%2Cwindows)
is very similar to the above.

This time we need to select _GitHub Actions deploying Azure resources_ from the list,
when adding the federated credential to the Entra ID app registration:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/entra5.png" %}

You can notice that the issuer and subject identifier values are different for GitHub Actions:

Issuer:

```
https://token.actions.githubusercontent.com
```

Subject identifier:

```
repo:jannemattila/powershell-demos:ref:refs/heads/main
```

After you have added the federated credential to the Entra ID app registration,
we can see that we have now two federated credentials in our app registration:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/entra6.png" %}

Next, we need to set secrets to the GitHub repository for the authentication:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/gh1.png" %}

Our GitHub Actions workflow file looks like this:

```yaml
name: Azure PowerShell Automation
on:
  workflow_dispatch:
  push:
    branches:
    - main
    - develop
    paths:
    - src/automation-demo
  schedule:
  - cron: '0 */12 * * *'

permissions:
  id-token: write
  contents: read
  
jobs:
  Automation:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Azure login
      uses: azure/login@v2
      with:
        client-id: ${{ secrets.AZURE_CLIENT_ID }}
        tenant-id: ${{ secrets.AZURE_TENANT_ID }}
        subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
        enable-AzPSSession: true
    - name: Automation
      uses: azure/powershell@v2
      with:
        inlineScript: src/automation-demo/run.ps1
        azPSVersion: latest
        errorActionPreference: stop
        failOnStandardError: true
```

Same principles apply here as with Azure Pipelines.

Now we can test the GitHub Actions workflow by running it manually:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/gh2.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/gh3.png" %}

After a day we can see that the workflow has ran two times as expected:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-pipelines-or-github-actions/gh-schedule.png" %}

## Conclusion

// TBA: private self-hosted agent/runner and private networking

// TBA: paused if not used in given time

I hope you find this useful!
