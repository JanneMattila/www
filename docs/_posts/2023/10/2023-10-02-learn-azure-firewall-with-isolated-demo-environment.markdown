---
layout: posts
title:  "Learn Azure Firewall with isolated demo environment"
image: /assets/posts/2023/10/02/learn-azure-firewall-with-isolated-demo-environment/azure-firewall-demo.png
date:   2023-10-02 06:00:00 +0300
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

---

**Here are the step-by-step instructions on how you can test it too**

_You can navigate between the images below by clicking the left or right side of the image
or use arrow keys for navigation._

_Click in the middle to enlarge the image._

{% include carouselEmbed.html postfix="1" names="0_start,1_repo,2_git,3_setup_vscode,4_open_run_ps1,5_run_tree,6_deploy1,7_deploy_complete,8_azure_portal,9_login_to_jumpbox,10_jumpbox1,11_jumpbox_connectivity_to_spokes,12_jumpbox_deny,13_jumpbox_exit,14_fw_rgc,15_study_bicep,16_remove" text="Azure Firewall Demo deployment instructions" path="/assets/posts/2023/10/02/learn-azure-firewall-with-isolated-demo-environment" %}

Remember to use my [VS Code]({% post_url 2023/08/2023-08-28-vs-code-and-faster-script-development %}) tricks to speed up your testing.

---

After running those basic connectivity tests as shown in the screenshots, you should see the following logs at the `AZFWApplicationRule` table:
    
{% include imageEmbed.html link="/assets/posts/2023/10/02/learn-azure-firewall-with-isolated-demo-environment/firewall-logs.png" %}

Now you're good to go and start testing various firewall rules and routing configurations.
Remember to delete the resource group when you're done with your testing.

I hope you find this useful!
