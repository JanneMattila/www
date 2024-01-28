---
title: CMS in Azure App Service and weird behavior
image: /assets/posts/2024/02/05/appservice-issue/webapp-create.png
date: 2024-02-05 06:00:00 +0300
layout: posts
categories: azure
tags: azure aspnet appservice cms
---
I was troubleshooting incident over a year ago with Azure App Service.
Customer was running a Content Management System (CMS) on the App Service
and it started randomly do something really weird.
Before this weird behavior, it has been running fine for years.

When troubleshooting, I made all the usual questions:

- Has something changed recently?
- Have you deployed new version of the application?
- Have you changed some configurations or settings?

Nothing had really changed so we had to dig deeper.

But as many times before, when applications have been running for a long time,
you might end up having more and more data in your system.
This can happen with databases and they start to become slower over time.
You might be able to fix the situation with adding missing indexes but
sometimes you need to study quite much more why performance decreases over time.

In this particular case the problem wasn't database. 
App Service ended up doing restarts and we didn't quite understand why.
At first glance platform metrics or logs weren't indicating anything special to us.

In the discussions with the customer, we found out that they had
background processing logic in the application. It was doing some
kind of caching of image etc. files. It has been running again for ages
so it should not cause any issues.

Suddenly, we found something interesting:

> **HostingEnvironment**:<br/>
> The hosting environment **shut down the application domain**.<br/>
> This typically happens when the app is restarted either by user or platform

And then additional details:

> Directory rename change notification for 'D:\home\site\wwwroot'.<br/>
> **Overwhelming** Change Notification in wwwroot 

After seeing that error message, things started to become more clear.
That specific word "overwhelming" already told me, that this might not be
actually App Service specific issue but instead something underneath.
App Service is a Platform as a Service (PaaS) offering and 
it does build on top of other existing products and capabilities.
In this specific setup it means building on top of Windows, IIS and ASP.NET.

If you search for "overwhelming change notification" you will find
_millions_ of search results. That's a lot! And many of these blogs
are older than 10 years e.g., 
[ASP.NET File Change Notifications, exactly which files and directories are monitored](https://learn.microsoft.com/en-us/archive/blogs/tmarq/asp-net-file-change-notifications-exactly-which-files-and-directories-are-monitored)
from year 2007.
So, quite quickly you realize that this it's not that uncommon issue
and most likely you can find solution from these different blogs.
Here are two example blogs with tons of good information 
[azure-web-restarting-automatically-due-to-overwhelming-change-notification](https://www.rahulpnath.com/blog/azure-web-restarting-automatically-due-to-overwhelming-change-notification/) and
[all-about-aspnet-file-change-notification-fcn](https://shazwazza.com/post/all-about-aspnet-file-change-notification-fcn/).

> It's quite much easier to _solve the problem_ **if** you _understand the problem_.

Soon after the above finding, we understood the root cause.
Indeed, that background processing logic which created files and folders
was causing the issues in the application.

Before going to the solution, let's first understand what happened.

I'll create App Service with ASP.NET V4.8 as the runtime stack:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/05/appservice-issue/webapp-create.png" %}

Then I'll deploy my test application from here:

{% include githubEmbed.html text="JanneMattila/webapp-and-folders" link="JanneMattila/webapp-and-folders" %}

Key piece of code is taken from this repository (from the above blog posts):

{% include githubEmbed.html text="Shazwazza/UmbracoScripts" link="Shazwazza/UmbracoScripts/blob/master/src/Web/ASPNetFileMonitorList.cshtml" %}

It displays detailed debugging information about FCN configuration in the simple view.

After deploying the application and refreshing the FCN view, it shows me this:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/05/appservice-issue/webapp-fcn-0.png" %}

That is preffy big list of things it is monitoring.

Let's add some spices to the mix by adding two WebJobs to the application.

- WebJob that creates folders and files under `wwwroot` folder
- WebJob that fetches those pages

Here is simple PowerShell script to create 50000 folders and files:

```powershell
$filePath = "C:\home\site\wwwroot"
Set-Location $filePath

mkdir a -ErrorAction SilentlyContinue
Set-Location a

for ($i = 0; $i -lt 50000; $i++) {
  mkdir $i -ErrorAction SilentlyContinue
  "<html><body><h1>Test $(Get-Date)</h1></body></html>" | Out-File "$i\index.html"
}
```

And here is the WebJob that fetches those pages:

```powershell
for ($i = 1; $i -lt 50001; $i++) {
  $i
  iwr -UseBasicParsing "https://myfilesystemtestingapp.azurewebsites.net/a/$i" | Out-Null
}
```

We can now deploy those above scripts as WebJobs to the App Service and start them:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/05/appservice-issue/webjobs.png" %}

If we now refresh the FCN view, we can see that it is monitoring even more things:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/05/appservice-issue/webapp-fcn-0-2.png" %}

So, indeed it's expanding that list of things it is monitoring.
This is the default behavior.

FCN can be configured using [fcnMode](https://learn.microsoft.com/en-us/dotnet/api/system.web.configuration.fcnmode?view=netframework-4.8.1).
If you run the above test using `Single` as the FCN mode, then 
this would be visible in the debugging view:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/05/appservice-issue/webapp-fcn-2.png" %}

The above list does not expand anymore. 
But if there are "overwhelming" amount of changes, it might restart the application.

Please read the above mentioned blogs for more details about the behavior and
especially before you plan to do any changes to your application.

---

In our case, we took the approach to disable FCN monitoring completely.
This can be done by adding `fcnMode="Disabled"` configuration to the `web.config` file:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.web>
    <httpRuntime targetFramework="4.8" fcnMode="Disabled" />
```

After deploying this change and restarting the application, we can see that FCN monitoring is disabled:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/05/appservice-issue/webapp-fcn-1.png" %}

But that does come with the price. Now we need to restart the application
every time we deploy new version of the application. This is because
FCN is not monitoring changes in the application folder anymore.

Disabling FCN hurts your local development experience as well because
you need to restart the application every time you make changes to the application.
Therefore, you most likely want to enable FCN in your local development setup.

---

Few learnings from these kind of cases:

- Learn to use _Diagnose and solve problems_ feature in the App Service:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/05/appservice-issue/webapp-diagnose.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/05/appservice-issue/webapp-diagnose2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/05/appservice-issue/webapp-diagnose3.png" %}

- Use diagnostic settings to push logs to Log Analytics, so that you can easily query them:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/02/05/appservice-issue/diag.png" %}

Originally I wrote about this topic in my notes:

{% include githubEmbed.html text="JanneMattila/webapp-and-folders/doc/fcn" link="JanneMattila/webapp-and-folders/blob/main/doc/fcn.md" %}

I hope you find this useful!
