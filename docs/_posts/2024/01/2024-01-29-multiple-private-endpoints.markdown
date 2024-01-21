---
title: Multiple Private Endpoints issue
image: /assets/posts/2024/01/29/multiple-private-endpoints/resources.png
date: 2024-01-29 06:00:00 +0300
layout: posts
categories: azure
tags: azure networking
---
Using [Private Endpoints](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview)
is a great way to secure network level access to your Azure resources.
It's well-known and commonly used.

But there is one issue that you need to be aware of.
Let me walk you through it.

First, let's create a new storage account and enable Private Endpoint for it:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/resources.png" %}

We block the public access:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/storage-networking-public.png" %}

We create a private endpoint to specific subnet:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/storage-networking-private.png" %}

Matching DNS record is created to the Private DNS Zone:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/dns.png" %}

After that you have basics in place to enable private access to your storage account.

Depending on the implementation, you might use deployment identity with permissions to
add DNS record to the Private DNS Zone
or you might have custom automation built for this purpose ([example](https://github.com/MicrosoftDocs/azure-docs/issues/58044#issuecomment-1824286880))
or you might be using
[Private Link and DNS integration at scale](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/private-link-and-dns-integration-at-scale) approach.
In the last option you're leveraging Azure Policies for preventing users from creating
Private DNS Zones and then enabling automated DNS record creation for Private Endpoints.

Many times different teams might not know exactly all the existing implementations 
and automations which of course can create overlap and then later on issues.
It might be also unclear who is responsible for what in this kind of situation.

If you now for whatever reason end up creating another private endpoint,
you might get yourself into trouble.
For example: you might be thinking to enable access from different subnet.
Let me show how.

Let's create a new private endpoint to the same storage account:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/new-pe.png" %}

Azure Portal shows this message in the create dialog:
  
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/warning.png" %}

> Existing Private DNS Zones tied to a single service should not be
> associated with two different Private Endpoints as it will not
> be possible to properly resolve two different A-Records that point to the same service.
> However, Private DNS Zones tied to multiple services would not face this resolution constraint.

Above message is there everytime when you are creating a private endpoint,
so it will be easily ignored. And unfortunately it's not very clear either.

If you now look the storage account networking settings, you'll see that there are two private endpoints:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/two-pes.png" %}

If you now look the private DNS zone, you'll see that there is still only one record:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/dns2.png" %}

In my case IP address of the second private endpoint has overwritten the first one.

Okay what happens if you now delete one of these private endpoints?

In my demo I deleted the first one `pe1`. After that this is the view in the Private DNS Zone:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/dns3.png" %}

Above happens since both private endpoints are linked to same record in private DNS zone
and the clean up process does not notice that there is still another private endpoint linked to
the same record.

If this would happen in production environment, you would not be able to resolve the private IP of
your storage account and would not be able to connect to it. 

There is work ongoing to improve this situation. See details in this GitHub issue:

{% include githubEmbed.html text="azure-docs/issues/58044" link="MicrosoftDocs/azure-docs/issues/58044" %}

Direct link to the [comment](https://github.com/MicrosoftDocs/azure-docs/issues/58044#issuecomment-1828460964).

After the improvement, it will delete the record from private DNS zone only when the IP matches
the IP of the private endpoint that is being deleted. Read more information from the GitHub issue.

## Summary

Above situtation is rare but when it occurs, it can be very hard to troubleshoot especially
when you don't necessary have access to the private DNS zone or any of the networking settings.

I hope you find this useful!
