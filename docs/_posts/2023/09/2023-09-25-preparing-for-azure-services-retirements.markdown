---
layout: posts
title:  "Preparing for Azure services retirements"
image: /assets/posts/2023/09/25/preparing-for-azure-services-retirements/services-retirement-workbook.png
date:   2023-09-25 06:00:00 +0300
categories: azure
tags: azure governance advisor workbooks
---
Those of us who have been developing software for the on-premises environments
know that things do not change so frequently. You might get a new OS version or
SQL Server version every now and then but not every month or even year.
Of course, if you run the same software long enough, then you're forced to do
OS upgrades and other upgrades that require more effort from you. 
Otherwise, you end up running in an unsupported scenario, which is not ideal situation to be in.

In the cloud era, we have learned that new things come more frequently, 
and new features are introduced left and right. 
Over the years we have been taking this for granted and learned to love this new model.
But since cloud has been around quite some time, we're more and more seeing
that also in cloud some services are going away.
This might mean that you need to adjust your architecture or update your applications to accommodate those changes.

Last few years I have been working closely with customers using Azure
and every time when there is a major service retirement,
I try to highlight this to them well in advance. 
One major service retirement that I tried to do all the possible things
to get this information to my customers, was [Azure AD Graph deprecation](https://learn.microsoft.com/en-us/graph/migrate-azure-ad-graph-overview). 

I even tried shouting this out on Twitter to get more visibility:

{% include xEmbed.html id="janne_mattila/status/1485868888860602374" %}

Tried to promote people to scan their environments using scripts and capability within Azure Portal:

{% include xEmbed.html id="janne_mattila/status/1486666779422347267" %}

However, sometimes this information doesn't always flow to the correct people
at the correct time even if this information is sent on multiple different channels
and by multiple different people. 

This information is also sent to subscription owners, but they might not be the
correct contacts related to the services used inside that Azure subscription.
This is particularly common in large companies.

Here is one such email example that most likely you've all received:

{% include imageEmbed.html link="/assets/posts/2023/09/25/preparing-for-azure-services-retirements/application-insights.png" %}

But let's come back to Application Insights later.

---

To give one concrete example about services retirement that we didn't manage to notice early, 
was PHP retirement in Windows App Service plan last year:

[Community support for PHP 7.4 is ending on 28 November 2022](https://azure.microsoft.com/en-us/updates/community-support-for-php-74-is-ending-on-28-november-2022/)

This change was communicated well in advance (above article was published 2020) and Azure Portal had these yellow notes
warning you but still this was caught by surprise:

{% include imageEmbed.html link="/assets/posts/2023/09/25/preparing-for-azure-services-retirements/app-service-php.png" %}

These applications have been running years without any problems and nobody had noticed these warnings.

Together with my colleague we created resource graph queries and PowerShell scripts to 
find all the potentially impacted PHP apps. We worked with application teams to 
get them migrated to Linux App Service plans. You can find these queries and scripts and a bit more in this GitHub repository:

{% include githubEmbed.html text="JanneMattila/webapp-php-linux-azure-sql" link="JanneMattila/webapp-php-linux-azure-sql" %}

_Of course_, it’s not nice for anybody involved when you suddenly notice that you need to
make urgent last-minute changes to your application or architecture before you run out of support. 

Therefore, it really _really_ **really** makes sense to prepare for Azure service
retirements well in advance. 
Luckily, there are many tools to help you. 
I'll try to highlight them here and hopefully you'll do validation for your environment as well.

## Azure Advisor

Azure Advisor is a great tool for getting recommendations for your Azure resources. 
It also has ready-made workbooks available to you. You can find them here:

[aka.ms/advisorworkbooks](https://aka.ms/advisorworkbooks)

{% include imageEmbed.html link="/assets/posts/2023/09/25/preparing-for-azure-services-retirements/advisor.png" %}

**Services Retirement Workbook** is great summary view for seeing potential impact to your resources:

{% include imageEmbed.html link="/assets/posts/2023/09/25/preparing-for-azure-services-retirements/services-retirement-workbook.png" %}

This workbook is still in _preview_, so it’s not perfect and contains subset of services
but still a great resource to take into use. **Try it out now!**

Top of my services retirement list is Application Insights which is retiring feature "Classic" in February 2024. 
By clicking that "Learn more"
link in the workbook you'll find more information on each retirement
as well as corrective action you should take.
Here is the link for [Application Insights](https://azure.microsoft.com/en-us/updates/we-re-retiring-classic-application-insights-on-29-february-2024/).

As you can see my **environment has 325 Application Insights resources impacted**.
At the time or writing this, to migrate all these on time, _somebody_ should migrate ~2 resources per day before retirement. 

But this brings up important follow-up questions: 

**What's your number?**

**Did you notice that above notification email send to you?**

**Are you on track to migrate these resources on time?**

etc.

Natural next step is to analyze your environment and find out which other resources are impacted.
Use that information to build backlog, so you'll know the amount of work ahead of you.

---

I'm also trying to highlight selected resource graph queries which help you find these retired services from your environment.
I'll put them here:

{% include githubEmbed.html text="JanneMattila/some-questions-and-some-answers" link="JanneMattila/some-questions-and-some-answers/blob/master/q%26a/azure_resource_graph.md" %}

## Other tools

Here are other tools that you should *definitely* checkout:

[Azure Charts](https://azurecharts.com/timeboards/deprecations) - Azure Deprecations Board

---

[Azure Updates by Retirements](https://azure.microsoft.com/en-us/updates/?updateType=retirements)

You can use RSS Feeds to pull Azure Updates information to your own tools.

Here is example Excel file that I've created which connects to the RSS feed:

{% include imageEmbed.html link="/assets/posts/2023/09/25/preparing-for-azure-services-retirements/excel.png" %}

[AzureServicesRetirements.xlsx](/assets/posts/2023/09/25/preparing-for-azure-services-retirements/AzureServicesRetirements.xlsx)

Here is an example PowerShell script to fetch that information:

```powershell
$url = "https://azurecomcdn.azureedge.net/en-us/updates/feed/?updateType=retirements"
$xml = [xml](Invoke-WebRequest $url).Content
$items = $xml.rss.channel.item | ForEach-Object { [pscustomobject]@{ 
        Title       = $_.title; 
        Link        = $_.link; 
        Description = $_.description; 
        Published   = $_.pubDate 
    } }

# Show first item in list format
$items[0] | Format-List

# Show all items
$items

# Export to CSV
$items | Export-CSV "retirements.csv"
```

---

[Service Health](https://portal.azure.com/#view/Microsoft_Azure_Health/AzureHealthBrowseBlade/~/serviceIssues) and 
[Health Advisories](https://learn.microsoft.com/en-us/azure/service-health/service-health-overview#service-health-events) (and while you're there check and setup your [Resource Health alerts](https://learn.microsoft.com/en-us/azure/service-health/resource-health-alert-monitor-guide))

{% include imageEmbed.html link="/assets/posts/2023/09/25/preparing-for-azure-services-retirements/health-advisories.png" %}

## Final thoughts

I hope you have now some ideas and tools to validate your environment. 
Please also take this as part of your governance and management processes,
so that you periodically check that none of these alerts have been falling through cracks.

Hope you find this useful!
