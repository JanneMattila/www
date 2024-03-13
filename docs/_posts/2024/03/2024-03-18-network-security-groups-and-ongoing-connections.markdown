---
layout: posts
title: Network security groups (NSG) and ongoing connections behavior
image: /assets/posts/2023/03/18/network-security-groups-and-ongoing-connections/nsg.png
date: 2024-03-18 06:00:00 +0300
categories: azure
tags: azure networking
---
[Network security groups (NSG)](https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview)
enable you to filter network traffic between Azure resources in an Azure virtual network.
You can use network security groups to define inbound and outbound security rules based on source and destination, ports, and protocols.

From the above documentation, we can find following snippets:

> A flow record is created for existing connections.
> Communication is **allowed or denied based on the connection state of the flow record**.
> The flow record allows a network security group to be **stateful**.

and 

> **If inbound traffic is allowed over a port**,
> it's **not necessary to specify an outbound security rule** to respond to traffic over the port.

In this post, I'll show a quick demo which hopefully explains
how network security groups behave with ongoing connections.

Here's simple virtual network deployment for our demo:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/resources.png" %}

As you can see, there is virtual machine deployed and
it has a public IP address attached to it.
Therefore, we can use it to connect to the virtual machine.

Currently, the deployed network security group is _empty_:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/nsg.png" %}

_Obviously_, I can't connect to the machine at the moment.
If I now try to connect to the machine:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/vm1.png" %}

It recommends me to add a _just-in-time policy_ to allow that connection and limit
the exposure of the machine to the internet:

{% include imageEmbed.html width="50%" height="50%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/vm2.png" %}

I'll enable it and then I can request _just-in-time_ access just from my IP address:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/vm3.png" %}

It starts to enabled it:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/vm4.png" %}

And in the background, it will create a new rule in the network security group.
You can see this change in the _Activity Log_:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/activitylog1.png" %}

And this new rule is automatically **added** to the network security group:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/jit.png" %}

Now, I can connect to the machine:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/vm6.png" %}

Here's a diagram of the process:

{% include mermaid.html text="
sequenceDiagram
    actor User
    User->>NSG: SSH/RDP
    NSG->>VM: Allow rule
    Note right of NSG: Flow record<br/>created
    VM-->>NSG: 
    NSG-->>User: Allowed<br/>automatically<br/>(since flow record exists)
    Note left of User: SSH/RDP<br/>Connection<br/>established
" %}

I can continue to work in the machine using RDP/SSH connection.

I can study a bit more about the _Just-in-time_ settings:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/vm8.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/vm9.png" %}

In my case, I can see time range configured to be 3 hours.

---

After 4 hours, I can see following entries in the _Activity Log_:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/activitylog2.png" %}

Latest entry indicates that my _just-in-time_ access has been removed.

**However**, I can still continue to work in the machine using RDP/SSH connection.
My existing connection is not interrupted:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-ongoing-connections/vm7.png" %}

Let's again look at the
[network security groups](https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview)
documentation to understand this behavior:

> Existing connections **may not be interrupted when you remove a security rule that allowed the connection**.
> Modifying network security group rules will **only affect new connections**.
> When a new rule is created or an existing rule is updated in a network security group,
> it will **only apply to new connections**.
> Existing **connections are not reevaluated with the new rules**.

Above explains the behavior we've seen in the demo.
Even if I _don't have a rule to allow RDP/SSH connection_ in the network security group,
I can still continue to work in the machine using RDP/SSH connection.

At high level, the behavior can be explained with following diagram:

{% include mermaid.html text="
sequenceDiagram
    actor User
    User->>NSG: SSH/RDP
    NSG->>VM: Allow rule
    Note right of NSG: Flow record<br/>created
    VM-->>NSG: 
    NSG-->>User: Allowed<br/>automatically<br/>(since flow record exists)
    Note left of User: SSH/RDP<br/>Connection<br/>established
    Note left of NSG: Update NSG:<br/>Block SSH/RDP
    Note right of NSG: Flow record<br/>exist
    User->>VM: SSH/RDP continues to work
" %}

Above just demonstrate the _stateful_ behavior of the network security groups.
I used RDP/SSH connection as an example, but the same behavior applies to other
_ongoing connections_ as well.

I hope you find this useful!
