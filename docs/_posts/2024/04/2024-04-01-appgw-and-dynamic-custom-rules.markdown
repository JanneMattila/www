---
title: Application Gateway and dynamic custom rules in Web Application Firewall
image: /assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/waf2.png
date: 2024-04-01 06:00:00 +0300
layout: posts
categories: azure
tags: azure appgw
---
[Azure Application Gateway](https://learn.microsoft.com/en-us/azure/application-gateway/overview)
is a web traffic load balancer that allows you to secure access to your web applications.
It has many [features](https://learn.microsoft.com/en-us/azure/application-gateway/features)
but in this post, I'll focus on the
[Web Application Firewall (WAF)](https://learn.microsoft.com/en-us/azure/web-application-firewall/overview).

More specifically, I'll focus on the
[Custom rules](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/custom-waf-rules-overview)
and how they can be updated dynamically using automation.
This goes hand in hand with the
[rate-limiting](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/rate-limiting-overview)
which is fairly
[new feature](https://azure.microsoft.com/en-us/updates/general-availability-ratelimit-rules-for-application-gateway-web-application-firewall/)
in WAF.

## Custom rules

{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/customrules1.png" %}

Here is the scenario and the requirements of our application:

- We have a public facing web application running in Azure
  - It has "admin" section for internal usage scenarios
    - Work from home users can access it from anywhere
    - This includes users from external companies e.g., outsourced customer service users
    - Internal users are very important, and they should always have access to the application
  - Majority of the external users are from Finland or from the nearby countries
    - Less than 5 % of the usage is outside these known countries
- Web application is protected using Application Gateway and WAF

---

Let's start by deploying a set of custom rules into the Application Gateway
and see how those rules have been designed to support those requirements that I've mentioned above:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/customrules2.png" %}

`RuleAllowCorporateIPs` rule is set to _allow_ traffic from known Corporate IP ranges.
This includes known IP addresses of your service provider companies who are using the application.
This means that no matter what, internal users can connect to the application
from the Office network or if they use VPN and it's configured this scenario in mind.

`RuleGeoDeny` will _deny_ traffic from countries that are not in the _allowed country list_.
This is only set to _log_ normally but can be changed to _block_ when needed.
After all, we know countries where majority of our users come from,
but we can allow global access under normal circumstances.

`RuleRateLimit` will _limit_ the number of requests coming from a single IP address.
This is set to a value well above the tested normal usage, so it won't affect normal users.

The above rules are quite static, but they still provide capabilities that are important in protecting our application.

Let's test these in action. Let's add temporary rule `DenyAll` to _block all traffic_
with priority after the `RuleAllowCorporateIPs` rule:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/customrules4.png" %}

`RuleAllowCorporateIPs` configuration:

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/corpip.png" %}

Since my IP address is in the known Corporate IP range, I can still access the application:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/200.png" %}

If you try to access the application from outside the allowed Corporate IP range, you're blocked:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/403.png" %}

Above error page is just example of [custom error page](https://learn.microsoft.com/en-us/azure/application-gateway/custom-error#supported-response-codes).
You should design your own custom 403 page so that it provides relevant information to the user
including how to contact customer support, relevant contact details etc.
You can customize error pages by the response code:

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/customerrorpages.png" %}

In the above `RuleAllowCorporateIPs` test, internal users coming from known IP addresses
were able to use the application even if later rule blocks the traffic.<br/>
Note: This means that _no further rules are evaluated for the internal users_. This includes the managed rule sets.

---

Next, let's see what happens if I have more usage than allowed by the `RuleRateLimit`:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/appgw-ratelimit.gif" %}

If the usage was above the configured threshold, rate limiting started
blocking traffic in order to protect our application.
You can think of it as a safety mechanism in this scenario.

---

For the `RuleGeoDeny` rule we'll use a slightly different approach
since it's not set to block the traffic all the time.
We can change it to block traffic if we notice that we're under some kind of attack or suspicious activity is ongoing.
When enabled, it will block traffic coming from countries that are not in the _allowed country list_.

You can change this rule either directly from the Azure Portal or by using automation.

Here is the script that can be used to change the action of the `RuleGeoDeny` rule:

```powershell
Param (
    [Parameter(HelpMessage = "Resource group")]
    [string] $ResourceGroupName = "rg-appgw-custom-rules-demo",

    [Parameter(HelpMessage = "App Gateway WAF Policy name")]
    [string] $PolicyName = "waf-policy",

    [Parameter(HelpMessage = "Custom rule priority")]
    [int] $RulePriority = 50,
    
    [Parameter(Mandatory)]
    [ValidateSet('Allow', 'Block', 'Log')]
    [string] $Action
)

$ErrorActionPreference = "Stop"

$policy = Get-AzApplicationGatewayFirewallPolicy -Name $PolicyName -ResourceGroupName $ResourceGroupName
$existingRule = $policy.CustomRules | Where-Object { $_.Priority -eq $RulePriority }
$existingRule
if ($null -eq $existingRule) {
    throw "Could not find existing custom rule with priority $RulePriority."
}

$existingRule.Action = $Action
Set-AzApplicationGatewayFirewallPolicy -InputObject $policy
```

You can use the script like this:

```powershell
# Set RuleGeoDeny to block the traffic:
.\rule-geo.ps1 -Action "Block"

# Only log the traffic but don't block:
.\rule-geo.ps1 -Action "Log"
```

We can use 
[PowerShell script automation]({% post_url 2023/10/2023-10-30-automating-maintenance-tasks-part1 %})
for running these kind of automations. Automation can run e.g., every 5 minutes to
check if rules need to be adjusted.

This automation enables us to _narrow down access_ and thus reduce the overall impact.
It does mean that users outside the allowed countries won't be able to access the application,
but it's a trade-off that we're willing to take to protect our application availability
to most of the users.

---

Next, we'll do a more complex KQL query based custom rule update.
This requires that we've enabled collecting of
[logs](https://learn.microsoft.com/en-us/azure/application-gateway/application-gateway-diagnostics)
for the Application Gateway:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/appgwdiag1.png" %}

Selecting _Resource specific_ tables as target for the logs:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/appgwdiag2.png" %}

This allows us to use KQL to query the data coming from Application Gateway
and define our own rules based on that data:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/kql.png" %}

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

Here is the _AzureDiagnostics_ table based query (if you selected that as target for the logs):

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

The above queries will return the IP addresses that have made more than 10 000 requests in the last 60 minutes:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/kql2.png" %}

We can now use this information to add, update or delete our dynamic rule.

Remember that the query can really be based on _any data_ we have in our Log Analytics workspace
or data we can bring using [externaldata](https://github.com/JanneMattila/some-questions-and-some-answers/blob/master/q%26a/kql.md#external-data) operator:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/kql3.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/kql4.png" %}

You can use various KQL functions e.g., [geo_info_from_ip_address](https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/geo-info-from-ip-address-function) for creating as complex logic as we want:
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/kql-ip.png" %}

Here's an example query using that function with firewall logs:

```sql
AGWFirewallLogs
| where RuleId == "RuleGeoDeny"
| extend ip = trim_end(".", tostring(array_reverse(split(Message, " "))[0]))
| extend location = geo_info_from_ip_address(ip)
| project Country = tostring(location.country)
| summarize Count=count() by Country
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/kqlgeo.png" %}

You could do _wild_ logic by using
[geo_distance_2points](https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/geo-distance-2points-function)
and block traffic if the distance is above certain limit (keeping in mind the inaccuracies of IP based geolocation).

Your imagination is the limit in these kinds of automations!

---

For our demo purposes, let's use the above _simple rate limiting like query_ to add, update or delete the dynamic rule
(here is an abbreviated version of the script but full script is available in the GitHub repository mentioned later in this post):

```powershell
Param (
    [Parameter(HelpMessage = "Resource group")]
    [string] $ResourceGroupName = "rg-appgw-custom-rules-demo",

    [Parameter(HelpMessage = "Log Analytics Workspace")]
    [string] $WorkspaceName = "log-appgw",

    [Parameter(HelpMessage = "App Gateway WAF Policy name")]
    [string] $PolicyName = "waf-policy",

    [Parameter(HelpMessage = "Custom rule priority")]
    [int] $RulePriority = 80,

    [Parameter(HelpMessage = "Limit of the client HTTP Request")]
    [int] $RequestLimit = 100,
    
    [Parameter(HelpMessage = "Log search timeframe in minutes")]
    [int] $Minutes = 10
)

$ErrorActionPreference = "Stop"

$query = "AGWAccessLogs 
| where OperationName == 'ApplicationGatewayAccess' and
        TimeGenerated >= ago($($Minutes)min)
| summarize count() by ClientIp
| project IP=ClientIp, Requests=count_
| where Requests > $RequestLimit
| order by Requests"

$workspace = Get-AzOperationalInsightsWorkspace -Name $WorkspaceName -ResourceGroupName $ResourceGroupName

$queryResult = Invoke-AzOperationalInsightsQuery -Workspace $workspace -Query $query
$IPs = $queryResult.Results | ForEach-Object { $_.IP }
$IPs

if (0 -eq $IPs.Count) {
    "No IPs found with given query conditions. Removing rule."
}
else {
    $variable = New-AzApplicationGatewayFirewallMatchVariable -VariableName RemoteAddr
    $condition = New-AzApplicationGatewayFirewallCondition -MatchVariable $variable -Operator IPMatch -MatchValue $IPs
    $rule = New-AzApplicationGatewayFirewallCustomRule -Name BlockSpecificIPs -Priority $RulePriority -RuleType MatchRule -MatchCondition $condition -Action Block
    $rule
}

$policy = Get-AzApplicationGatewayFirewallPolicy -Name $PolicyName -ResourceGroupName $ResourceGroupName
$existingRule = $policy.CustomRules | Where-Object { $_.Priority -eq $RulePriority }
if ($null -ne $existingRule) {
    $policy.CustomRules.Remove($existingRule)
}

if (0 -ne $IPs.Count) {
    $policy.CustomRules.Add($rule)
}

Set-AzApplicationGatewayFirewallPolicy -InputObject $policy
```

Now we can use the script like this:

```powershell
# Block all IPs that have made over 10'000 requests in last 60 minutes
.\rule-updater.ps1 -RequestLimit 10000 -Minutes 60
```

If there are any IP addresses that have made over 10 000 requests in the last 60 minutes,
the following rule will be added to the Application Gateway:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/waf2.png" %}

If the situation changes and there are no IP addresses that have made over 10 000 requests in the last 60 minutes, the rule will be removed:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/rules1.png" %}

Rule itself is simple, since it's just blocks specific IP addresses based on the query:

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/rules3.png" %}

In the above example, we've used the requirements of our application to design the rules
in our Application Gateway and WAF.
And this brings us to the next very important points:

## I've deployed the Application Gateway.<br/>Is my job done now?

**No!** You need to plan and make sure that you're prepared for the worst.
Understand your requirements and your application so that you can design and implement
the custom rules accordingly.

### Did you deploy **WAF V2**?

Check that you're in WAF V2 Tier of the Application Gateway:
{% include imageEmbed.html width="20%" height="20%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/appgwtier.png" %}
If you see `Standard V2` then you don't have WAF enabled.

### Is your WAF deployment in [Detection mode](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/ag-overview#waf-modes)?
It should be in **Prevention mode**. Why? Because
[Detection mode](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/application-gateway-waf-faq#does-detection-mode-block-traffic-)
does not block traffic.

### Is your Application Gateway subnet large enough to support scaling **up to 125 instances**?

Recommended
[subnet size](https://learn.microsoft.com/en-us/azure/application-gateway/configuration-infrastructure#size-of-the-subnet)
is `/24`:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/snet.png" %}

### Have you enabled _auto scaling_ without setting max instances?

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/appgw125.png" %}

If you have set the _maximum instance count_ to a low number, then your Application Gateway
won't scale up to the needed number of instances and you might run into issues.

_Did you know_ that if you have DDOS
[network protection](https://azure.microsoft.com/en-us/pricing/details/ddos-protection/)
enabled, then you only pay base price for your Application Gateway and not the higher WAF tier price<br/>
**and**<br/>
you're covered for the scale out costs:

> If the resource is protected with Network Protection,
> any **scale out costs during a DDoS attack are covered** and
> customer will get the cost credit back for those scaled out resources.

See more details from the
[Application Gateway pricing](https://azure.microsoft.com/en-us/pricing/details/application-gateway/)
and
[Azure DDoS Protection pricing](https://azure.microsoft.com/en-us/pricing/details/ddos-protection/)
pages.

### Do you have [default rule set and bot manager rule set](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/application-gateway-crs-rulegroups-rules) both enabled?

Rule set names:

- `Microsoft_DefaultRuleSet`
- `Microsoft_BotManagerRuleSet`

From [Managed rules](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/application-gateway-crs-rulegroups-rules?tabs=drs21):

> The **default rule set** also **incorporates the Microsoft Threat Intelligence Collection rules**.

From [Bot Protection Overview](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/bot-protection-overview):

> The bot mitigation ruleset list of known bad IP addresses **updates multiple**
> **times per day** from the Microsoft Threat Intelligence feed to stay in sync with the bots.

Remember to use the latest versions of the rule sets:

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/managedrulesets.png" %}

### Did you deploy Application Gateway and WAF directly from Azure portal?

Please _please_ **please** use **Infrastructure-as-Code** to deploy the configuration.
Why? It allows everybody to see all the changes using standard development tools and processes:
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/git.png" %}

And some operations might adjust settings without you realizing those changes like mentioned
[here](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/application-gateway-crs-rulegroups-rules?tabs=drs21):

> When changing from one ruleset version to another all disabled and enabled rule settings
> will return to the default for the ruleset you're migrating to.
> This means that **if you previously disabled or enabled a rule**,
> **you will need to disable or enable it again once you've moved to the new ruleset version**.

It would be hard to track these changes if you would do these directly in the Azure Portal.

### Did you test your Application Gateway and WAF setup?

[Azure Load Testing](https://learn.microsoft.com/en-us/azure/load-testing/overview-what-is-azure-load-testing)
is a good way to test your setup.

You can quickly create URL-based tests and run them against your application:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/loadtesting1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/loadtesting2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/loadtesting3.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/loadtesting4.png" %}

You can use testing to see how your rules are working and if you're getting alerts as expected.
It literally takes 30 minutes to set up the test and run it. No excuses for not testing your setup!

You can use
[metrics](https://learn.microsoft.com/en-us/azure/application-gateway/application-gateway-metrics)
view to see how your Application Gateway has scaled during your testing:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/appgwscaling.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/appgwscaling2.png" %}

After load testing, you should have a better idea how many instances your deployment would scale.

You can also test your application with
[Azure Chaos Studio](https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-overview)
to see how your application behaves under different conditions.
But that deserves its own post.

### Did you remember to enable monitoring as shown earlier in this post?

Enable diagnostic settings:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/appgwdiag2.png" %}

Deploy ready-made workbooks for easing up the troubleshooting and analysis:

[Application Gateway WAF Triage Workbook](https://github.com/Azure/Azure-Network-Security/tree/master/Azure%20WAF/Workbook%20-%20AppGw%20WAF%20Triage%20Workbook)

[Azure Monitor Workbook for WAF](https://github.com/Azure/Azure-Network-Security/tree/master/Azure%20WAF/Workbook%20-%20WAF%20Monitor%20Workbook)

**Note:** At the time of writing, the workbooks are built for `AzureDiagnostics` table and not the newer
resource specific tables `AGWAccessLogs`, `AGWFirewallLogs`, and `AGWPerformanceLogs`.

### Have you created alerts, so that you're notified if something is going on in your environment?

You should
[monitor](https://learn.microsoft.com/en-us/azure/application-gateway/monitor-application-gateway)
your Application Gateway by
creating metric and log based alerts.

Example of metric based alert on response status 403:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/metricsalert.png" %}

If you have DDoS protection enabled, then you can use `Under DDoS attack or not` metric:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/01/appgw-and-dynamic-custom-rules/metricsddos.png" %}

And for the log based alerts, you can use any of the ideas presented in the above examples.

## Conclusion

Above guidance and even more can be found in the
[Best practices for Azure Web Application Firewall (WAF) on Azure Application Gateway](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/best-practices)
including sending logs to Microsoft Sentinel etc. 

Remember that Application Gateway is _one_ component in your application architecture.
There are other networking related services that you might need to use to build
your entire solution. This might include services like
[Network Security Groups](https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview)
and
[Azure Firewall](https://learn.microsoft.com/en-us/azure/firewall/overview).

The above _dynamic custom rules example_ is taken from this GitHub repository:

{% include githubEmbed.html text="JanneMattila/azure-application-gateway-demos/appgw-custom-rules" link="JanneMattila/azure-application-gateway-demos/tree/main/appgw-custom-rules" %}

I hope you find this useful!
