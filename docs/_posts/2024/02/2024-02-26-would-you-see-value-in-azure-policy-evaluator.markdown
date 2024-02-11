---
title: Do you see value in Azure Policy Evaluator?
image: /assets/posts/2024/02/26/do-you-see-value-in-azure-policy-evaluator/ape.png
date: 2024-02-26 06:00:00 +0300
layout: posts
categories: azure
tags: azure management governance
---
[Azure Policy](https://learn.microsoft.com/en-us/azure/governance/policy/overview)
is a powerful tool for enforcing governance and compliance at-scale in Azure. 
It's foundational element both in 
[Cloud Adoption Framework](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/)
and 
[Azure Landing Zones (Enterprise-Scale)](https://github.com/Azure/Enterprise-Scale).
It has a lot of material available from 
[Adopt policy-driven guardrails](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/enterprise-scale/dine-guidance)
to 
[Azure Policy definition structure](https://learn.microsoft.com/en-us/azure/governance/policy/concepts/definition-structure).
Also there are tons of other excellent resources like
[AzAdvertizer](https://www.azadvertizer.net/),
[Azure Policy Samples](https://github.com/Azure/azure-policy/),
and
[Community Policy Repo](https://github.com/Azure/Community-Policy/)
to just name a few.
So, we have a lot of material available for creating and managing policies.

**_However_**, I've not been too happy how the actual policy development process works.
For a long time, I have been thinking that it should be much closer to any
software development process that it currently is.

If I compare Azure Policy development to e.g., .NET development, then it's clear that it's quite different.
Let me try to compare these two next.

In **.NET** development, I can use Visual Studio to write the code and I can use unit tests
for verifying that it works as expected.
This of course improves the quality of the code and makes it easier to maintain and evolve.
The feedback loop is intantaneous and I can see the results of my changes immediately.
If I have good set of tests, I can see the results rightaway and
fix my code when it's still fresh in my mind.
This can be categorized as _Inner Loop development_.

In **Azure Policy** development, I typically edit the policy JSON files in a text editor such as VS Code.
Then I deploy the policy to Azure and sometimes I have to wait for a bit and then start deploying
resources to see if the policy actually works as expected.
I have to pay a lot of attention to the test with correct test scenarios to validate my policy.
I might easily miss some important test scenarios unless I have them planned and written down.
This kind of process is pretty close to any _manual release testing_ process and
can categorized as _Outer Loop development_.

But it doesn't have to be like this. We could implement a tool that would allow us to
develop and test policies in a similar way as we develop and test .NET code.
This would allow us to have a much faster feedback loop and
we could be more confident that our policies actually work as expected.

Therefore, I've created a _experimental_ tool called **Azure Policy Evaluator**!

Idea is simple: Bring the _Inner Loop development_ to Azure Policy development.

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/26/do-you-see-value-in-azure-policy-evaluator/ape.png" %}

To evaluate single policy against single test file:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/26/do-you-see-value-in-azure-policy-evaluator/single-policy.png" %}

To see `debug` level logging:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/26/do-you-see-value-in-azure-policy-evaluator/debug.png" %}

To run all tests from a folder and its sub-folders:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/26/do-you-see-value-in-azure-policy-evaluator/run-tests.png" %}

Here is a short demo of the `watch` mode in action:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/26/do-you-see-value-in-azure-policy-evaluator/ape.gif" %}

You can find _Azure Policy Evaluator_ here:

{% include githubEmbed.html text="JanneMattila/azure-policy-evaluator" link="JanneMattila/azure-policy-evaluator" %}

Please provide [feedback](https://github.com/JanneMattila/azure-policy-evaluator#feedback)
in the GitHub Discussions.

I hope you find this useful!
