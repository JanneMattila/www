---
layout: posts
title:  "Running Home Assistant in Hyper-V with Zigbee USB Gateway"
image: /assets/posts/2023/09/11/running-home-assistant-in-hyper-v/hyper-v.png
date:   2023-09-11 06:00:00 +0300
categories: iot
tags: iot development home-assistant hyper-v
---
I'm a big [Home Assistant](https://www.home-assistant.io/) fan. 
I have been running it with Raspberry Pi for two years, but I decided to 
upgrade my setup to [Intel NUC](https://www.intel.com/content/www/us/en/products/details/nuc.html) early this year.

At the same time, I wanted to use that same machine for [AKS Edge Essentials](https://learn.microsoft.com/en-us/azure/aks/hybrid/aks-edge-overview) 
and [Azure Arc](https://learn.microsoft.com/en-us/azure/azure-arc/overview) demos as well.
My Intel NUC is placed in my living room because _everybody wants to run Kubernetes in their living room_, right? Right?

Therefore, I decided to run Home Assistant OS in Hyper-V on that same machine. 
It would be the easiest way to go, and I have flexibility to demonstrate other 
cool Azure capabilities from the same machine too. 

I was using _Zigbee Home Automation_ in my previous Home Assistant setup and apparently, 
I already had 16 devices connected to that:

{% include imageEmbed.html link="/assets/posts/2023/09/11/running-home-assistant-in-hyper-v/zigbee-home-assistant-automation.png" height="209" weight="400" %}

It was clear that getting these devices to work in my new   setup was a must.

I have [ConBee II Zigbee USB Gateway](https://phoscon.de/en/conbee2)
and it has been working flawlessly in my previous setup. 
After I started to test my new fancy setup, 
I realized one important thing that I've missed earlier. 
I couldn't just pass through that USB gateway to my Home Assistant. 
There isn't a setting to enable that in Hyper-V Manager:

{% include imageEmbed.html link="/assets/posts/2023/09/11/running-home-assistant-in-hyper-v/hyper-v.png" %}

I looked for alternative configuration options but couldn't find anything that would solve my problem. 

While studying this a bit, I noticed that I _could_ however **map serial port in the guest OS to named pipe in the host OS**.

After I realized that capability, I started to see the solution.
I looked for ready-made solutions, but I couldn't find anything that 
I _wanted_ to install to my machine as permanent solution.

So, I did what developers do: I wrote my own solution.

I call it `serialport2namedpipe` and it's available in my GitHub repository:

{% include githubEmbed.html text="JanneMattila/serialport2namedpipe" link="JanneMattila/serialport2namedpipe" %}

Repo contains more details about the solution and a sequence diagram that explains
how it works in practice.

I have been running this solution for 6 months now and it has been working very well.

---

I mentioned that I've also installed Azure Arc and AKS Edge Essentials to the same machine.
But more about those in my next post so stay tuned!
