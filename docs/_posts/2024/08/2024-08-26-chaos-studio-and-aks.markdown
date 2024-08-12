---
title: Testing your AKS resiliency with Chaos Studio
image: /assets/posts/2024/08/26/chaos-studio-and-aks/chaos-studio.png
date: 2024-08-26 06:00:00 +0300
layout: posts
categories: azure
tags: azure chaos-studio chaos-engineering chaos-mesh kubernetes aks
---

[Azure Chaos Studio](https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-overview)
is fairly new service that allows you to run chaos experiments on your Azure resources:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/overview.png" %}

To get good understanding more about chaos engineering and Chaos Studio,
please check out excellent presentation from Build 2024: 

[Improve Application Resilience using Azure Chaos Studio](https://build.microsoft.com/en-US/sessions/5723eeff-0b6b-4dee-b35b-dd8f3f40c5b2)

<!-- 
[text](https://en.wikipedia.org/wiki/Chaos_engineering)
[text](https://principlesofchaos.org/)
-->

The above presentation explains how you should approach chaos engineering implementation:

> Formulate **hypotheses** around resiliency scenarios, 
> craft and execute a fault injection **experiment** in a 
> safe environment, monitor the impact, **analyze**
> results and **make improvements**.

---

In this post, I will show you how to use Chaos Studio to test the resiliency of your AKS cluster.

Here is the architecture of the setup:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/chaos-studio.png" %}

In the diagram, we have 4 different apps: `app1`, `app2`, `app3`, and `app4` (only numbers are shown in the diagram).

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/targets.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/experiments.png" %}

## Experiment 1: Simulate DNS failures

{% include videoEmbed.html width="100%" height="100%" tags="autoplay muted controls loop" link="/assets/posts/2024/08/26/chaos-studio-and-aks/dns-experiment.mp4" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/experiment1-start.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/experiment1-end.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/experiment1.png" %}

```json
{
  "action": "error",
  "mode": "all",
  "patterns": [
    "bing.com",
    "github.?om",
    "login.microsoftonline.com",
    "network-app-internal-svc.*"
  ],
  "selector": {
    "namespaces": [
      "network-app",
      "network-app2",
      "update-app"
    ]
  }
}
```

## Experiment 2: Simulate POD failure

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/experiment2-start.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/experiment2-end.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/experiment2.png" %}

```json
{
  "action": "pod-failure",
  "mode": "fixed",
  "value": "2",
  "duration": "300s",
  "selector": {
    "namespaces": [
      "network-app"
    ]
  }
}
```

```json
{
  "action": "pod-failure",
  "mode": "fixed-percent",
  "value": "66",
  "duration": "300s",
  "selector": {
    "namespaces": [
      "update-app"
    ]
  }
}
```

## Experiment 3: Simulate availability zone failure

Bash function `list_pods`:

```bash
function list_pods()
{
  declare -A node_map
  while read node zone; do
    node_map["$node"]="$zone"
  done <<< $(kubectl get nodes --no-headers -o custom-columns=NAME:'{.metadata.name}',ZONE:'{metadata.labels.topology\.kubernetes\.io/zone}')

  while read pod node; do
      echo "Pod: $pod, Node: $node, Zone: ${node_map[$node]}"
  done <<< $(kubectl get pod -n "$1" --no-headers -o custom-columns=NAME:'{.metadata.name}',NODE:'{.spec.nodeName}')
}
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/experiment3-start.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/experiment3-end.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/experiment3.png" %}


## Cost

[Azure Chaos Studio pricing](https://azure.microsoft.com/en-us/pricing/details/chaos-studio/)

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/costs.png" %}

## What's next?

As you might have noticed, in the architecture diagram above, we have also two other applications `app3` and `app4`.
We didn't yet 

Cluster 1.28 and below does not have storage classes with ZRS support. You have to create storage class for them yourself.
From [Release 2024-04-28](https://github.com/Azure/AKS/releases/tag/2024-04-28):

> Effective **starting with Kubernetes version 1.29**,
> when you deploy Azure Kubernetes Service (AKS) clusters across **multiple availability zones**,
> AKS now utilizes **zone-redundant storage (ZRS) to create managed disks within built-in storage classes**. 
