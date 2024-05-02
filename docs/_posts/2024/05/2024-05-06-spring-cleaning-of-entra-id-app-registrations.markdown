---
title: Spring cleaning of Entra ID app registrations
image: /assets/posts/2024/05/06/spring-cleaning-of-entra-id-app-registrations/apps.png
date: 2024-05-06 06:00:00 +0300
layout: posts
categories: azure
tags: azure governance security
---
I was browsing through my Entra ID app registrations and noticed something interesting:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/06/spring-cleaning-of-entra-id-app-registrations/apps.png" %}

If you look closely at the above list, you'll notice that there is application which is
created already in 2017 and it still has `Current` secret (vs. `Expired`).
Given that this is one of my development tenants and I know that I don't have automation in place to rotate secrets,
I decided to take a closer look at the situation.

I looked that the application and noticed that it has a secret which is valid until `12/31/2299`:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/06/spring-cleaning-of-entra-id-app-registrations/appsecret.png" %}

Okay, that's not good. I started looking at my other apps and noticed that there are actually many of them in the same situation:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/05/06/spring-cleaning-of-entra-id-app-registrations/apps2.png" %}
{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/05/06/spring-cleaning-of-entra-id-app-registrations/apps3.png" %}

And they shared very similar expiration dates for secret (notice the naming!):

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/05/06/spring-cleaning-of-entra-id-app-registrations/appsecret2.png" %}

I decided to write a PowerShell script to scan all my applications and list them if they have secrets which are valid for more than 2 years (or that can be overridden with parameter).
Over the years I have written many scripts to scan Entra ID applications and I decided to use one of them as a base for this script:

{% include githubEmbed.html text="JanneMattila/some-questions-and-some-answers/aad-scan-applications.ps1" link="JanneMattila/some-questions-and-some-answers/blob/master/q%26a/aad-scan-applications.ps1" %}

I modified the script to scan only applications which have secrets that are valid for more than 2 years:

{% include githubEmbed.html text="JanneMattila/some-questions-and-some-answers/entra-scan-application-secrets.ps1" link="JanneMattila/some-questions-and-some-answers/blob/master/q%26a/entra-scan-application-secrets.ps1" %}

You can use the script like this:

```powershell
# Scan all applications with secret valid more than 2 year
.\entra-scan-application-secrets.ps1

# Scan all applications with secret valid more than 5 year
.\entra-scan-application-secrets.ps1 -MaxDaysToFuture (365 * 5)
```

Here is my output:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/06/spring-cleaning-of-entra-id-app-registrations/excel.png" %}

I have to now go and fix these applications. Please go and check your applications as well!

I hope you find this useful!
