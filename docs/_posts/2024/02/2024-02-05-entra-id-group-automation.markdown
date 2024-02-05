---
title: Entra ID Group automation with PowerShell
image: /assets/posts/2024/02/05/entra-id-group-automation/groups.png
date: 2024-02-05 06:00:00 +0300
layout: posts
categories: azure
tags: azure entra security
---
Quite a common requirement from customers
is to do some kind of automation of Entra ID groups.
They are, after all, the key cornerstone of the access control to many systems.

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/05/entra-id-group-automation/groups.png" %}

Of course, my go-to solution is to use PowerShell for these kinds of tasks.
PowerShell is so powerful and it's super-fast to create these automation scripts with it.

PowerShell does have a lot of modules and other assets available in [PowerShell Gallery](https://www.powershellgallery.com/).
Many times, you can find ready-made modules that ease your work.

To automate Entra ID tasks, you can use [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/use-the-api).
It has good [Microsoft Graph REST API endpoint reference](https://learn.microsoft.com/en-us/graph/api/overview)
documentation.

And of course, there is a [PowerShell module for Microsoft Graph](https://www.powershellgallery.com/packages/Microsoft.Graph) available. You can find it from [GitHub](https://github.com/microsoftgraph/msgraph-sdk-powershell) as well.

> **_However_**, I've found myself avoiding too many dependencies in my
> automation scripts _unless_ they are absolutely necessary.

I think it's a good idea to avoid taking dependencies _if_ you have enough easy API you
can use directly. It's much easier to maintain and to understand.
And I'm pretty sure that PowerShell cmdlets like 
[Invoke-RestMethod](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/invoke-restmethod)
and 
[Invoke-WebRequest](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/invoke-webrequest) 
won't be going out of fashion any time soon.

Sometimes modules encapsulate the functionality so well that you don't really understand
what's happening under the hood anymore. And as you might know, I hate [magic]({% post_url 2023/08/2023-08-14-cosmosdb-and-magic %}).

Therefore, I tend to use Microsoft Graph API directly in my scripts.
Since many times this is heavily related to Azure automations, I much
more likely take dependency to [Azure PowerShell](https://learn.microsoft.com/en-us/powershell/azure) 
module and use that to handle things like authentication.

If you're starting your script development, I recommend you to read my post
[VS Code and faster script development]({% post_url 2023/08/2023-08-28-vs-code-and-faster-script-development %}). It contains some good tips on how to develop PowerShell scripts faster.

I work with developers quite often and I've noticed many of them don't
optimize their development workflow when arrays are involved. They much rather
execute entire script and then wait for the results to come and troubleshoot
any potential issues.

I've said many times that if you follow my tips in the above-mentioned post, 
you can develop your entire script without taking your hands off the keyboard.
You can call it REPL (Read-Eval-Print Loop) style development if you want.

To give you a quick example, here's a simple way to use arrays in
your script development so that you can continue to run
line by line without taking your hands off the keyboard:

```powershell
$manyItems = Get-SomethingThatReturnsManyItems

# Helper variable to get first element (you can remove this later)
$item = $manyItems[0]

# Loop through the items
foreach ($item in $manyItems) {
    # Do something with $item
}
```

So after you have called `Get-SomethingThatReturnsManyItems` and assigned the result to `$manyItems`, 
you can then use use `$manyItems[0]` to get the first element
to the same named variable as you use in the loop.
This way you can continue to run your script line by line inside the loop.
Now you can see if all your properties are correctly set and so on.

---

Here's a simple example of how to synchronize two groups using Microsoft Graph API:

{% include githubEmbed.html text="aad-sync-groups.ps1" link="JanneMattila/some-questions-and-some-answers/blob/master/q%26a/aad-sync-groups.ps1" %}

At high level it does following:

- Get all members from source group (including nested group members)
- Get all members from target group
- Compare the members
  - Add missing members to target group as direct members
  - Remove extra members from target group

---

Related to this topic, you might be interested in learning more about
[Govern on-premises Active Directory based apps (Kerberos) using Microsoft Entra ID Governance (Preview)](https://learn.microsoft.com/en-us/entra/identity/hybrid/cloud-sync/govern-on-premises-groups).

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/05/entra-id-group-automation/cloudsync.png" %}

This enables you to synchronize your Entra ID groups with on-premises Active Directory groups.
You can now manage and automate group management directly from the cloud.
So, your Microsoft Graph API skills just got even more important!

I hope you find this useful!
