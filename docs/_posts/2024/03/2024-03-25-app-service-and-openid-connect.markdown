---
layout: posts
title: App Service and OpenID Connect with SalesForce
image: /assets/posts/2024/03/25/app-service-and-openid-connect/http-paths.png
date:   2024-03-25 06:00:00 +0300
categories: azure
tags: azure appservice easyauth salesforce
---
[Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/overview)
is one of those services that has a lot of features and capabilities.
It's _the go-to service_ for hosting web applications, REST APIs, and mobile backends.

One of the built-in features is [authentication](https://learn.microsoft.com/en-us/azure/app-service/overview-authentication-authorization).
It's often referred to by the name _Easy Auth_.
It supports many [identity providers](https://learn.microsoft.com/en-us/azure/app-service/overview-authentication-authorization#identity-providers)
including any _OpenID Connect_ capable identity provider.

In this post, I'll show how to configure your App Service to use
[SalesForce](https://www.salesforce.com/) as the identity provider.
Read more from the documentation about how to
[configure your App Service or Azure Functions app to sign in using an OpenID Connect provider](https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-provider-openid-connect).

Here's a high-level overview of App Service authentication process:

{% include mermaid.html text="
sequenceDiagram
    actor User
    User->>EasyAuth: Access web app<br/>as a anonymous user
    EasyAuth->>User: Redirect to<br/>authentication provider
    User->>AuthProvider: Login
    AuthProvider->>User: Redirect back to web app
    User->>EasyAuth: Access web app<br/>as a authenticated user
    Note right of EasyAuth: Add identity<br/>to HTTP headers
    EasyAuth->>AppService: Request 
    Note right of AppService: Access<br/>headers
    AppService->>User: Response
" %}

_Easy Auth_ is especially handy if you don't want to use any custom code to handle the authentication
or have older application that you just want to publish to you end users and 
quickly enable e.g. Entra ID authentication.

You can start the configuration process by navigating to your App Service and then
selecting _Authentication_ from the left-hand side menu:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/openid2.png" %}

You can then select _Add identity provider_ and then _OpenID Connect_:

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/openid3.png" %}

It will then ask you to provide the _Document URL_,  _Client ID_ and _Client Secret_ for your OpenID Connect provider:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/openid1.png" %}

Since I'm using SalesForce as my OpenID Connect provider, I can follow the official documentation on how to
[create a Connected App](https://help.salesforce.com/s/articleView?id=sf.connected_app_create.htm&type=5)
which then allows me to use it as identity provider.

I navigated to my developer instance: 
{% include imageEmbed.html width="50%" height="50%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/sf-managed-apps.png" %}

I followed the documentation and created a new _Connected App_ called _Azure App Service_.
These are the most important settings that I configured:

- _Callback URL_ to match my App Service URL:
```
https://....azurewebsites.net/.auth/login/SalesForce/callback
```
- [Required](https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-provider-openid-connect#-add-provider-information-to-your-application) OAuth scopes: 
  - `openid`
  - `profile`
  - `email` 

Here's my configuration:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/sf2.png" %}

I copied also _Consumer Key_ and _Consumer Secret_:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/sf-managed-apps2.png" %}

I took a note of the _Document URL_ based on the [documentation](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_endpoints.htm&type=5):

```
https://jannemattila....develop.lightning.force.com/.well-known/openid-configuration
```

Your _Document URL_ should respond anonymously with the OpenID Connect configuration.

After that, I went back to my App Service and filled in the required fields:

- Open ID provider name: _SalesForce_
- Document URL: _https://jannemattila....develop.lightning.force.com/.well-known/openid-configuration_
- Client ID: _Consumer Key_
- Client Secret: _Consumer Secret_

After saving the above configuration, I just opened that app service url and I got redirected to SalesForce login page.
After successful login, I got a consent screen and then I was redirected back to my web app:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/sf1.png" %}

My app echoes HTTP headers and you can see that
[identity headers](https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-user-identities#access-user-claims-in-app-code)
are also included:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/auth.png" %}

I can further analyze that token in [jwt.ms](https://jwt.ms):


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

Of course, I did stumble a bit while configurating Connected app in SalesForce side,
but  _Diagnose and solve problems_ feature in App Service helped me to understand
what was wrong in my configuration:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/easyauth-diag2.png" %}

Easy Auth Errors/Warnings:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/25/app-service-and-openid-connect/easyauth-diag.png" %}

I had unnecessary configuration related to the _audience_ and that was causing the problem because
token validation failed.

I hope you find this useful!
