---
title: Standard logic app and EasyAuth
image: /assets/share.png
date: 2024-11-18 06:00:00 +0300
layout: posts
categories: azure
tags: azure logic-app easyauth
---

I've previously blogged about EasyAuth 

[App Service and OpenID Connect with Salesforce]({% post_url 2024/03/2024-03-25-app-service-and-openid-connect %})

[Application Gateway and App Service authentication]({% post_url 2024/04/2024-04-08-appgw-and-app-service-authentication %})

[Trigger workflows in Standard logic apps with Easy Auth](https://techcommunity.microsoft.com/t5/azure-integration-services-blog/trigger-workflows-in-standard-logic-apps-with-easy-auth/ba-p/3207378)

https://github.com/JanneMattila/azure-logic-apps-demos/tree/main/easyauth

- create spn
- login
- invoke-azrest for logic app
- get access token -> jwt.ms
- invoke-azrest for easyauth
- same works with managed identity as show in the previous post

