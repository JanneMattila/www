---
layout: posts
title:  "Automating maintenance tasks with Azure Functions and PowerShell - Part 1: Development"
image: /assets/posts/2023/10/30/automating-maintenance-tasks-part1/teams.png
date:   2023-10-30 06:00:00 +0300
categories: azure
tags: azure functions powershell scripting automation
---
PowerShell has become a very popular way of automating different installations
or maintenance tasks. Read my previous blog post about 
[Onboarding multiple Arc-enabled servers with the help of map file]({% post_url 2023/10/2023-10-09-arc-enabled-servers-onboarding %}).
In that post I used PowerShell to extend the installation functionality. 

PowerShell is also frequently used in various automation and maintenance tasks in Azure development.
Scripting can be used for scanning resources, stopping virtual machines, scaling automation or clean up tasks.

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

## Maintenance tasks example

In this post I’ll cover _one_ example end-to-end so that you 
get good idea how you can use it to run your own automations.

The scenario for our automation is the following:

- Scan virtual machines based on tags
- If virtual machines are _running out of the allowed schedule_, then stop them
- Post message to Teams channel to notify about virtual machines that have been shut down

A couple of important things I want to highlight in these kinds of automations:

> **Please split the functionality to _Azure Functions aware code_ and 
> _plain vanilla Azure PowerShell code_.** _Azure Functions aware code_ manages
> the triggers (e.g., Timer, HTTP), output bindings and fetches 
> the required parameters from environment variables or any 
> other place so that it can then pass them on to the 
> _plain vanilla Azure PowerShell_ script as PowerShell parameters.

Above is important because it enables you to do much faster local development
when you do that _plain vanilla Azure PowerShell_ automation directly
without any dependency to the Azure Functions Runtime.
To improve your scripting, I recommend reading my
[VS Code and faster script development]({% post_url 2023/08/2023-08-28-vs-code-and-faster-script-development %})
blog post.

_Plain vanilla Azure PowerShell_ can be easily tested using [pester](https://pester.dev/) test framework.
Similarly, you can use any other scripting tools to test and validate your code.
Additionally, **now you have portability of that code**. 
It can be executed manually on your local machine or in any other place
and not just in Azure Functions.

---

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
echo "# Code here" > Scripts/ScanVirtualMachines.ps1

# Create folder for our pester tests
mkdir Tests
echo "# Tests here" > Tests/ScanVirtualMachines.Tests.ps1

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

Now you’re ready to start developing your automation scripts to the _Scripts_
folder and in this example case it will be _ScanVirtualMachines.ps1_.

Here is the logic for scanning virtual machines:

- Use _Resource Graph_ query to find running virtual machines that have tag _schedule_ set
- Analyze the _schedule_ value and compare it to current time
  - `8-16` means that virtual machine is allowed to run between 8 AM and 4 PM
  - `21-04` means that virtual machine is allowed to run between 9 PM and 4 AM
- If current time is outside of the allowed schedule, then _optionally_ stop the virtual machine
- Return list of virtual machines that are running out of the allowed schedule

Now you can call this logic from both triggers. Here is the code from _HttpScanVirtualMachines_:

```powershell
$response = . $env:FUNCTIONS_APPLICATION_DIRECTORY/Scripts/ScanVirtualMachines.ps1 -Count $count
```

Similarly, here is the code from _TimerScanVirtualMachines_:

```powershell
$response = . $env:FUNCTIONS_APPLICATION_DIRECTORY/Scripts/ScanVirtualMachines.ps1 -Count 1000 -ForceShutdown
```

Notice that we’re passing different parameters to the script based on the trigger type.

HTTP trigger returns the `$response` as JSON:

{% include imageEmbed.html link="/assets/posts/2023/10/30/automating-maintenance-tasks-part1/http.png" %}

Timer trigger will force shutdown virtual machines that are running out of allowed schedule
by using `-ForceShutdown` parameter.
It also processes `$response` and creates markdown output and sends message
to Teams channel about the virtual machines that have been shut down. 
For that [Incoming Webhooks](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook?tabs=dotnet)
is used. 
You can find more information about that from the documentation.

`$env:FUNCTIONS_APPLICATION_DIRECTORY` is environment variable which provides easy way to
have full path to the script and you don't have to rely on the current working directory.
<!-- C:\local\Temp\functions\standby\wwwroot -->
<!-- WARNING: INITIALIZATION: Fallback context save mode to process because of error during checking token cache persistence: Could not find file 'C:\home\site\wwwroot\.IdentityService'.. -->
<!-- https://github.com/Azure/azure-functions-host/issues/5789 -->

Here is an example of the message that is sent to Teams channel:

{% include imageEmbed.html link="/assets/posts/2023/10/30/automating-maintenance-tasks-part1/teams.png" %}

You can invoke these triggers from command-line using:

```powershell
# HTTP trigger
curl http://localhost:7071/api/ScanVirtualMachines
curl http://localhost:7071/api/ScanVirtualMachines?count=1000

# Timer trigger
curl --request POST -H "Content-Type: application/json" --data '{}' http://localhost:7071/admin/functions/TimerScanVirtualMachines
```

Here is our solution in VS Code:

{% include imageEmbed.html link="/assets/posts/2023/10/30/automating-maintenance-tasks-part1/vs-code.png" %}

Source for this demo can be found here:

{% include githubEmbed.html text="JanneMattila/azure-functions-and-powershell" link="JanneMattila/azure-functions-and-powershell" %}

## Summary

This post contained _one_ example of how you can use Azure Functions and PowerShell
for managing your maintenance tasks. You can use this same model for
many other use cases as well.

Next step is to _deploy this solution to Azure_. I'll cover that in my next post.
Stay tuned for part 2!

I hope you find this useful!
