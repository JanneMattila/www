---
layout: posts
title:  "\"Microsoft Defender for Cloud has detected suspicious activity in your environment\""
image: /assets/posts/2023/11/13/defender-suspicious-activity/alert-list.png
date:   2023-11-13 06:00:00 +0300
categories: azure
tags: azure security defender
---
You might have received emails from "Microsoft Defender for Cloud" similar to this:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/email-dangling-domain.png" %}

or similar to this:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/email-sensitive-volume-mount.png" %}

or one with extra bonus twist and _multiple alerts_ from single cluster in one email:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/email-multiple.png" %}

and if you haven't, then please go to:

**Microsoft Defender for Cloud > Environment settings > Select subscription > Email notifications**

and validate that your settings are correct:

{% include imageEmbed.html link="/assets/posts/2023/11/13/defender-suspicious-activity/email-notifications.png" %}

after that you should go to:

**Microsoft Defender for Cloud > Security alerts**

and see your "Security alerts" list in case you have not noticed them before:

{% include imageEmbed.html link="/assets/posts/2023/11/13/defender-suspicious-activity/alerts-list.png" %}

and if you for some reason haven't yet enabled it, then now is good time to do that.

**Microsoft Defender for Cloud > Environment settings > Select subscription > Defender plans: Enable all plans**

Or you can follow instructions from here:
[Connect your Azure subscriptions](https://learn.microsoft.com/en-us/azure/defender-for-cloud/connect-azure-subscription)

---

But let's get back to my list of alerts above. It does look bad, doesn't it?
Let's go them through one-by-one.

### Dangling domain

I use [Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/overview) a lot. It's
my go to service for hosting web applications. 

Quite often, I use custom domains in my demos to match customers testing scenarios.
Things are always a bit harder if you have your own domain and then you need to
use your own certificates etc.

Of course, I do clean up environments after demos, but cleaning up 

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/dangling-domain.png" %}
{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/dangling-domain2.png" %}

