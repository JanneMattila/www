---
layout: posts
title:  "Cosmos DB, DNS, Networking -- It's all magic!"
image: /assets/posts/2023-08-14-cosmosdb-and-magic/cosmosdb.png
date: 2023-08-14 17:00:00 +0300
categories: azure
tags: azure cosmosdb dns networking
---
A few years ago, I was in Cloud-Native application development session, and one of the topics was Cosmos DB.
It was a great training session and I learned a lot.

**However**, there was one particular point mentioned in the presentations that caught my attention. 

It went something like this:

> _"When you enable multi-region writes to you Cosmos DB,
> then you application will automatically
> select the closest Cosmos DB region for you.
> Just deploy your application to multiple
> regions and everything is taken care of._
>
> _**You don't need to do or worry about anything!**"_

While the presenter was going through this in the talk, I started
to think that how does that work? 

The presenter did mention that explaining that how it actually works is outside
of his skillset. So, the message for the participants was that **it's magic!**

![Cosmos DB and networking is magic](/assets/posts/common/magic.gif)

_Meme from internet by unknown author_ (and yes I use this a lot at work!)

I _unfortunately_ know, that rarely things are magic and there is always
some simple explanation behind it.

---

Let's try to think about this connectivity _magic_ a bit more. 
How would that _magic_ take care of situation, when you would turn
on and off multi-regions writes for regions closest to your compute?
Would it automatically jump to use that new region when enabled?
Would it switch to use another region when disabled?

I could continue asking these questions, but I think you got the point.

Here is Cosmos DB "Replicate data globally" blade, which you can use
for enabling multi-region writes:

[![Cosmos DB](/assets/posts/2023-08-14-cosmosdb-and-magic/cosmosdb.png)](/assets/posts/2023-08-14-cosmosdb-and-magic/cosmosdb.png)

---

After the training session I ended up writing few notes down to clarify this a bit more.
I'm not going to duplicate my notes here, but **you can read my notes from the original location:**

{% include githubPlayer.html text="JanneMattila/some-questions-and-some-answers" link="JanneMattila/some-questions-and-some-answers/blob/master/q%26a/azure_cosmos_db.md#region-endpoints" %}

Of course, this kind of _magical thing_ is nothing new.
I have always recommended developers to understand how different _Configuration Wizards_ in IDEs work,
just that they don't get surprised later on. It's not one or two
times when developer has been bitten by something that fancy wizard 
in the IDE has generated into their codebase.

---

But if you're still interested in Cosmos DB _magic_, then you'd better try it out yourself!

Create yourself a Cosmos DB account and enable multi-region writes for one additional region.
Then you can use following PowerShell commands to see how it works (using my [JanneMattila/AzureDatacenterIPOrNo](https://github.com/JanneMattila/AzureDatacenterIPOrNo) PowerShell module):

```powershell
Install-Module -Name AzureDatacenterIPOrNo

# This is your Cosmos DB account name
$accountName = "cosmos000000010"
$primaryEndpoint = "$accountName.documents.azure.com"

# This is the another region you enabled for multi-region writes
$anotherRegion = "southeastasia"
$anotherRegionEndpoint = "$accountName-$anotherRegion.documents.azure.com"

$primaryEndpointIP = (Resolve-DnsName $primaryEndpoint).IP4Address
$anotherRegionEndpointIP = (Resolve-DnsName $anotherRegionEndpoint).IP4Address

$accountName

"$primaryEndpoint -> $primaryEndpointIP"
Get-AzureDatacenterIPOrNo -IP $primaryEndpointIP | Format-Table

"$anotherRegionEndpoint -> $anotherRegionEndpointIP"
Get-AzureDatacenterIPOrNo -IP $anotherRegionEndpointIP | Format-Table
```

Here was my output:

```text
cosmos000000010

cosmos000000010.documents.azure.com -> 13.69.66.3

IpRange       Region     Source                      Ip         SystemService
-------       ------     ------                      --         -------------
13.69.66.0/25            ServiceTags_Public_20230807 13.69.66.3 AzureCosmosDB
13.69.66.0/25 westeurope ServiceTags_Public_20230807 13.69.66.3 AzureCosmosDB
13.69.0.0/17  westeurope ServiceTags_Public_20230807 13.69.66.3
13.69.0.0/17             ServiceTags_Public_20230807 13.69.66.3

cosmos000000010-southeastasia.documents.azure.com -> 23.98.107.227

IpRange          Region        Source                      Ip            SystemService
-------          ------        ------                      --            -------------
23.98.107.224/27               ServiceTags_Public_20230807 23.98.107.227 AzureCosmosDB
23.98.107.224/27 southeastasia ServiceTags_Public_20230807 23.98.107.227 AzureCosmosDB
23.98.64.0/18    southeastasia ServiceTags_Public_20230807 23.98.107.227
23.98.64.0/18                  ServiceTags_Public_20230807 23.98.107.227
```

As you can see, there is no magic. It's just DNS and IP addresses.

Hope you find this interesting!
