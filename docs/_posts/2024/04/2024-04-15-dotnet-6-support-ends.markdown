---
title: "\"Support for .NET 6 ends on 12 November 2024...\""
image: /assets/posts/2024/04/15/dotnet-6-support-ends/actionrequiredemail.png
date: 2024-04-15 06:00:00 +0300
layout: posts
categories: azure
tags: azure appdev
---
I  previously wrote about
[Preparing for Azure services retirements]({% post_url 2023/09/2023-09-25-preparing-for-azure-services-retirements %}).

And now, it's time to remind everybody about the upcoming end of support for .NET 6,
because I received the following email about it:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/15/dotnet-6-support-ends/actionrequiredemail.png" %}

I have, _of course_, quite a lot of Azure Functions in use and now would be good time to analyze this topic a bit:

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

So, your upgrade path from .NET 7 should be to .NET 8 and
from .NET 6 to .NET 8 or then to .NET 9 when it becomes available. 

---

**But hey wait**, this also includes _all other services and places_ where you have deployed .NET 6 or 7 code.
This means  _any_ cloud and on-premises environments.
This includes things like Azure App Service, Static web apps, IIS or _any container_ solution using [.NET 6 or 7](https://hub.docker.com/_/microsoft-dotnet-sdk). 

What about PowerShell then? It's
[linked to .NET version](https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle?view=powershell-7.4#release-history)
after all.
[PowerShell End-of-support dates](https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle?view=powershell-7.4#powershell-end-of-support-dates)
shows the following:

- Version 7.3 support ends May 8, 2024
- Version 7.2 support ends November 8, 2024

That means I need to remember to update my various [PowerShell script automation]({% post_url 2023/10/2023-10-30-automating-maintenance-tasks-part1 %}) deployments:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/15/dotnet-6-support-ends/powershell.png" %}

[PowerShell 7.4 Preview](https://azure.microsoft.com/en-us/updates/public-preview-powershell-74-support-for-azure-functions/)
is new but I'm already looking forward to it:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/15/dotnet-6-support-ends/powershell2.png" %}

---

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

I can quickly see what I am running there:

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

See
[Azure Resource Graph Explorer for Microsoft.Web resources](https://techcommunity.microsoft.com/t5/apps-on-azure-blog/azure-resource-graph-explorer-for-microsoft-web-resources/ba-p/3798295)
for more good examples.

The above script and resource graph query are modified from the ones used to find out which Azure App Services were using PHP:

{% include githubEmbed.html text="JanneMattila/webapp-php-linux-azure-sql" link="JanneMattila/webapp-php-linux-azure-sql" %}

If I study the above scan results, I can see that it's **not so easy to identify which ones are impacted**:

Clearly `POWERSHELL|7.2` and `DOTNETCORE|7.0` are easy ones to identify but what about
container images e.g., `DOCKER|jannemattila/webapp-myip:1.1.4`?

It makes this topic more complex since many tools **report these in a reactive manner and not proactively**.

Let me quickly show what I mean by importing _super old_ a .NET 2.2.401 image to Azure Container Registry:

```bash
az acr import \
  -n $acr_name \
  -t "bad/dotnet/core/sdk:2.2.401" \
  --source "mcr.microsoft.com/dotnet/core/sdk:2.2.401" 
```

And then I can see the image in Azure Container Registry:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/15/dotnet-6-support-ends/acr1.png" %}

It starts to show me information about the vulnerabilities etc.:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/15/dotnet-6-support-ends/acr2.png" %}

It does help me to identify the old images and their vulnerabilities,
but it does not really help looking for near future end of support dates.

Obviously, I can solve the mystery of the `DOCKER|jannemattila/webapp-myip:1.1.4` by looking at the Dockerfile:

{% include githubEmbed.html text="JanneMattila/webapp-myip" link="JanneMattila/webapp-myip/blob/b2c8713f430174fa76136daa4872584f012e7157/src/WebApp/Dockerfile#L4" %}

So _ouch_, I need to update this one to .NET 8 as well.

## Conclusion

As I wrote into
[Preparing for Azure services retirements]({% post_url 2023/09/2023-09-25-preparing-for-azure-services-retirements %})
post, it's good to have a plan in place to follow these topics regularly
so that it doesn't come as an surprise.
Better to have it as part of your regular meeting agendas
e.g., quarterly production readiness reviews in order to not miss these.

Now it's a good time to start looking for using .NET 8. 
It then gives you then a lot more time to think about other upgrades in the future:

{% include daysUntil.html postfix="3" targetDate="2026-11-10" textBefore="Days until .NET 8 support ends: " textAfter=".NET 8 support ends 10 November 2026" %}

I now have a bit of work to do to update my apps. I hope you check and update yours.

I hope you find this useful!
