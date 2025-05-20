---
layout: posts
title: "\"Error: The client ... has permission to perform action ... however, it does not have permission to perform action(s)...\""
image: /assets/posts/2025/05/20/aks-defender/defender.png
date: 2025-05-20 06:00:00 +0300
categories: azure
tags: azure aks kubernetes defender workaround
---

Let’s go through scenario, where AKS operator tries to upgrade cluster but it fails for the following error:

> **Failed to save Kubernetes service 'aks-janne'.**<br/>
> Error: The client '...' with object id '...'
> has permission to perform action 'Microsoft.ContainerService/managedClusters/write' 
> on scope 
> '/.../Microsoft.ContainerService/managedClusters/aks-janne';<br/>
> **however, it does not have permission** to perform action(s) 'Microsoft.OperationalInsights/workspaces/sharedkeys/read' 
> on the linked scope(s) 
> '/.../Microsoft.OperationalInsights/workspaces/DefaultWorkspace-c7f...58c-SEC'
> (respectively) or the linked scope(s) are invalid.

This unfortunately, will prevent from you to upgrade your cluster. Let me show when you might hit this problem.

Here are the steps, how I can get into that error message. First, I have access to resource group that AKS is deployed:

{% include imageEmbed.html link="/assets/posts/2025/05/20/aks-defender/upgrade-0.png" %}

I have _Owner_ role assigned to me:

{% include imageEmbed.html link="/assets/posts/2025/05/20/aks-defender/upgrade-1.png" %}

{% include imageEmbed.html link="/assets/posts/2025/05/20/aks-defender/upgrade-2.png" %}

If I now select upgrade and hit save:

{% include imageEmbed.html link="/assets/posts/2025/05/20/aks-defender/upgrade-3.png" %}

I’m getting the above error:

{% include imageEmbed.html link="/assets/posts/2025/05/20/aks-defender/upgrade-4.png" %}

Error message gives hint that it tries to access Log Analytics workspace
but I don't have access to that workspace and therefore, the upgrade is blocked.

Let's check the _JSON View_ of our AKS resource

{% include imageEmbed.html link="/assets/posts/2025/05/20/aks-defender/upgrade-8.png" %}

Select latest API Version and then search _Defender_:

{% include imageEmbed.html link="/assets/posts/2025/05/20/aks-defender/upgrade-9.png" %}

Value for `logAnalyticsWorkspaceResourceId` happens to be exactly that Log Analytics workspace from the above error message.

It might be that [Microsoft Defender for Containers](https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-containers-enable)
has been deployed by some other team like Platform engineering team 
using [Azure Policies](https://www.azadvertizer.net/azpolicyadvertizer/64def556-fbad-4622-930e-72d1d5589bf5.html):

{% include imageEmbed.html link="/assets/posts/2025/05/20/aks-defender/policy-1.png" %}

And they have configured it to use Log Analytics workspace that you don't have access to:

{% include imageEmbed.html link="/assets/posts/2025/05/20/aks-defender/policy-2.png" %}

For _quick workaround_, you can _disable_ Defender sensor for the duration of your cluster upgrade.
You can do that, since you're _Owner_ of that resource. 
Not ideal, but might be just enough to get you unblocked for the upgrade:

```bash
az aks update -n aks-janne -g rg-aks-workshop-janne --disable-defender
```

I've executed the above command in Cloud shell:

{% include imageEmbed.html link="/assets/posts/2025/05/20/aks-defender/upgrade-5.png" %}

Now if I check the property value of `logAnalyticsWorkspaceResourceId`, I can see it's
not any more visible in the resource JSON and `securityMonitoring` is not enabled:

{% include imageEmbed.html link="/assets/posts/2025/05/20/aks-defender/upgrade-6.png" %}

Now I can execute the cluster upgrade:

{% include imageEmbed.html link="/assets/posts/2025/05/20/aks-defender/upgrade-7.png" %}

Note that [deployIfNotExists](https://learn.microsoft.com/en-us/azure/governance/policy/concepts/effect-deploy-if-not-exists)
will automatically deploy Defender back. This can be seen in the _Activity log_:

{% include imageEmbed.html link="/assets/posts/2025/05/20/aks-defender/activity-log-1.png" %}
{% include imageEmbed.html link="/assets/posts/2025/05/20/aks-defender/activity-log-2.png" %}

This _workaround_ might get you unblocked but hopefully this gets improved
and you wouldn't need to use it anymore.
