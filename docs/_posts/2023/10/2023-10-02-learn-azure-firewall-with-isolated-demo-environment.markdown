---
layout: posts
title:  "Learn Azure Firewall with isolated demo environment"
image: /assets/posts/2023/10/02/learn-azure-firewall-with-isolated-demo-environment/azure-firewall-demo.png
date:   2030-10-02 06:00:00 +0300
categories: azure
tags: azure firewall learn
---
Implementing network changes into running environments is hard. 
It's like changing a tire on a moving car. 
There is always a risk that things go horribly wrong, 
and it causes downtime to the environment. 
Therefore, customers don’t want to "test" these changes just for fun.
Also introducing new network components requires careful planning and testing.

When [Azure Firewall](https://learn.microsoft.com/en-us/azure/firewall/overview) was introduced a few years ago, 
many customers were interested in its capabilities. 
It's quite different to talk about these capabilities vs.
showing them in action. Enabling customers to try it out
by themselves is even better.
_Doing this in a safe manner and isolation from their existing infrastructure is a must_. 

Above topics got me and my colleague [Tomi Pietilä](https://www.linkedin.com/in/tomi-pietila/) thinking about demo setup
that can be spin up fast and so that you can use it to test various features.
And not only test features but also test handling the various firewall rules
so that it would be easy to maintain in the long run.

Here's the architecture of the demo we've built:

{% include imageEmbed.html link="/assets/posts/2023/10/02/learn-azure-firewall-with-isolated-demo-environment/azure-firewall-demo.png" %}

To test the connectivity and firewall rules, we're using the [webapp-network-tester](https://github.com/JanneMattila/webapp-network-tester) tool that I've blogged earlier. Read more about it [here]({% post_url 2023/08/2023-08-22-testing-your-network-configuration %}). 

Azure Firewall Demo is built using Bicep and it deploys [Hub-spoke network topology](https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/hybrid-networking/hub-spoke) with 3 spokes.
Each of the spokes have `webapp-network-tester` tool running in [Azure Container Instances](https://learn.microsoft.com/en-us/azure/container-instances/container-instances-overview).
This setup enables us to test routing and firewall changes
in this isolated environment without any impact on your other networks.
This is a good environment to learn Azure networking fundamentals. 
**You're free to break things in this setup!**

Here is an illustration of how you can test firewall rules by connecting
to the jumpbox using Azure Bastion and then executing tests using `webapp-network-tester` tool:

{% include imageEmbed.html link="/assets/posts/2023/10/02/learn-azure-firewall-with-isolated-demo-environment/test-flow.png" %}

Here is the Azure Firewall demo repo:

{% include githubEmbed.html text="JanneMattila/azure-firewall-demo" link="JanneMattila/azure-firewall-demo" %}

Repository contains more detailed information on how to get started,
what's the architecture in more detail and some tasks for you to implement for learning purposes.

<!--
I recorded a quick screencast on how you can deploy it yourself:

{% include youtubeEmbed.html id="jWbj7LMQv-g" %}
-->

After doing the basic tests, you should see following logs in the `AZFWApplicationRule` table:
    
{% include imageEmbed.html link="/assets/posts/2023/10/02/learn-azure-firewall-with-isolated-demo-environment/firewall-logs.png" %}

Okay now it's your turn to try it out and deploy some firewalls!
