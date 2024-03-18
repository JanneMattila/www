---
title: Application Gateway and Web Application Firewall rule updater
image: /assets/posts/2024/04/01/appgw-and-rule-updater/webapp-create.png
date: 2024-04-01 06:00:00 +0300
layout: posts
categories: azure
tags: azure appgw
---
[Azure Application Gateway](https://learn.microsoft.com/en-us/azure/application-gateway/overview)
is a web traffic load balancer allowing you to secure access to your web applications.
It has many [features](https://learn.microsoft.com/en-us/azure/application-gateway/features)
but in this post, I'll focus on the
[Web Application Firewall (WAF)](https://learn.microsoft.com/en-us/azure/web-application-firewall/overview)
feature.


{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/15/appgw-and-privatelink/appgw.png" %}

{% include githubEmbed.html text="JanneMattila/azure-application-gateway-demos/appgw-custom-rules" link="JanneMattila/azure-application-gateway-demos/tree/main/appgw-custom-rules" %}
