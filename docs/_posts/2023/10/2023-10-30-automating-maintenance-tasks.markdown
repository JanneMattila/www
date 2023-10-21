---
layout: posts
title:  "Automating maintenance tasks with Azure Functions and PowerShell"
image: /assets/posts/2023/10/30/automating-maintenance-tasks/teams.png
date:   2030-10-30 06:00:00 +0300
categories: azure
tags: azure functions powershell scripting automation
---
PowerShell has become a very popular way of automating different installations
or maintenance tasks. Read my previous blog post about Arc-enabled servers 
onboarding which also used PowerShell. In Azure PowerShell has been used 
a lot for automating many Azure maintenance tasks such as scanning resources, 
stopping virtual machines, manual scaling or clean up tasks. 
Azure Automation Account has been traditionally used for hosting these automations, 
but Azure Functions has taken that position many times in the last years. 
I think Azure Functions with PowerShell and managed identities is 
an excellent combination for running these various automation tasks.

But before rushing to the example in this post, please check the official
documentation for more information if you’re not familiar with Azure Functions and PowerShell:

[Azure Functions Overview](https://learn.microsoft.com/en-us/azure/azure-functions/functions-overview?pivots=programming-language-powershell)

[PowerShell developer reference for Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-powershell?tabs=portal)

[Create a PowerShell function using Visual Studio Code](https://learn.microsoft.com/en-us/azure/azure-functions/create-first-function-vs-code-powershell)

[Azure Functions HTTP triggers and bindings](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook?tabs=isolated-process%2Cfunctionsv2&pivots=programming-language-powershell)

[Timer trigger for Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer?tabs=python-v2%2Cisolated-process%2Cnodejs-v4&pivots=programming-language-powershell)

In this post I’ll cover one example end-to-end so that you 
get good idea how you can also use it to run your own automations.

The scenario for our automation is the following:

- Scan virtual machines based on tags
  - This is triggered automatically on defined schedule but also you can execute it ad-hoc
- If virtual machines are running, then stop them
- Post message to Teams channel to notify you about virtual machines that have been shut down

A couple of important things I want to highlight in these kinds of automations:

Please split the functionality to “Azure Functions aware code” and 
“Plain vanilla Azure PowerShell code”. “Azure Functions aware code” manages
the triggers (e.g., Timer, HTTP) and output bindings and fetches 
the required parameters from environment variables or any 
other place so that it can then pass them on to the 
“plain vanilla Azure PowerShell” script as PowerShell parameters.

Above is important because it enables you to do much faster local development
when you do that “plain vanilla Azure PowerShell” automation directly
without any dependency to the Azure Functions Runtime.
For that I recommend reading my VS Code related blog post.

You can also use pester and other scripting tools to test your “plain vanilla Azure PowerShell” code.

To get quickly started, here are commands for generating the basic project structure:

```powershell
func init MaintenanceTasks --worker-runtime powershell
cd MaintenanceTasks
func new --name HttpScanVirtualMachines --template "HTTP trigger" --authlevel "function"
func new --name TimerScanVirtualMachines --template "Timer trigger" 
mkdir Scripts
code .
```

Project structure follows naming convention “Trigger type” + “Function name”. 
Business logic which is shared across different triggers are stored in “Scripts” folder:

```powershell
tree
```

```console
Folder PATH listing for volume Local Disk
Volume serial number is 427B-A26A
C:.
├───.vscode
├───HttpScanVirtualMachines
├───Scripts
└───TimerScanVirtualMachines
```

To run this locally, you need to start Azure Storage account emulator [Azurite](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite?tabs=npm):

```powershell
azurite --location $env:TEMP\azurite
```

Then you’re ready to start the Azure Functions:

```powershell
func start
```

Now you’re ready to start developing you automation scripts to the “Scripts”
folder and in this example case it will be “ScanVirtualMachines.ps1”.

https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook?tabs=dotnet
