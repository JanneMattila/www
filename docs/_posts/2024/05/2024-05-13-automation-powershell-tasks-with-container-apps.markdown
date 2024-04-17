---
title: Automation PowerShell tasks with Container Apps
image: /assets/posts/2024/05/13/automation-powershell-tasks-with-container-apps/apps.png
date: 2024-05-13 06:00:00 +0300
layout: posts
categories: azure
tags: azure governance security
---


[Create a job with Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/jobs-get-started-cli?pivots=container-apps-job-manual)


```yaml
  template:
    containers:
    - env:
      - name: AZURE_CLIENT_ID
        value: 73...f4
      - name: SCRIPT_FILE
        value: /scripts/timer1.ps1
      image: <acrname>.azurecr.io/az-aca-demo-pwsh:20240416154526
      name: azureautomationapppwsh
      resources:
        cpu: 0.25
        memory: 0.5Gi
      volumeMounts:
      - mountPath: /scripts
        volumeName: azure-files-volume
    initContainers: null
    volumes:
    - name: azure-files-volume
      storageName: share
      storageType: AzureFile
```
