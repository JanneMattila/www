---
layout: posts
title:  "Testing your network configurations with 'webapp-network-tester' tool"
image: /assets/posts/2023/08/22/testing-your-network-configuration/share.png
date:   2023-08-22 06:00:00 +0300
categories: networking
tags: azure networking dns private-endpoints
---
Azure started introducing private endpoints a couple of years ago.
E.g., [Private Endpoints for Azure Storage](https://azure.microsoft.com/en-us/updates/private-endpoints-for-azure-storage/)
was published on March 13, 2020.

As always, when these kinds of new features come up, customers start to ask questions about them. 
They want to understand how these features work, so that they can start to take them into use
in their environments:

> _"Could you help us to understand how private endpoints work?"_

Of course, answering these questions easily becomes your full-time job.
Unfortunately, documentation doesn't always contain all the answers to these questions
and explanations that customers are looking for. 
This is especially true when new capabilities are introduced.

We noticed a couple of things soon after these discussions started happening:

- These questions had become _too_ frequent for us (I realized this when week was still young, and I had already talked to 3 different customers about this exact same topic)
- After implementing the infrastructure, many developers struggled to understand if the setup was correctly set or not 
  - In many companies' dev and ops are still separate teams and they don't necessarily have the same level of understanding of the infrastructure, just to add a bit more friction to the process

> _"How can I test if it's correctly communicating with database using private endpoint?"_

> _"My application doesn't work. Why? It should have access to the database, but I don't know why it's not working correctly."_

We started to think if there would be easier and faster ways to explain this to customers.
It would be best of course if they try this on their own and learn while doing so.

---

Therefore, I ended up building *webapp-network-tester* tool:

{% include githubEmbed.html text="JanneMattila/webapp-network-tester" link="JanneMattila/webapp-network-tester" %}

The idea is quite simple: It's just a web application with REST API which 
you can use to test your network configuration. You can pass the payload
to the tool, and it will execute those commands and return results back to you.
It supports many typical network operations like `HTTP GET`, `TCP`, `IPLOOKUP`, `NSLOOKUP`, etc.
You can use them to test connectivity to your resources like storage accounts, databases, etc.

I recorded quick screencast video without audio to show how it works:

{% include youtubeEmbed.html id="jWbj7LMQv-g" %}

The above recording just showed the basic functionality. Read more about the [supported operations from GitHub](https://github.com/JanneMattila/webapp-network-tester#supported-operations).

---

There is also a ready-made image available in Docker Hub which you can use to deploy this tool to your environment:

{% include dockerEmbed.html text="JanneMattila/webapp-network-tester" link="r/jannemattila/webapp-network-tester" %}

_NOTE: That image also contains other useful tools but that's worth another blog post._

---

You can try these yourself by running the following commands:

```powershell
git clone https://github.com/JanneMattila/webapp-network-tester
cd webapp-network-tester/
echo "blob_connectionstring=" > .env # add placeholder for example connection string
code "./Webapp network tester.code-workspace"
cd src/WebApp
dotnet run
```

From your opened VS Code, open up `api.http` file. It has example HTTP
requests which you can send to the tool. It uses excellent [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension for that.

---

Of course, those simple test commands can be used by command-line tools:

Bash:

```bash
curl \
  --request POST \
  --url http://localhost:5000/api/commands \
  --data 'TCP jannemattila.com 80' 
```

PowerShell:

```powershell
Invoke-RestMethod `
  -Method POST `
  -Uri "http://localhost:5000/api/commands" `
  -Body 'NSLOOKUP account.privatelink.redis.cache.windows.net 8.8.8.8'
```

---

> **Important:**
>
> **You can pass these commands forward from one instance to another
> using _HTTP POST_ command.**

Just make sure that each of the commands are on their own lines. Here's an example:

```bash
# Create file with multiple lines
echo "HTTP POST http://SERVER2/api/commands" > payload.txt
echo "IPLOOKUP SERVER3" >> payload.txt

cat payload.txt # Note that there are two lines

# Use curl to send payload.txt as binary data
curl -X POST --url http://SERVER1/api/commands --data-binary "@payload.txt"
```

Alternatively, you can use something like this:

```bash
curl -X POST --url http://SERVER1/api/commands -d "HTTP POST http://SERVER2/api/commands%0AIPLOOKUP SERVER3"
```

Above examples send command to `SERVER1` which then sends command to `SERVER2` and it then executes `IPLOOKUP` command.
Here is an image to illustrate this:

{% include mermaid.html text="
sequenceDiagram
    actor User
    participant SERVER1
    participant SERVER2
    User->>SERVER1: Invoke curl
    SERVER1->>SERVER2: Pass command along
    Note right of SERVER2: Run IPLOOKUP SERVER3
    SERVER2-->>SERVER1: Return result
    SERVER1-->>User: Return result
" %}

Example output from above command:

```text
-> Start: HTTP POST http://SERVER2/api/commands
-> Start: IPLOOKUP SERVER3
IP: 10.0.0.150
<- End: IPLOOKUP SERVER3 4,23ms
<- End: HTTP POST http://SERVER2/api/commands 114,35ms
```

These various test operations enable you to test your network configuration in many ways:

- Is you DNS setup working correctly?
  - What IP address is returned for your target resource? Public or Private?
- Is there a network path to the target resource?
  - If I invoke `service a` to call `service b`, is there network path between them?
  - Is `service a` access to target storage account blocked?
  - Can `service b` still access target storage account?
etc.

Most importantly:

> These test operations _enable you to test your network configuration_
> **without deploying your real application** into that infrastructure.

You can deploy this tool e.g., AKS and test access to blob storage. 
Or you can test your App Service and its connectivity to your backend databases
or to the on-premises rest APIs. Testing options are endless.

You can basically deploy this tool to any containerized environment or virtual machine
and test your network configuration from those compute resources.

**If network setup works correctly for test workloads, it will work for your real workload as well.**
You don't waste time deploying your real application and then debugging why it doesn't work.
It might take a lot of time to get DNS, routing, firewall rules, etc. correctly configured
and unfortunately, it's not always in your hands to fix those issues.
If you can test all these things early in your project, 
then the likelihood of getting surprises later is lower.

---

I will use this tool in many future blog posts as well because it has been so useful for me.
It accidentally became one of my most valuable tools when working with Azure infrastructure
related topics.

I hope you find this useful!
