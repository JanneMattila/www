---
layout: posts
title: Network security groups and existing connections
image: /assets/posts/2023/03/18/network-security-groups-and-existing-connections/nsg.png
date: 2024-03-18 06:00:00 +0300
categories: azure
tags: azure networking
---
[Network security groups (NSG)](https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview)
allows you to filter network traffic in your Azure virtual networks.
You can define inbound and outbound security rules based on source and destination, ports, and protocols.

From the above documentation, you can find the following snippets:

> A flow record is created for _existing connections_.
> Communication is **allowed or denied based on the _connection state of the flow record_**.
> The flow record allows a network security group to be **stateful**.

and 

> **If inbound traffic is allowed over a port**,
> it's **not necessary to specify an outbound security rule** to respond to traffic over the port.

Let me try to show these in practice in this post.

Let's start by deploying a virtual network and single virtual machine with public IP assigned to it:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-existing-connections/resources.png" %}

Since there is public IP address attached to the virtual machine,
we can use it to connect to the virtual machine.

We have network security group associated with the subnet that virtual machine resides:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-existing-connections/nsg-subnet.png" %}

Currently, the deployed network security group is _empty_:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-existing-connections/nsg.png" %}

Now, _obviously_, I can't connect to the machine since RDP/SSH traffic is not allowed.

If I now try to connect to the machine:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-existing-connections/vm1.png" %}

It recommends me to add a _just-in-time policy_ to enable that connection but limit the exposure of the machine to the internet:

{% include imageEmbed.html width="50%" height="50%" link="/assets/posts/2024/03/18/network-security-groups-and-existing-connections/vm2.png" %}

I'll enable it and then request _just-in-time_ access from my IP address:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/03/18/network-security-groups-and-existing-connections/vm3.png" %}

It enables _just-in-time_ access:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/03/18/network-security-groups-and-existing-connections/vm4.png" %}

And in the background, it will create a new rule in the network security group.
You can see this change in the _Activity Log_:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-existing-connections/activitylog1.png" %}

And this new rule is automatically **added** to the network security group:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-existing-connections/jit.png" %}

Rule is simple: _Allow RDP (port 3389) from my IP address_.

Now, I can connect to the machine as expected:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-existing-connections/vm6.png" %}

Here's a diagram of the process:

{% include mermaid.html text="
sequenceDiagram
    actor User
    User->>NSG: SSH/RDP
    NSG->>VM: Allow rule
    Note right of NSG: Flow record<br/>created
    VM-->>NSG: 
    NSG-->>User: Allowed<br/>automatically<br/>(since flow record exists)
    Note right of User: SSH/RDP<br/>Connection<br/>established
" %}

I can now work normally using my established RDP/SSH connection.

Let's study a bit more about our _just-in-time_ settings:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-existing-connections/vm8.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-existing-connections/vm9.png" %}

As you can see, the time range was configured to be 3 hours.
I expect the system to automatically remove this rule after it has been expired.

---

After 4 hours, I can see the following entries in the _Activity Log_:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-existing-connections/activitylog2.png" %}

The latest entry indicates that my _just-in-time_ access has been removed.

**However**, my RDP/SSH connection is _not disconnected_, and I can still continue to work normally:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-existing-connections/vm7.png" %}

At first glance this might seem counter-intuitive, so let's check again the
[network security groups](https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview)
documentation to understand this better:

> Existing connections **may not be interrupted when you remove a security rule that allowed the connection**.
> Modifying network security group rules will **only affect new connections**.
> When a new rule is created or an existing rule is updated in a network security group,
> it will **_only apply to new connections_**.
> Existing **connections are not reevaluated with the new rules**.

Above explains the behavior we are seeing in the above demo.

Even if I _don't have a rule to allow RDP/SSH connection_ anymore in the network security group,
I can continue to use that existing RDP/SSH connection that I've established earlier.

At high level, the behavior can be explained with the following diagram:

{% include mermaid.html text="
sequenceDiagram
    actor User
    User->>NSG: SSH/RDP
    NSG->>VM: Allow rule
    Note right of NSG: Flow record<br/>created
    VM-->>NSG: 
    NSG-->>User: Allowed<br/>automatically<br/>(since flow record exists)
    Note right of User: SSH/RDP<br/>Connection<br/>established
    Note left of NSG: Update NSG
    Note right of NSG: Flow record<br/>exist
    User->>VM: SSH/RDP continues to work
" %}

Above just demonstrated the _stateful_ behavior of the network security groups.
I used RDP/SSH connection as an example, but the same behavior applies to other
_established connections_ as well.

---

**Bonus**: Let's deny the internet access completely from our virtual machine with this rule:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/18/network-security-groups-and-existing-connections/deny-internet.png" %}

Now our virtual machine is unable to connect to internet but RDP/SSH connection still continues to work:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/03/18/network-security-groups-and-existing-connections/bing.png" %}

And if I remove the above rule, internet connectivity is restored:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/03/18/network-security-groups-and-existing-connections/bing2.png" %}

This just confirms this statement from the above:

> **If inbound traffic is allowed over a port**,
> it's **not necessary to specify an outbound security rule** to respond to traffic over the port.

---

I hope you find this useful!
