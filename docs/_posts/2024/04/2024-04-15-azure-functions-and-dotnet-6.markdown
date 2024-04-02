---
title: Azure Functions and .NET 6
image: /assets/posts/2024/04/15/azure-functions-and-dotnet-6/actionrequiredemail.png
date: 2024-04-15 06:00:00 +0300
layout: posts
categories: azure
tags: azure appgw
---
I have previously written about
[Preparing for Azure services retirements]({% post_url 2023/09/2023-09-25-preparing-for-azure-services-retirements %}).

And now, it's time to remind you about the upcoming end of support for Azure Functions and .NET 6,
because I personally have received an email about it:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/15/azure-functions-and-dotnet-6/actionrequiredemail.png" %}

I have, of course, quite many Azure Functions in use and now would be good time to start planning
the migration to newer .NET versions:

{% include daysUntil.html targetDate="2024-11-12" textBefore="Days until Azure Functions and .NET 6 support ends: " textAfter="Azure Functions and .NET 6 support has already ended 12 November 2024" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/15/azure-functions-and-dotnet-6/net6lts.png" %}

Resource Graph query:

```sql
resources
| where type == "microsoft.web/sites"
| where properties.siteConfig.netFrameworkVersion == "v6.0"
```
