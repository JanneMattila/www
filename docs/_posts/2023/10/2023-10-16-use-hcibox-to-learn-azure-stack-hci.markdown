---
layout: posts
title:  "Use HCIBox to learn Azure Stack HCI"
image: /assets/posts/2023/10/16/use-hcibox-to-learn-azure-stack-hci/share.png
date:   2023-10-16 06:00:00 +0300
categories: azure
tags: azure arc jumpstart hci
---
[Azure Arc Jumpstart](https://azurearcjumpstart.io) is a great resource if you need to learn or test out various Arc scenarios. 
Recently I had to test out few things with [Azure Stack HCI](https://learn.microsoft.com/en-us/azure-stack/hci/overview)
and Azure Arc Jumpstart came to the rescue with its [Jumpstart HCIBox](https://azurearcjumpstart.io/azure_jumpstart_hcibox/). 
Just follow those instructions as you're good to go.

What makes HCIBox so interesting, is the fact how it's built using nested virtualization.
It's a great way to learn and test various scenarios without the need to have physical hardware.
That implementation is a great example that you can use to create other nested virtualization scenarios too.

Since I like to deploy my environment using scripts, 
I've created a little PowerShell helper for deploying my HCI environment. 
You can find it here:

{% include githubEmbed.html text="JanneMattila/azure-arc-demos" link="JanneMattila/azure-arc-demos/blob/main/hci/deploy.ps1" %}

**Here are the step-by-step instructions on how you can test it too.**

_You can navigate between the images below by clicking the left or right side of the image or use arrow keys for navigation._

_Click in the middle to enlarge the image._

{% include carouselEmbed.html postfix="1" imageNamePrefix="hcibox" imageCount="30" text="HCIBox deployment instructions" path="/assets/posts/2023/10/16/use-hcibox-to-learn-azure-stack-hci" %}

I hope you now have a good high-level overview of what HCIBox is and how to deploy it to yourself.

This is a safe environment for you to test out and break things and learn as you go.

Hopefully, I got you interested in Azure Stack HCI and Azure Arc Jumpstart.
Now it's your turn to go and test it out yourself.
