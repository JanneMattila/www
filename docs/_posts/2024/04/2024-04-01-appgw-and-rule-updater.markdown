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
[Web Application Firewall (WAF)](https://learn.microsoft.com/en-us/azure/web-application-firewall/overview).

More specifically, I'll focus on the [Custom rules](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/custom-waf-rules-overview)
and how they can be updated dynamically using automation.
This goes hand in hand with the
[rate-limiting](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/rate-limiting-overview)
which is fairly
[new feature](https://azure.microsoft.com/en-us/updates/general-availability-ratelimit-rules-for-application-gateway-web-application-firewall/)
in WAF.

## Custom rules

{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/customrules1.png" %}

This is our demo scenario:

- We have a web application running in Azure
  - It has "admin" section for internal users
    - Work from home users can access it from anywhere
  - Majority of the external users are located in Finland and nearby countries
    - < 5 % of usage is coming from other countries
- Web application is protected using Application Gateway and WAF

Let's start by deploying set of custom rules into the Application Gateway
and see how those rules have been designed:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/customrules2.png" %}

`RuleAllowCorporateIPs` rule is set to _allow_ traffic from known Corporate IP ranges.
This means that no matter what, internal users can connect to the application
from the Office or if they use VPN.

`RuleGeoDeny` will _deny_ traffic from countries that are not in the _allowed country list_.
This is not _enabled_ normally but can be enabled when needed.

`RuleRateLimit` will _limit_ the number of requests coming from a single IP address.
This is set to a value well above the tested normal usage, so it won't affect normal users.

Above rules are quite static but they still provide capabilities that are important in protecting our application.

Let's test these in action. Let's add temporary rule `DenyAll` to _block all traffic_
with priority after the `RuleAllowCorporateIPs` rule:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/customrules4.png" %}

`RuleAllowCorporateIPs` configuration:`

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/corpip.png" %}

Since my IP address is in the known Corporate IP range, I can still access the application:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/200.png" %}

If you try to access the application from outside the allowed Corporate IP range, you're blocked:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/403.png" %}

Above error page is just example of [custom error page](https://learn.microsoft.com/en-us/azure/application-gateway/custom-error#supported-response-codes).
You should design your own custom 403 page so that it provides relevant information to the user
including how to contact Customer Support.

In the above test, internal users were able to use the application even if other rule blocks the traffic.

You can customize error pages by the response code:

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/customerrorpages.png" %}

Next, let's see what happens if I have more usage than allowed by the `RuleRateLimit`:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/appgw-ratelimit.gif" %}

Above means that the rate limit is always on safety mechanism and it will block traffic if needed.

---

If we're under attack, we can enable the `RuleGeoDeny` rule to block traffic
from countries that are not in the _allowed country list_.
This we can do either manually or by using automation.

Here is the script that can be used to enable or disable the `RuleGeoDeny` rule:

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

We can use 
[PowerShell script automation]({% post_url 2023/10/2023-10-30-automating-maintenance-tasks-part1 %})
for handling this kind of automations.

---

Next, we'll do more complex KQL query based rule update.
This requires that we've enabled
[Diagnostic logs](https://learn.microsoft.com/en-us/azure/application-gateway/application-gateway-diagnostics)
for the Application Gateway:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/appgwdiag1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/appgwdiag2.png" %}

This allows us to use KQL to query the data coming from Application Gateway
and define our own rules based on that data:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/kql.png" %}

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
| 4.xxx.yyy.zzz  | 451 811  |

Output from query window:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/kql2.png" %}

We can now use this information to add, update or delete our dynamic rule.

Remember the query can be anything:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/kql3.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/kql4.png" %}



{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/waf2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/rules1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/rules2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/rules3.png" %}


## Prepare

Remember, that you need to plan ahead when you're designing your Application Gateway and WAF.

Important things to consider:

- [Subnet size](https://learn.microsoft.com/en-us/azure/application-gateway/configuration-infrastructure#size-of-the-subnet) to support scaling up to 125 instances
  - Recommended subnet size is: `/24`
  - DDoS Network protection covers cost protection
- Use Auto Scaling and do not set max instances:
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/appgw125.png" %}


- Enabled managed ruleset including Bot Manager for enhanced protection against bot attacks
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/managedrulesets.png" %}

- Monitoring and alerts (e.g., Under DDoS attack or not), Sentinel


{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/loadtesting1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/loadtesting2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/loadtesting3.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/loadtesting4.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/appgwscaling.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/appgwscaling2.png" %}



https://learn.microsoft.com/en-us/azure/application-gateway/application-gateway-metrics



Set your Application Gateway to auto scale up and not enforce number of max instances
Make sure you have enough large subnet to support this scaling to 125 instances!
Use Bot Manager 1.0 for enhanced protection against bot attacks
Enable monitoring and alerts (e.g., Under DDoS attack or not), Sentinel
Additional capabilities e.g., Network Security Groups (NSGs) to filter traffic
Test! Azure Load Testing & Azure Chaos Studio etc.



Alerts
https://learn.microsoft.com/en-us/azure/application-gateway/application-gateway-metrics

https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/best-practices

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-rule-updater/rules1.png" %}

{% include githubEmbed.html text="JanneMattila/azure-application-gateway-demos/appgw-custom-rules" link="JanneMattila/azure-application-gateway-demos/tree/main/appgw-custom-rules" %}
