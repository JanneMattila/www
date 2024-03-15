---
layout: posts
title: App Service and OpenID Connect with SalesForce
image: /assets/posts/2024/03/25/app-service-and-openid-connect/http-paths.png
date:   2024-03-25 06:00:00 +0300
categories: azure
tags: azure appservice easyauth salesforce
---

[Configure your App Service or Azure Functions app to sign in using an OpenID Connect provider](https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-provider-openid-connect)

<!--


https://jannemattila....develop.lightning.force.com/.well-known/openid-configuration

https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_flows.htm&type=5

-->

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/auth.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/easyauth-diag.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/easyauth-diag2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/local1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/local2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/sf-managed-apps.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/sf-managed-apps2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/sf1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/sf2.png" %}

```json
{
  "sub": "https://login.salesforce.com/id/00...3IAK",
  "zoneinfo": "Europe/Helsinki",
  "email_verified": true,
  "address": {
    "country": "FI"
  },
  "profile": "https://jannemattila....develop.my.salesforce.com/00...3IAK",
  "iss": "https://jannemattila....develop.my.salesforce.com",
  "preferred_username": "janne@jannemattila.com.sandbox",
  "given_name": "Janne",
  "locale": "fi_FI_EURO",
  "nonce": "30c859e4d3db4cd582d90fe1f99b412d_20240312183519",
  "picture": "https://jannemattila....develop.file.force.com/profilephoto/005/F",
  "aud": "3MVG9k02hQh...DMAq__V3nZyvAhh",
  "updated_at": "2024-03-12T17:15:44Z",
  "nickname": "User17102629103167723373",
  "name": "Janne Mattila",
  "phone_number": null,
  "exp": 1710271821,
  "iat": 1710268221,
  "family_name": "Mattila",
  "email": "janne@contoso.com"
}
```
