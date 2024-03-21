---
title: Application Gateway and Web Application Firewall rule updater
image: /assets/posts/2024/04/01/appgw-and-rule-updater/rules1.png
date: 2024-04-01 06:00:00 +0300
layout: posts
categories: azure
tags: azure appgw
---
[Azure Application Gateway](https://learn.microsoft.com/en-us/azure/application-gateway/overview)
is a web traffic load balancer allowing you to secure access to your web applications.
It has many [features](https://learn.microsoft.com/en-us/azure/application-gateway/features)
but in this post, I'll focus on the
[Web Application Firewall (WAF)](https://learn.microsoft.com/en-us/azure/web-application-firewall/overview)
feature.

More specifically, I'll focus on the [Custom rules](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/custom-waf-rules-overview)
and how they can be updated dynamically using automation.
This goes hand in hand with the
[rate-limiting](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/rate-limiting-overview)
which is fairly
[new feature](https://azure.microsoft.com/en-us/updates/general-availability-ratelimit-rules-for-application-gateway-web-application-firewall/)
in WAF.

This is our demo scenario:

- We have a web application running in Azure
  - It has "admin" section for internal users
    - Work from home users can access it from anywhere
  - Majority of the external users are located in Finland and nearby countries
    - < 5 % of usage is coming rom other countries
- Web application is protected using Application Gateway and WAF

Let's start by deploying set of custom rules into the Application Gateway
and see those rules have been designed:

IMAGE

`RuleAllowCorporateIPs` rule is set to _allow_ traffic from known Corporate IP ranges.
This means that no matter what, internal users can connect to the application
from the Office and if they use VPN.
If end customers call to phone service, call center users can access the application

`RuleGeoDeny` will _deny_ traffic from countries that are not in the _allowed country list_.
This is not _enabled_ normally but can be enabled when needed.

`RuleRateLimit` will _limit_ the number of requests coming from a single IP address.
This is set above the normal tested usage so it won't affect normal users.

Above rules are quite static but they already provide capabilities that are important to our application.

Let's test these in action. Let's add temporary rule to _block all traffic_
with priority after the `RuleAllowCorporateIPs` rule:

EXTRA RULE IMAGE

Since my IP address is in the known Corporate IP range, I can still access the application:

IMAGE

Above means that internal users if we have to start blocking traffic in some cases.

Next, let's see what happens if I have more usage than allowed by the `RuleRateLimit`:

IMAGE

Above means that the rate limit is always on safety mechanism and it will block traffic if needed.

---

If we're under attack, we can enable the `RuleGeoDeny` rule to block traffic
from countries that are not in the _allowed country list_.
This we can do either manually or by using automation.

Next we'll see how we can update these rules _dynamically_ with automation.
We can implement simple
[PowerShell script automation]({% post_url 2023/10/2023-10-30-automating-maintenance-tasks-part1 %})
that will update the rules based on the current situation.

Here is the script that can be used to enable update the `RuleGeoDeny` rule

```powershell
Param (
    [Parameter(HelpMessage = "Resource group")]
    [string] $ResourceGroupName = "rg-appgw-custom-rules-demo",

    [Parameter(HelpMessage = "App Gateway WAF Policy name")]
    [string] $PolicyName = "waf-policy",

    [Parameter(HelpMessage = "Custom rule priority")]
    [int] $RulePriority = 50,
    
    [Parameter(Mandatory)]
    [ValidateSet('Enabled', 'Disabled')]
    [string] $State
)

$ErrorActionPreference = "Stop"

$policy = Get-AzApplicationGatewayFirewallPolicy -Name $PolicyName -ResourceGroupName $ResourceGroupName
$existingRule = $policy.CustomRules | Where-Object { $_.Priority -eq $RulePriority }
$existingRule
if ($null -eq $existingRule) {
    throw "Could not find existing custom rule with priority $RulePriority."
}

$existingRule.State = $State
Set-AzApplicationGatewayFirewallPolicy -InputObject $policy
```

You can use the script like this:

```powershell
# To enable the RuleGeoDeny rule:
.\rule-geo-state.ps1 -State "Enabled"

# To disable the RuleGeoDeny rule:
.\rule-geo-state.ps1 -State "Disabled"
```

---

Next, we'll do more complex KQL query based rule update.
This requires that we've enabled Diagnostic logs for the Application Gateway:

IMAGE

This allows us to use KQL to query the data coming from Application Gateway
and define our own rules based on that data.

Here is the _Resource specific_ table based query:

```sql
AGWAccessLogs 
| where OperationName == "ApplicationGatewayAccess" and
        TimeGenerated >= ago(60m)
| summarize count() by ClientIp
| project IP=ClientIp, Requests=count_
| where Requests > 10000
| order by Requests
```

Here is the _AzureDiagnostics_ table based query:

```sql
AzureDiagnostics
| where Category == "ApplicationGatewayAccessLog" and 
        OperationName == "ApplicationGatewayAccess" and
        TimeGenerated >= ago(60min)
| summarize count() by clientIP_s
| project IP=clientIP_s, Requests=count_
| where Requests > 10000
| order by Requests
```

Above queries will return the IP addresses that have made more than 10 000 requests in the last 60 minutes:

| IP             | Requests |
| -------------- | -------- |
| 85.xxx.yyy.zzz | 23 456   |
| 33.xxx.yyy.zzz | 15 678   |

IMAGE

We can now use this information to add, update or delete our dynamic rule.

IP Address of the subnet to allow scaling.

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/rules1.png" %}

{% include githubEmbed.html text="JanneMattila/azure-application-gateway-demos/appgw-custom-rules" link="JanneMattila/azure-application-gateway-demos/tree/main/appgw-custom-rules" %}
