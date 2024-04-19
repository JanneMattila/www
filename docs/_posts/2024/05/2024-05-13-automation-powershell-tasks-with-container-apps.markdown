---
title: Automation PowerShell tasks with Container App Jobs
image: /assets/posts/2024/05/13/automation-powershell-tasks-with-container-apps/job1.png
date: 2024-05-13 06:00:00 +0300
layout: posts
categories: azure
tags: azure governance security
---
I  previously wrote about
[Automating maintenance tasks with Azure Functions and PowerShell]({% post_url 2023/10/2023-10-30-automating-maintenance-tasks-part1 %}).
That combo has been my go-to solution for many automation tasks.

[Azure Functions Premium plan](https://learn.microsoft.com/en-us/azure/azure-functions/functions-premium-plan?tabs=portal)
However, there are scenarios where Azure Functions are not the best fit. For example, when you need to run a long-running task or need to have more control over the environment.

[Azure Container Apps hosting of Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-container-apps-hosting)

In this post, I'll show you how to use Azure
[Container App Jobs](https://learn.microsoft.com/en-us/azure/container-apps/jobs?tabs=azure-cli)
to run PowerShell tasks.

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/13/automation-powershell-tasks-with-container-apps/job1.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/13/automation-powershell-tasks-with-container-apps/architecture.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/13/automation-powershell-tasks-with-container-apps/architecture2.png" %}

- Maintenance task as Container App
  - Cost, private vs. Func app
  - https://github.com/Azure/CloudShell
  - https://mcr.microsoft.com/en-us/product/azure-powershell/about

[Create a job with Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/jobs-get-started-cli?pivots=container-apps-job-manual)


```yaml
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
        image: jannemattila/azure-powershell-job:1.0.1
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
```

https://github.com/JanneMattila/azure-powershell-job

https://hub.docker.com/r/jannemattila/azure-powershell-job

https://github.com/JanneMattila/azure-container-apps-demos

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/13/automation-powershell-tasks-with-container-apps/explorer1.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/13/automation-powershell-tasks-with-container-apps/explorer2.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/13/automation-powershell-tasks-with-container-apps/share1.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/13/automation-powershell-tasks-with-container-apps/share2.png" %}

{% include dockerEmbed.html text="JanneMattila/azure-powershell-job" link="r/jannemattila/azure-powershell-job" %}

{% include githubEmbed.html text="JanneMattila/azure-powershell-job" link="JanneMattila/azure-powershell-job" %}



## Conclusion

Benefits:
- Full control of the image and version
  - E.g., 7.4 now (and not when it's GA)
- VNET support
- Focus on the PowerShell script if someone else is responsible for the infrastructure
  - Might be easier to deploy to mounted storage account
- You can take this to on-premises or other clouds
  - E.g., Azure Arc-enabled Kubernetes
- Managed Identity

Drawbacks:
- Cost
- More complex
