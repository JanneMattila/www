---
layout: posts
title:  "Automating maintenance tasks with Azure Functions and PowerShell"
image: /assets/posts/2023/10/30/automating-maintenance-tasks/teams.png
date:   2030-10-30 06:00:00 +0300
categories: azure
tags: azure functions powershell scripting automation
---
PowerShell has become a very popular way of automating different installations
or maintenance tasks. Read my previous blog post about 
[Arc-enabled servers onboarding]({% post_url 2023/10/2023-10-09-arc-enabled-servers-onboarding %})
which also used PowerShell. In Azure PowerShell has been used 
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
- If virtual machines are _running out of allowed schedule_, then stop them
- Post message to Teams channel to notify about virtual machines that have been shut down

A couple of important things I want to highlight in these kinds of automations:

> **Please split the functionality to _Azure Functions aware code_ and 
> _plain vanilla Azure PowerShell code_.** _Azure Functions aware code_ manages
> the triggers (e.g., Timer, HTTP) and output bindings and fetches 
> the required parameters from environment variables or any 
> other place so that it can then pass them on to the 
> _plain vanilla Azure PowerShell_ script as PowerShell parameters.

Above is important because it enables you to do much faster local development
when you do that _plain vanilla Azure PowerShell_ automation directly
without any dependency to the Azure Functions Runtime.
For that I recommend reading my
[VS Code and faster script development]({% post_url 2023/08/2023-08-28-vs-code-and-faster-script-development %})
blog post.

You can also use [pester](https://pester.dev/) and other scripting tools to test your
_plain vanilla Azure PowerShell_ code more easier.

To get quickly started, here are commands for generating the basic project structure:

```powershell
# Initialize Azure Functions project
func init MaintenanceTasks --worker-runtime powershell
cd MaintenanceTasks

# Create HTTP Trigger (for ad-hoc use cases)
func new --name HttpScanVirtualMachines --template "HTTP trigger" --authlevel "function"

# Create Timer Trigger (for scheduled usage)
func new --name TimerScanVirtualMachines --template "Timer trigger"

# Create folder for our business logic (shared between triggers)
mkdir Scripts

# Create folder for our pester tests
mkdir Tests

# Open in VS Code
code .
```

Project structure follows naming convention _Trigger type + Function name_.

To run this locally, you need to start Azure Storage account emulator [Azurite](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite?tabs=npm):

```powershell
azurite --location $env:TEMP\azurite
```

Then you’re ready to start the Azure Functions:

```powershell
func start
```

Now you’re ready to start developing you automation scripts to the _Scripts_
folder and in this example case it will be _ScanVirtualMachines.ps1_.

Here is the logic for scanning virtual machines:

- Use _Resource Graph_ query to find running virtual machines that have tag _schedule_ set
- Analyze the _schedule_ value and compare it to current time
  - `8-16` means that virtual machine is allowed to run between 8 AM and 4 PM
  - `21-04` means that virtual machine is allowed to run between 9 PM and 4 AM
- If current time is outside of allowed schedule, then _optionally_ stop the virtual machine
- Return list of virtual machines that are running out of allowed schedule

Now you can call this logic from both triggers. Here is the code from _HttpScanVirtualMachines_:

```powershell
$response = .\Scripts\ScanVirtualMachines.ps1 -Count $count
```

Similarly, here is the code from _TimerScanVirtualMachines_:

```powershell
$response = .\Scripts\ScanVirtualMachines.ps1 -Count 1000 -ForceShutdown
```

Notice that we’re passing different parameters to the script based on the trigger type.

HTTP trigger will return the `$response` as JSON:

{% include imageEmbed.html link="/assets/posts/2023/10/30/automating-maintenance-tasks/http.png" %}

Timer trigger will force shutdown virtual machines that are running out of allowed schedule
by using `-ForceShutdown` parameter.
Additionally, timer trigger processes `$response` and sends message
to Teams channel about the virtual machines that has been shut down. 
For that [Incoming Webhooks](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook?tabs=dotnet)
is used. 
You can find more information about that from the documentation.

Here is example of the message that is sent to Teams channel:

{% include imageEmbed.html link="/assets/posts/2023/10/30/automating-maintenance-tasks/teams.png" %}

Here is our final solution in VS Code:

{% include imageEmbed.html link="/assets/posts/2023/10/30/automating-maintenance-tasks/vs-code.png" %}

Source can be found here:

{% include githubEmbed.html text="JanneMattila/azure-functions-and-powershell" link="JanneMattila/azure-functions-and-powershell" %}

