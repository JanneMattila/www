---
layout: posts
title:  "Example cost calculation for storing archive data in Azure Storage"
image: /assets/posts/2023/12/04/storage-costs/archive-data-retrieval.png
date:   2023-12-04 06:00:00 +0300
categories: azure
tags: azure storage cost
---
I had to estimate the cost of storing archive data in Azure Storage
for one very specific scenario.
First I tried to estimate the cost using the
[Azure Storage pricing](https://azure.microsoft.com/en-us/pricing/details/storage/blobs/)
page, but it was quite hard to estimate the exact cost since 
I was not completely sure about the API call usage in the scenario.

I decided to test the scenario and see how much does it cost.
I used 1000 GiB as a test so that I could then quite accurately estimate the total cost
for hundreds of terabytes.
_Remember_ that the cost is highly dependent on the scenario, so you should
test your own scenario and see how much does it cost.
I documented all the steps in detail,
so you can use that as a reference for your own cost calculation scenarios.

My tests are documented here:
{% include githubEmbed.html text="JanneMattila/azure-storage-demos" link="JanneMattila/azure-storage-demos/tree/main/block-blobs" %}

If I would like to highlight one thing from the tests, it would be that you should
quite carefully plan the size of the archived files and how frequently you
need to fetch them after they have been archived.
That might mean that you package smaller files into larger files so that you
can operate on smaller number of files. You can use as simple as `zip` to package those files.

**Example:** You generate daily _hundreds of thousands of small files_ that you need to archive.
Might make sense to package them to full daily archives before storing them to storage account.
_If_ you need to fetch those to look into specific day, you can then fetch the whole archive in one go.

Here is example cost for `1000 GiB` file rehydration from `Archive` to `Hot` tier by copying it to separate storage container (this is covered in the GitHub in more detail):

{% include imageEmbed.html link="/assets/posts/2023/12/04/storage-costs/archive-data-retrieval.png" %}

That of course impacts your archival strategy, if you need to rehydrate the data frequently
and that suddenly comes your cost factor.

> **As always**, undertand your requirements, data usage patterns, data volumes, and 
> test your scenarios to see how much does it cost.

I hope you find this useful!
