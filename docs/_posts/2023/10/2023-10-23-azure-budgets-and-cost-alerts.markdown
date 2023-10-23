---
layout: posts
title:  "Azure budgets and cost alerts are your friends"
image: /assets/posts/2023/10/23/azure-budgets-and-cost-alerts/email.png
date:   2023-10-23 06:00:00 +0300
categories: azure
tags: azure budget cost alert
---
When new Azure projects are started, development teams very
often use [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/) 
for estimating their costs. 
Some teams even use that information to adjust their architecture to optimize their cost structure. 
Pricing calculator is also often used for estimating separately production
and non-production costs. That helps to estimate the total
running costs of their solution. 

_Unfortunately_, too often after this initial estimation
next step is to monitor costs after the fact e.g., 
"_What was our cost for previous month or quarter?_"

I would like this to be improved so that teams
have better  visibility and control over their costs.
After all, you most likely would want to know about 
higher-than-expected costs sooner rather than later.

**Luckily, we already have tools for this purpose!**

## Budgets and cost alerts

{% include imageEmbed.html link="/assets/posts/2023/10/23/azure-budgets-and-cost-alerts/budget.png" %}

[Budgets](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets) 
are a good way of defining the cost limits
and [cost alerts](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/cost-mgt-alerts-monitor-usage-spending) 
at different levels.
You might have a budget for specific applications
and another one for the entire subscription. 

Your budget configuration should not be 
"_do it once and forget it existence_" but instead 
it should be asset that you maintain as
any other component of the application. 
If things change you should adjust the budget as well. 

I recommend teams set up the alerting limits so
that they should get notifications even under
the normal usage circumstances. 
Let me walk through simple example of subscription level budget.

My budget for "_development_" subscription is set to 500 euros.

{% include imageEmbed.html link="/assets/posts/2023/10/23/azure-budgets-and-cost-alerts/edit_budget.png" %}

To get mid-month notifications, I've set up my cost alerts like this:

| Type       | % of budget | Amount  | 
| ---------- | ----------- | ------- |
| Forecasted | 50 %        | 250 USD |
| Forecasted | 100 %       | 500 USD |
| Actual     | 50 %        | 250 USD |
| Actual     | 100 %       | 500 USD |

{% include imageEmbed.html link="/assets/posts/2023/10/23/azure-budgets-and-cost-alerts/edit_budget2.png" %}

Why would I like to get notifications if either "forecasted" or "actual"
is hitting the 50% mark?
It's typically good indication that how fast I’m approaching the budget limit. 
If nothing special happens, I’m expecting to get notifications around 15th of each month.
It tells me that I’m on the schedule and the cost are not accumulating faster than expected.

Here is example alert that I've received 11th of the month, so a bit ahead of the mid-month schedule:

{% include imageEmbed.html link="/assets/posts/2023/10/23/azure-budgets-and-cost-alerts/email.png" %}

Many times, when I’m testing various topics with AKS clusters or Azure Firewall or Azure Stack HCI,
I’ll get cost alert email earlier e.g., 10th of that month. 
That email contains information that helps me to understand the forecasted cost.
It reminds me that I should release my test environments or shut them down to save costs.
It’s also easy to calculate from days that how much over I’m most likely to go.
If I need more information, I can go to [Cost analysis](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/reporting-get-started#cost-analysis) to study my costs.
At the end of the month, I might get notification if the cost is going over the budget. 
Again, this is just a safety net for me to be aware of the situation.

Getting notifications is a good way of verifying that your notification setup is working.
This is especially important if you pass this notification using webhook to your ChatOps channel
or something similar, which might expire after some time.

If you only use "actual" cost alert with value which is equal to your budget, 
then you will get notification only when you have already exceeded your budget.
That might be already too late, and you might need to rapidly check if something
unexpected is happening. Of course, **it's much worse if you see this unexpected cost**
**after one or two months**. That's why I like to get notifications before that happens. 

These alerts have saved me many times from big surprises. 
I often need to test various workloads that might be using features
that make it harder to estimate the exact cost.
Or then I need to test services that have high compute cost, 
so I want to optimize their run time to save costs. 
If I have some long running process, 
then the very next day I want to clean that up to save costs.

Remember: **Budget alert is your friend!**

I hope you find this useful!
