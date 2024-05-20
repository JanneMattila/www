---
title: Automating PowerShell tasks with Container App Jobs
image: /assets/posts/2024/05/20/automating-powershell-tasks-with-container-apps/job1.png
date: 2024-05-20 06:00:00 +0300
layout: posts
categories: azure
tags: azure powershell container-apps automation
---

I  previously wrote about
[Automating maintenance tasks with Azure Functions and PowerShell]({% post_url 2023/10/2023-10-30-automating-maintenance-tasks-part1 %}).
That combo has been my go-to solution for many automation tasks.

However, there are scenarios where Azure Functions are not the best fit. For example, when you need to run a long-running task or need to have more control over the environment.
[Azure Functions Premium plan](https://learn.microsoft.com/en-us/azure/azure-functions/functions-premium-plan?tabs=portal)
is typically the solution for these scenarios, but it's more expensive than the Consumption plan.

There is currently a preview feature called
[Azure Container Apps hosting of Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-container-apps-hosting)
which might be a good fit for these maintenance tasks also in the future.

But in this post, I'll show alternative solution for running PowerShell tasks:<br/>
[Container App Jobs](https://learn.microsoft.com/en-us/azure/container-apps/jobs?tabs=azure-cli).

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/20/automating-powershell-tasks-with-container-apps/job1.png" %}

In this demo setup, I want to run my maintenance tasks with PowerShell scripts in a container app.

More precisely, I want to run a PowerShell script with generic image which has Azure PowerShell module installed
but the actual script is mounted from external storage.

Here is the architecture:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/20/automating-powershell-tasks-with-container-apps/architecture.png" %}

The idea is to have my maintenance tasks written as normal PowerShell scripts and place them
into Azure Files. Then these scripts are mounted to the container app and executed.
And of course, I'll use managed identity for identity for running the tasks:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/20/automating-powershell-tasks-with-container-apps/architecture2.png" %}

To make it concrete, the PowerShell script can be as simple as this:

```powershell
Write-Output "This is example job script"

Get-AzResourceGroup | Format-Table
```

Before that script is executed, behind the scenes, `Connect-AzAccount` is executed with managed identity,
so you don't need to worry about credentials in your maintenance scripts.

Please check the official documentation for more details:

[Create a job with Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/jobs-get-started-cli?pivots=container-apps-job-manual)

[Use storage mounts in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts?tabs=smb&pivots=azure-cli)

[Tutorial: Create an Azure Files volume mount in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts-azure-files?tabs=bash)

The above documentation uses mixture of using CLI tooling and then exporting container app to YAML
to be able to leverage the volume mounts.
I'm not big fan of this kind of approach, so I'll show how to do this with YAML from the beginning.

As always, the full code is available in my GitHub repository (`deploy.ps1` has all the details),
but the main parts of the deployment in this post:

{% include githubEmbed.html text="JanneMattila/azure-container-apps-demos" link="JanneMattila/azure-container-apps-demos" %}

First, you need to create the container apps environment:

```powershell
# Create Container Apps environment
az containerapp env create `
  --name $containerAppsEnvironment `
  --resource-group $resourceGroup `
  --infrastructure-subnet-resource-id $subnetId `
  --logs-workspace-id $workspaceCustomerId `
  --logs-workspace-key $workspaceKey `
  --enable-workload-profiles `
  --location $location
```

Then we'll create storage account and SMB share:

```powershell
az storage account create `
  --name $storageAccountName `
  --resource-group $resourceGroup `
  --location $location `
  --sku Standard_LRS `
  --kind StorageV2

az storage share-rm create `
  --access-tier Hot `
  --enabled-protocols SMB `
  --quota 10 `
  --name $shareName `
  --storage-account $storageAccountName
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/20/automating-powershell-tasks-with-container-apps/share1.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/20/automating-powershell-tasks-with-container-apps/share2.png" %}

You can now deploy your script files to the storage using Azure CLI:

```powershell
az storage file upload `
  --source timer1.ps1 `
  --share-name $shareName `
  --path timer1.ps1 `
  --account-name $storageAccountName `
  --auth-mode key
```

Since it's SMB share, you can mount it to your own machine and use it from File Explorer
(of course, you need to have access to the storage account via private network if configured so):

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/20/automating-powershell-tasks-with-container-apps/explorer1.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/20/automating-powershell-tasks-with-container-apps/explorer2.png" %}

Next, we'll add the storage to the container app environment:

```powershell
# - Add storage to the environment
az containerapp env storage set `
  --name $containerAppsEnvironment `
  --resource-group $resourceGroup `
  --storage-name share `
  --azure-file-account-name $storageAccountName `
  --azure-file-account-key $storageKey `
  --azure-file-share-name $shareName `
  --access-mode ReadWrite
```

Finally, I'm ready to deploy the container app job from YAML:

```powershell
@"
type: Microsoft.App/jobs
identity:
  type: UserAssigned
  userAssignedIdentities:
    ? $($automationidentity.id)
    : clientId: $($automationidentity.clientId)
      principalId: $($automationidentity.principalId)
properties:
  workloadProfileName: Consumption
  environmentId: $environmentId
  configuration:
    replicaRetryLimit: 0
    replicaTimeout: 1800
    triggerType: Schedule
    scheduleTriggerConfig:
      cronExpression: 0 12 * * *
      parallelism: 1
      replicaCompletionCount: 1
  template:
    containers:
      - env:
          - name: AZURE_CLIENT_ID
            value: $($automationidentity.clientId)
          - name: SCRIPT_FILE
            value: /scripts/timer1.ps1
        image: jannemattila/azure-powershell-job:1.0.5
        name: azure-powershell-job
        resources:
          cpu: 0.25
          memory: 0.5Gi
        volumeMounts:
          - mountPath: /scripts
            volumeName: azure-files-volume
    volumes:
      - name: azure-files-volume
        storageName: share
        storageType: AzureFile
"@ > azure-powershell-job.yaml

az containerapp job create --name azure-powershell-job `
  --resource-group $resourceGroup `
  --yaml azure-powershell-job.yaml
```

If you look carefully, then you'll notice couple of things:

- `jannemattila/azure-powershell-job` image is used to run this job
- `AZURE_CLIENT_ID` environment variable is used to pass the managed identity client ID to the container
- `SCRIPT_FILE` environment variable is used to point to the script file
- `volumes` and `volumeMounts` are used to mount the storage account to the container
- `cronExpression`is used to define the interval of the job

So what is in the `jannemattila/azure-powershell-job` image?

It's a super simple image with Azure PowerShell module installed
and wrapper script to start your actual script file.
You can find the source code from my GitHub repository:

{% include githubEmbed.html text="JanneMattila/azure-powershell-job" link="JanneMattila/azure-powershell-job" %}

And the image is available in Docker Hub:

{% include dockerEmbed.html text="JanneMattila/azure-powershell-job" link="r/jannemattila/azure-powershell-job" %}

After the above deployment, I can see the job in the portal:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/20/automating-powershell-tasks-with-container-apps/job1.png" %}

And it does have the attached volume as well:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/20/automating-powershell-tasks-with-container-apps/job2.png" %}

Similarly, it has user assigned managed identity:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/20/automating-powershell-tasks-with-container-apps/job3.png" %}



I can start that job directly from portal:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/20/automating-powershell-tasks-with-container-apps/runnow.png" %}

Similarly, I can start the job with Azure CLI:

```powershell
az containerapp job start `
  --name azureautomationapppwsh `
  --resource-group $resourceGroup
```

After the job is started, I can see it the run history:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/20/automating-powershell-tasks-with-container-apps/runhistory.png" %}

I can see the detailed logs of the run by clicking the `Console`:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/20/automating-powershell-tasks-with-container-apps/logs0.png" %}

I can then use my KQL skills to just show the relevant fields:

```sql
ContainerAppConsoleLogs_CL
| where ContainerGroupName_s startswith 'azure-powershell-job-zryhtgi'
| project Log_s
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/20/automating-powershell-tasks-with-container-apps/logs1.png" %}

Some benefits of this approach:
- Full control of the used software versions (as you can see from the above logs)
  - E.g., PowerShell 7.4 now (and not when it's GA as in Azure Functions)
- VNET support
- By separating the script from the container, you can:
  - Focus on the PowerShell script development
- From the infrastructure deployment perspective:
  - Might be easier to deploy to mounted storage account than in some other solutions

Here is my cost analysis view for that resource group:
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/20/automating-powershell-tasks-with-container-apps/costs.png" %}

From that $4.52 cost, container registry has taken $4.42 since I was using
[Basic](https://azure.microsoft.com/en-us/pricing/details/container-registry/)
tier for that registry.

If you think about the portability of this solution, then please read my post
[Arc-enabled Kubernetes and Microsoft Entra Workload ID]({% post_url 2024/05/2024-05-13-arc-enabled-kubernetes-and-entra-workload-id %}).
It shows how you can take this solution to elsewhere
and still use the managed identity for running the scripts.

To show what I mean, here is the same job in self-hosted Kubernetes:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-configmap
data:
  run.ps1: |-
    Write-Output "This is example run.ps1 (from configmap)"

    Get-AzResourceGroup | Format-Table
```

The above is the script file which is mounted to the container but this time just from Kubernetes ConfigMap
(obviously you can use fileshares as well).

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: azure-powershell-job
spec:
  template:
    metadata:
      labels:
        azure.workload.identity/use: "true"
    spec:
      serviceAccountName: "${service_account_name}"
      restartPolicy: Never
      containers:
        - name: azure-powershell-job
          image: jannemattila/azure-powershell-job:1.0.5
          env:
            # No need to set this manually, 
            # since workload identity will automatically set it
            # - name: AZURE_CLIENT_ID
            #   value: "${client_id}"
            - name: SCRIPT_FILE
              value: /mnt/run.ps1
          volumeMounts:
            - name: configmap
              mountPath: /mnt
      volumes:
        - name: configmap
          configMap:
            name: app-configmap
            defaultMode: 0744
```

In the above YAML, I'm using Workload ID to pass the managed identity to the container.

Here is the output from the job:

```console
$ kubectl logs $azure_powershell_job_pod1
Azure PowerShell Job

https://github.com/JanneMattila/azure-powershell-job
https://hub.docker.com/r/jannemattila/azure-powershell-job
Image: 1.0.5

PowerShell 7.4.2
.NET 8.0.4
Az 11.5.0

Job parameters:
AZURE_CLIENT_ID: edad5241-56ba-4fea-91c5-c0e1d6149e39
SCRIPT_FILE: /mnt/run.ps1

# abbreviated
Running script: /mnt/run.ps1
This is example run.ps1 (from configmap)
```

To learn more about the details, read the post
[Arc-enabled Kubernetes and Microsoft Entra Workload ID]({% post_url 2024/05/2024-05-13-arc-enabled-kubernetes-and-entra-workload-id %}).

The above demo shows how you can use the same script and same approach in different environments.
That can be Azure Container App Job or then your own self-hosted and Arc-enabled Kubernetes.

## Conclusion

Container App Jobs are a great way to run your maintenance tasks with PowerShell scripts.
I can also see other scenarios for these jobs, but I'll leave those for future posts.

Okay, I admit, that to the people who are not so familiar with containers,
this might feel complex solution. But I think in many scenarios,
you can split the infrastructure work and script development work to different people
and you can find good balance between the two.

I hope you find this useful!
