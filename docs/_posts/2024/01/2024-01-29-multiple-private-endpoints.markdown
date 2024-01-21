---
title: "Resource with multiple Private Endpoints and single Private DNS Zone"
image: /assets/posts/2024/01/29/multiple-private-endpoints/resources.png
date: 2024-01-29 06:00:00 +0300
layout: posts
categories: azure
tags: azure networking
---
Using [Private Endpoints](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview)
is a great way to secure network level access to your Azure resources.
It's well known and commonly used.

But there is one, _luckily rare_, potential issue that you need to be aware of.
Let me walk you through it.

First, let's create a new storage account and enable Private Endpoint for it:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/resources.png" %}

We block public access:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/storage-networking-public.png" %}

We create a private endpoint to specific subnet:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/storage-networking-private.png" %}

Matching A-Record is created to the Private DNS Zone:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/dns.png" %}

After that you have basics in place to enable private access to your storage account.

Depending on your implementation, you might use deployment identity with permissions to
add A-record to the Private DNS Zone
or you might have custom automation built for this purpose ([example](https://github.com/MicrosoftDocs/azure-docs/issues/58044#issuecomment-1824286880))
or you might be using
[Private Link and DNS integration at scale](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/private-link-and-dns-integration-at-scale) approach.
In the last option you're leveraging Azure Policies for preventing users from creating
Private DNS Zones and then enabling automated DNS record creation for Private Endpoints.

Many times, different teams (e.g., app, networking, and DNS teams) might not know all the existing implementations 
and automations, which of course can create overlaps between them and later issues.
It might also be unclear who is responsible for what in this kind of situation.

If you now for _whatever reason_ end up creating **another private endpoint** to the same storage account,
you might get yourself into trouble.
For example: you might be thinking about enabling private access directly from different virtual network
and you might not be thinking DNS as a shared resource.

Let's see what happens if you create another private endpoint to the same storage account:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/new-pe.png" %}

Azure Portal shows this message in the create dialog:
  
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/warning.png" %}

> Existing Private DNS Zones tied to a single service should not be
> associated with two different Private Endpoints as it will not
> be possible to properly resolve two different A-Records that point to the same service.
> However, Private DNS Zones tied to multiple services would not face this resolution constraint.

Above message is there every time when you are creating a private endpoint,
so it can be easily ignored. And unfortunately, it's not very clear either.

If you now look at the storage account networking settings, you'll see that there are two private endpoints:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/two-pes.png" %}

Private DNS zone has only one record:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/dns2.png" %}

In my case IP address of the second private endpoint has overwritten the first one.

**What happens if you now delete one of these private endpoints?**

In my demo I deleted the first private endpoint called `pe1` with the IP of `10.0.0.4`. 
After the delete operation has finished, this is the view in the Private DNS Zone:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/dns3.png" %}

The above happens since both private endpoints are linked to same record in private DNS zone
and the cleanup process does not notice that there is still another private endpoint linked to
the same record.

If this would happen in production environment, you would not be able to resolve the private IP of
your storage account anymore and therefore would not be able to connect to it anymore. 
Maybe needless to say, but this is not a good situation to be in.

There is work ongoing to improve this situation. See details in this GitHub issue:

{% include githubEmbed.html text="azure-docs/issues/58044" link="MicrosoftDocs/azure-docs/issues/58044" %}

Direct link to the [comment](https://github.com/MicrosoftDocs/azure-docs/issues/58044#issuecomment-1828460964)
with the improvement details.
In short: after the improvement, it will delete the record from private DNS zone _only_
when the IP of the A-record matches the IP of the private endpoint that is being deleted.
Read more information from the GitHub issue.

## Summary

The above situation is luckily rare but quite nasty when it occurs.
Mainly because it might take time to understand why your access to the storage account suddenly starts failing.
This can be especially hard, if you don't have access to the Private DNS Zone or some other easy way to troubleshoot
the name resolution in your setup.

And just to clarify: This same issue can happen with any other resource that supports Private Endpoints.
I just used storage account as an example.

I hope you find this useful!
