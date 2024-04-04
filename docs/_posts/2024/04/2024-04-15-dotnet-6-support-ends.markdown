---
title: "\"Support for .NET 6 ends on 12 November 2024...\""
image: /assets/posts/2024/04/15/dotnet-6-support-ends/actionrequiredemail.png
date: 2024-04-15 06:00:00 +0300
layout: posts
categories: azure
tags: azure appgw
---
I have previously wrote about
[Preparing for Azure services retirements]({% post_url 2023/09/2023-09-25-preparing-for-azure-services-retirements %}).

And now, it's time to remind everybody about the upcoming end of support for .NET 6,
because I personally have received the following email about it:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/15/dotnet-6-support-ends/actionrequiredemail.png" %}

I have, _of course_, quite many Azure Functions in use and now would be good time to start planning
the migration to newer .NET versions:

{% include daysUntil.html postfix="1" targetDate="2024-11-12" textBefore="Days until .NET 6 support ends: " textAfter=".NET 6 support has already ended 12 November 2024" %}

Function App configuration for .NET Version:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/15/dotnet-6-support-ends/net6lts.png" %}

You might be tempted to upgrade your app to **.NET 7** and re-deploy it to Azure Functions:

{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/04/15/dotnet-6-support-ends/net7.png" %}

But
[support for .NET 7 ends on 14 May 2024](https://azure.microsoft.com/en-us/updates/retirement-support-for-net-7-ends-on-14-may-2024-upgrade-your-azure-functions-resources-to-net-8/).
That is **even earlier than .NET 6**!<br/>
This gives us:

{% include daysUntil.html postfix="2" targetDate="2024-05-14" textBefore="Days until .NET 7 support ends: " textAfter=".NET 7 support has already ended 14 May 2024" %}

These timelines are best explained and illustrated with diagram in this blog post:

[.NET 7 will reach End of Support on May 14, 2024](https://devblogs.microsoft.com/dotnet/dotnet-7-end-of-support/)

But hey wait, this also includes _all other services and places_ where you have deployed .NET 6 or 7 code
in _any_ cloud and on-premises.
This includes things like Azure App Service or _any container_ solution using [.NET 6 or 7](https://hub.docker.com/_/microsoft-dotnet-sdk). 

What about PowerShell then?
[PowerShell End-of-support dates](https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle?view=powershell-7.4#powershell-end-of-support-dates)
shows the following:

- Version 7.3 support ends May 8, 2024
- Version 7.2 support ends November 8, 2024

That means I need to remember to update my various [PowerShell script automation]({% post_url 2023/10/2023-10-30-automating-maintenance-tasks-part1 %}) deployments:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/15/dotnet-6-support-ends/powershell.png" %}

I'm looking at you [7.4 preview](https://azure.microsoft.com/en-us/updates/public-preview-powershell-74-support-for-azure-functions/):
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/15/dotnet-6-support-ends/powershell2.png" %}

Let's look up some helper scripts that you can take into use to study your environment.
Here is a PowerShell script that lists all Azure App Services and their configurations:

```powershell
class WebAppData {
    [string] $SubscriptionName
    [string] $SubscriptionID
    [string] $ResourceGroupName
    [string] $Location
    [string] $Name
    [string] $LinuxFxVersion
    [string] $WindowsFxVersion
    [string] $PowerShellVersion
    [string] $NodeVersion
    [string] $PythonVersion
    [string] $PhpVersion
    [string] $NetFrameworkVersion
    [string] $Tags
}

$apps = New-Object System.Collections.ArrayList
$subscriptions = Get-AzSubscription

foreach ($subscription in $subscriptions) {
    Select-AzSubscription -SubscriptionID $subscription.Id
    $webApps = Get-AzWebApp
    foreach ($webApp in $webApps) {

        $webAppDetails = Get-AzWebApp -ResourceGroupName $webApp.ResourceGroup -Name $webApp.Name

        $webAppData = [WebAppData]::new()
        $webAppData.SubscriptionName = $subscription.Name
        $webAppData.SubscriptionID = $subscription.Id
        $webAppData.ResourceGroupName = $webApp.ResourceGroup
        $webAppData.Name = $webApp.Name
        $webAppData.Location = $webApp.Location
        $webAppData.Tags = $webApp.Tags | ConvertTo-Json -Compress
        $webAppData.LinuxFxVersion = $webAppDetails.SiteConfig.LinuxFxVersion
        $webAppData.WindowsFxVersion = $webAppDetails.SiteConfig.WindowsFxVersion
        $webAppData.PowerShellVersion = $webAppDetails.SiteConfig.PowerShellVersion
        $webAppData.NodeVersion = $webAppDetails.SiteConfig.NodeVersion
        $webAppData.PythonVersion = $webAppDetails.SiteConfig.PythonVersion
        $webAppData.PhpVersion = $webAppDetails.SiteConfig.PhpVersion
        $webAppData.NetFrameworkVersion = $webAppDetails.SiteConfig.NetFrameworkVersion
        
        $apps.Add($webAppData) | Out-Null
    }
}

$apps | Format-Table
$apps | Export-CSV "apps.csv" -Delimiter ";" -Force
start "apps.csv" # Open Excel
```

I can then glance quickly to see what am I running there:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/15/dotnet-6-support-ends/versions.png" %}

A bit similar resource graph query:

```sql
resources
| where type == "microsoft.web/sites"
| extend siteProperties = properties.siteProperties.properties
| mv-expand siteProperties
| extend OS = siteProperties.name
| extend Value = siteProperties.value
| where (isempty(Value) or isnull(Value)) == false
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/15/dotnet-6-support-ends/queryresults.png" %}

The above script and resource graph query are modified from the ones used to find out which Azure App Services were using PHP:

{% include githubEmbed.html text="JanneMattila/webapp-php-linux-azure-sql" link="JanneMattila/webapp-php-linux-azure-sql" %}

If I study the above scan results, I can see that it's **not so easy to identify which ones are impacted**:

Clearly `POWERSHELL|7.2` and `DOTNETCORE|7.0` are easy ones to identify but what about
container images e.g., `DOCKER|jannemattila/webapp-myip:1.1.4`?

```bash
az acr import -n $acr_name -t "bad/dotnet/core/sdk:2.2.401" --source "mcr.microsoft.com/dotnet/core/sdk:2.2.401" 
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/15/dotnet-6-support-ends/acr1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/15/dotnet-6-support-ends/acr2.png" %}

## Conclusion

We should now update these .NET 6 and .NET 7 apps to .NET 8. This gives use some time since it is supported still:

{% include daysUntil.html postfix="3" targetDate="2026-11-10" textBefore="Days until .NET 8 support ends: " textAfter=".NET 8 support ends 10 November 2026" %}

I have now a bit of work to do to update my apps. I hope you update yours.

I hope you find this useful!
