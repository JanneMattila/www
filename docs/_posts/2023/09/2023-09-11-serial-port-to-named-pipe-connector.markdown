---
layout: posts
title:  "Serial port to named pipe connector"
image: /assets/posts/2023/09/04/apim-developer-portal-content/share.png
date:   2023-09-02 06:00:00 +0300
categories: iot
tags: iot development home-assistant hyper-v
---
I'm big [Home Assistant](https://www.home-assistant.io/) fan. 
I have been running it with Raspberry Pi for two years but I decided to 
upgrade my setup to Intel NUC early this year.

I wanted to use that machine also for [AKS Edge Essentials](https://learn.microsoft.com/en-us/azure/aks/hybrid/aks-edge-overview) (because everybody wants to run Kubernetes in their living room right? _Right?_). 

Therefore, I decided to run Home Assistant in Hyper-V VM in that same machine.

{% include imageEmbed.html link="/assets/posts/2023/09/11/serial-port-to-named-pipe-connector/zigbee-home-assistant-automation.png" height="209" weight="400" %}

[Zigbee USB Gateway - Conbee II](https://phoscon.de/en/conbee2)

Intel NUC

Serial port (e.g., COM3) to named pipe (e.g., \\\\.\\pipe\\com2) connector

{% include githubEmbed.html text="JanneMattila/serialport2namedpipe" link="JanneMattila/serialport2namedpipe" %}
