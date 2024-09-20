---
title: AKS and Availability Zones with Locally Redundant Storage Disks
image: /assets/posts/2024/10/07/aks-azs-and-lrs-disks/architecture1.png
date: 2024-10-07 06:00:00 +0300
layout: posts
categories: azure
tags: azure chaos-studio chaos-engineering chaos-mesh kubernetes aks
---

I blogged previously about
[Testing your AKS resiliency with Chaos Studio]({% post_url 2024/08/2024-08-26-chaos-studio-and-aks %})
and this is a follow-up post on that topic.
**Please read the previous post to understand the context**.

---

This time I have AKS deployed across two availability zones (AZs)
and I need  persistent storage for one of my apps:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/07/aks-azs-and-lrs-disks/architecture1.png" %}

In Kubernetes, you can deploy persistent volumes either dynamically or statically.

[Create and use a volume with Azure Disks in Azure Kubernetes Service (AKS)](https://learn.microsoft.com/en-us/azure/aks/azure-csi-disk-storage-provision)

Statically created volumes are pre-created by the cluster administrator and are available for consumption by the workloads in the cluster after they are created.

Dynamic volumes are created by the Kubernetes control plane when a workload requests a volume that does not exist. These will be created on-demand and stored in the managed resource group ("MC_*").
Kubernetes uses 
[storage classes](https://learn.microsoft.com/en-us/azure/aks/azure-disk-csi#dynamically-create-azure-disks-pvs-by-using-the-built-in-storage-classes)
when creating dynamic volumes.

you might run into interesting issues. Especially, if you have deployed
[Locally redundant storage (LRS)](https://learn.microsoft.com/en-us/azure/virtual-machines/disks-redundancy#locally-redundant-storage-for-managed-disks)
disks into your cluster.
Unfortunately, clusters with 1.28 and below don't have
[storage classes](https://learn.microsoft.com/en-us/azure/aks/concepts-storage#storage-classes)
with
[Zone-redundant storage (ZRS)](https://learn.microsoft.com/en-us/azure/virtual-machines/disks-redundancy#zone-redundant-storage-for-managed-disks)
support built-in. You have to create a storage class for that yourself.
From [Release 2024-04-28](https://github.com/Azure/AKS/releases/tag/2024-04-28):

> Effective **starting with Kubernetes version 1.29**,
> when you deploy Azure Kubernetes Service (AKS) clusters across **multiple availability zones**,
> AKS now utilizes **zone-redundant storage (ZRS) to create managed disks within built-in storage classes**.

```console
$ kubectl get storageclasses
```

```yaml
tba
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/07/aks-azs-and-lrs-disks/architecture2.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/07/aks-azs-and-lrs-disks/architecture3.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/07/aks-azs-and-lrs-disks/architecture4.png" %}

## Upgrade cluster and storage class

What if you have older clusters and you want to upgrade them to e.g., 1.30?

```console
$ kubectl get storageclasses
```
