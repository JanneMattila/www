---
layout: posts
title: Network security groups (NSG) and ongoing connections behavior
image: /assets/posts/2023/03/18/network-security-groups-and-ongoing-connections/nsg.png
date: 2024-03-18 06:00:00 +0300
categories: azure
tags: azure networking
---

Network security groups (NSG) are Azure resources that allow you to filter network traffic. 
You can use NSGs to define inbound and outbound security rules based on source and destination IP addresses, ports, and protocols. NSGs are stateful, meaning that they keep track of the connections that they allow or deny. This means that if an NSG allows an inbound connection from a source to a destination, it will also allow the corresponding outbound connection from the destination to the source, even if there is no explicit outbound rule for it. This behavior ensures that ongoing connections are not interrupted by NSG rules.

<!--
- NSG and ongoing connections behavior
  - https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview
  - https://learn.microsoft.com/en-us/azure/firewall/long-running-sessions
-->

> A flow record is created for existing connections.
> Communication is allowed or denied based on the connection state of the flow record.
> The flow record allows a network security group to be **stateful**.

and 

> **If inbound traffic is allowed over a port**,
> it's **not necessary to specify an outbound security rule** to respond to traffic over the port.

Let's test this in practice. Here's simple virtual network deployment:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/resources.png" %}

As you can see, the virtual machine has a public IP address which we can use to connect to it.

Currently, the deployed network security group is _empty_:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/nsg.png" %}

_Obviously_, I can't connect to the machine at the moment.
If I now try to connect to the machine:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/vm1.png" %}

It recommends me to add a _just-in-time policy_ to allow that connection and limit
the exposure of the machine to the internet:

{% include imageEmbed.html width="50%" height="50%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/vm2.png" %}

I'll enable it and then I can request _just-in-time_ access:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/vm3.png" %}

It starts to enabled it:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/vm4.png" %}

And in the background, it will create a new rule in the network security group.
You can see this change in the _Activity Log_:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/activitylog1.png" %}

And this new rule is created to the Network Security Group:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/jit.png" %}

Now, I can connect to the machine:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/vm6.png" %}

Here's a diagram of the process:

{% include mermaid.html text="
sequenceDiagram
    actor User
    User->>NSG: SSH/RDP
    NSG->>VM: Allow rule
    VM-->>NSG: 
    NSG-->>User: Allowed<br/>automatically
    Note left of User: SSH/RDP<br/>Connection<br/>established
    Note left of NSG: Update NSG:<br/>Block SSH/RDP
    User->>VM: SSH/RDP Connection working
" %}


{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/vm7.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/vm8.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/vm9.png" %}

> Existing connections **may not be interrupted when you remove a security rule that allowed the connection**.
> Modifying network security group rules will **only affect new connections**.
> When a new rule is created or an existing rule is updated in a network security group,
> it will **only apply to new connections**.
> Existing **connections are not reevaluated with the new rules**.
