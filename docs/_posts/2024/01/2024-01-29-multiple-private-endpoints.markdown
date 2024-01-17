---
title: Multiple Private Endpoints issue
image: /assets/posts/2024/01/29/multiple-private-endpoints/resources.png
date: 2024-01-29 06:00:00 +0300
layout: posts
categories: azure
tags: azure networking
---

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/resources.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/storage-networking-public.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/storage-networking-private.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/29/multiple-private-endpoints/dns.png" %}

<!--
Background:

Why Private Endpoints?

- https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview

- Private endpoint DNS records x 2 -> delete causes problems!
  - "Be careful when deleting private endpoints"
  - Resources: Storage, Key vault
  - https://github.com/MicrosoftDocs/azure-docs/issues/58044
-->