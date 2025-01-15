---
layout: posts
title:  Quota usage reporting with Azure Resource Graph
image: /assets/posts/2025/01/15/quota-usage-reporting/results.png
date: 2025-01-15 06:00:00 +0300
categories: azure
tags: azure resource-graph
---

You can find your
[Quota](https://learn.microsoft.com/en-us/azure/quotas/quotas-overview)
usage by opening **Quotas > My quotas** in the Azure portal:

{% include imageEmbed.html link="/assets/posts/2025/01/15/quota-usage-reporting/myquotas.png" %}

It allows you to see if you're approaching your quota limits and allows you to
[act](https://learn.microsoft.com/en-us/azure/quotas/quickstart-increase-quota-portal)
before you hit the limit:

{% include imageEmbed.html link="/assets/posts/2025/01/15/quota-usage-reporting/myquotas2.png" %}

You can also
[create alerts for quotas](https://learn.microsoft.com/en-us/azure/quotas/how-to-guide-monitoring-alerting).

**However**, if you have a large environment _or_ if you would like to create a report about the quota usage then 
[Azure Resource Graph](https://learn.microsoft.com/en-us/azure/governance/resource-graph/overview)
would be a better option.

Here is an example query that you can use to get the quota usage
(based on the above article):

```sql
QuotaResources 
| where type =~ 'microsoft.compute/locations/usages' 
| where isnotempty(properties) 
| mv-expand propertyJson = properties.value 
| extend usage = propertyJson.currentValue, 
         quota = propertyJson.['limit'], 
         quotaLocalizedName = tostring(propertyJson.['name'].localizedValue),
         quotaName = tostring(propertyJson.['name'].value) 
| extend usagePercent = toint(usage) * 100 / toint(quota) 
| project-away properties
| where usagePercent > 80
| join kind=leftouter (ResourceContainers | where type=='microsoft.resources/subscriptions' | project subscriptionName=name, subscriptionId) on subscriptionId
| project subscriptionId, subscriptionName, location, usage, quota, quotaName, quotaLocalizedName, usagePercent
```

I want to highlight two important parts of the query:

1) [mv-expand operator](https://learn.microsoft.com/en-us/kusto/query/mv-expand-operator?view=microsoft-fabric)
expands quota values into separate records.

2) Filtering the results to only show the resources that are using _more than 80% of their quota_:

```sql
| where usagePercent > 80
```

Here is an example output from the above query:

{% include imageEmbed.html link="/assets/posts/2025/01/15/quota-usage-reporting/results.png" %}

This can exported to a CSV file directly from the view.
Alternatively, you can
[Run queries with the Azure Resource Graph Power BI connector](https://learn.microsoft.com/en-us/azure/governance/resource-graph/power-bi-connector-quickstart?tabs=power-bi-desktop).

_Of course_, you can use Azure PowerShell and the
[Search-AzGraph](https://learn.microsoft.com/en-us/powershell/module/az.resourcegraph/search-azgraph?view=azps-13.0.0)
cmdlet to get the same information and implement your own custom processing.
See some examples about that in my repository
e.g., 
[find-subscriptions-without-policy.ps1](https://github.com/JanneMattila/some-questions-and-some-answers/blob/master/q%26a/find-subscriptions-without-policy.ps1),
[scan-private-endpoint-connections.ps1](https://github.com/JanneMattila/some-questions-and-some-answers/blob/master/q%26a/scan-private-endpoint-connections.ps1),
or search for _Search-AzGraph_ in the repository:

{% include githubEmbed.html text="JanneMattila/some-questions-and-some-answers" link="search?q=repo%3AJanneMattila%2Fsome-questions-and-some-answers%20Search-AzGraph&type=code" %}

I hope you find this useful!
