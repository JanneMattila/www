---
title: Testing your AKS resiliency with Chaos Studio
image: /assets/posts/2024/08/26/chaos-studio-and-aks/aks-az-failure2.png
date: 2024-08-26 06:00:00 +0300
layout: posts
categories: azure
tags: azure chaos-studio chaos-engineering chaos-mesh kubernetes aks
---

[Azure Chaos Studio](https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-overview)
allows you to run chaos experiments on your Azure resources:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/overview.png" %}

To get good understanding about chaos engineering and Chaos Studio,
please check out this excellent presentation from Build 2024: 

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

To get started, there are many safety mechanisms in-place for preventing _accidental_ chaos experiments for your resources:

First, you need to enable Azure resources to be used with Chaos Studio:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/targets.png" %}

<!-- Here is the architecture of the setup:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/chaos-studio.png" %}

In the diagram, we have 4 different apps: `app1`, `app2`, `app3`, and `app4` (only numbers are shown in the diagram). -->

Then you can start creating experiments and connect them to these resources:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/experiments.png" %}

Next you need to enable the identity of the experiment to have required permissions to perform the configured tasks (e.g., shutdown VM, update NSG, etc.).

Otherwise you will get an error like this:
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/aks-access-denied.png" %}

Additionally, when experimenting with AKS, you need to make sure that:
 - Local accounts are not disabled in the cluster
 - API server is accessible by the experiments
 - You need to [Set up Chaos Mesh on your AKS cluster](https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-tutorial-aks-portal#set-up-chaos-mesh-on-your-aks-cluster)

If you have local accounts disabled in your cluster, you'll get the following error message
when trying to run faults on the cluster:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/aks-disabled-local-accounts.png" %}

This is the error message if API server is not accessible by the experiments:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/aks-api-server-access.png" %}

Okay, let's start with some experiments!

## Experiment 1: Simulate DNS failures

Let's start with a simple, _yet very effective_ experiment: simulate DNS failures.
Here is our test application and it's dependencies:

<!-- {% include videoEmbed.html width="100%" height="100%" tags="autoplay muted controls loop" link="/assets/posts/2024/08/26/chaos-studio-and-aks/dns-experiment.mp4" %} -->

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/experiment1-start.png" %}

Our hypotheses is that our application continues to run, even if DNS is failing for some of the services.

We want to simulate following failure scenario with our app next:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/experiment1-end.png" %}

Here is the experiment configuration:

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

The above configuration is quite easy to understand. We are simulating DNS failures for the following domains:
 - `bing.com`
 - `github.com` (or more specifically `github.?om` with `?` as any character)
 - `login.microsoftonline.com`
 - `network-app-internal-svc`

 And we are targeting the following namespaces (other namespaces are not affected):
  - `network-app`
  - `network-app2`
  - `update-app`

I'm _again_ using my [webapp-network-tester](https://github.com/JanneMattila/webapp-network-tester)
for demonstrating purposes. Read more about it
[here]({% post_url 2023/08/2023-08-22-testing-your-network-configuration %}). 

_Webapp-network-tester_ workload is deployed to `network-app` namespace.
`network-app-internal-svc` is a service which is accessible within the cluster and
`network-app-external-svc` accessible from outside the cluster.

Now, we're ready to show how the application works under the normal circumstances.
If I send a payload `IPLOOKUP bing.com` to the application via Rest API, it should return the IP addresses of the domain `bing.com`:

```console
$ curl -X POST --data "IPLOOKUP bing.com" "$network_app_external_svc_ip/api/commands"
-> Start: IPLOOKUP bing.com
IP: 13.107.21.200
IP: 204.79.197.200
IP: 2620:1ec:c11::200
<- End: IPLOOKUP bing.com 10.53ms
```

Similarly, it will reply with the list of IPs of those other domains as well.

Now, let's start our experiment and see how the application behaves:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/aks-experiment1-start.png" %}

After the experiment has started, we can see that configured DNS failures are happening:

```console
$ curl -X POST --data "IPLOOKUP github.com" "$network_app_external_svc_ip/api/commands"
-> Start: IPLOOKUP github.com
System.Net.Sockets.SocketException (00000001, 11): Resource temporarily unavailable
   at System.Net.Dns.GetHostEntryOrAddressesCore(String hostName, Boolean justAddresses, AddressFamily addressFamily, Nullable`1 startingTimestamp)
   at System.Net.Dns.<>c.<GetHostEntryOrAddressesCoreAsync>b__33_0(Object s, Int64 startingTimestamp)
   at System.Net.Dns.<>c__DisplayClass39_0`1.<RunAsync>b__0(Task <p0>, Object <p1>)
   at System.Threading.Tasks.ContinuationResultTaskFromTask`1.InnerInvoke()
   at System.Threading.ExecutionContext.RunFromThreadPoolDispatchLoop(Thread threadPoolThread, ExecutionContext executionContext, ContextCallback callback, Object state)
--- End of stack trace from previous location ---
   at System.Threading.ExecutionContext.RunFromThreadPoolDispatchLoop(Thread threadPoolThread, ExecutionContext executionContext, ContextCallback callback, Object state)
   at System.Threading.Tasks.Task.ExecuteWithThreadLocal(Task& currentTaskSlot, Thread threadPoolThread)
--- End of stack trace from previous location ---
   at WebApp.Controllers.CommandsController.ExecuteIpLookUpAsync(String[] parameters) in /src/src/WebApp/Controllers/CommandsController.cs:line 387
   at WebApp.Controllers.CommandsController.Post(String body) in /src/src/WebApp/Controllers/CommandsController.cs:line 120
<- End: IPLOOKUP github.com 417.04ms
```

Failure is also happening for the internal service DNS lookup:

```console
$ curl -X POST --data "IPLOOKUP network-app-internal-svc" "$network_app_external_svc_ip/api/commands"
-> Start: IPLOOKUP network-app-internal-svc
System.Net.Sockets.SocketException (00000001, 11): Resource temporarily unavailable
   at System.Net.Dns.GetHostEntryOrAddressesCore(String hostName, Boolean justAddresses, AddressFamily addressFamily, Nullable`1 startingTimestamp)
   at System.Net.Dns.<>c.<GetHostEntryOrAddressesCoreAsync>b__33_0(Object s, Int64 startingTimestamp)
   at System.Net.Dns.<>c__DisplayClass39_0`1.<RunAsync>b__0(Task <p0>, Object <p1>)
   at System.Threading.Tasks.ContinuationResultTaskFromTask`1.InnerInvoke()
   at System.Threading.ExecutionContext.RunFromThreadPoolDispatchLoop(Thread threadPoolThread, ExecutionContext executionContext, ContextCallback callback, Object state)
--- End of stack trace from previous location ---
   at System.Threading.ExecutionContext.RunFromThreadPoolDispatchLoop(Thread threadPoolThread, ExecutionContext executionContext, ContextCallback callback, Object state)
   at System.Threading.Tasks.Task.ExecuteWithThreadLocal(Task& currentTaskSlot, Thread threadPoolThread)
--- End of stack trace from previous location ---
   at WebApp.Controllers.CommandsController.ExecuteIpLookUpAsync(String[] parameters) in /src/src/WebApp/Controllers/CommandsController.cs:line 387
   at WebApp.Controllers.CommandsController.Post(String body) in /src/src/WebApp/Controllers/CommandsController.cs:line 120
<- End: IPLOOKUP network-app-internal-svc 2006.08ms
```

`microsoft.com` DNS lookup is still working fine during our experiment:

```console
$ curl -X POST --data "IPLOOKUP microsoft.com" "$network_app_external_svc_ip/api/commands"
-> Start: IPLOOKUP microsoft.com
IP: 20.112.250.133
IP: 20.70.246.20
IP: 20.231.239.246
IP: 20.76.201.171
IP: 2603:1030:20e:3::23c
IP: 2603:1020:201:10::10f
IP: 2603:1030:c02:8::14
IP: 2603:1010:3:3::5b
IP: 2603:1030:b:3::152
<- End: IPLOOKUP microsoft.com 98.05ms
```

In the end, we can see that our application is still running and responding to the requests.
So, it did not crash but obviously requests failed for those configured addresses.

This is good example how you can use **DNS Chaos** to test out your application resiliency
and many different network related scenarios.

Would you application survive if DNS is failing for some of the services e.g., database, storage, Redis, etc.?

How should it handle gracefully those kind of failures?

Using Chaos Studio, you can easily test out your hypotheses with experiments.

## Experiment 2: Simulate POD failure

In this experiment, we are going to simulate POD failures in our AKS cluster.

Here we have our cluster and apps `(1)` and `(2)` running in the cluster:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/aks-pod-chaos1.png" %}

Apps have different count of replicas and they are spread across different nodes in the cluster.

Now, we are going to simulate POD failures for the apps `(1)` and `(2)`:
- For app `(1)`, we are going to simulate fixed number of POD failures of `2`
- For app `(2)`, we are going to simulate percentage of POD failures of `66%`

We expect that the `(2)` app will still continue to run and be able to serve requests even if 66% of the PODs are failing
but `(1)` app will be completely down if 2 PODs are failing:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/aks-pod-chaos2.png" %}

Here is the experiment configuration:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/experiment2.png" %}

As you can see, there are now two branches in the experiment configuration for simulating two different configurations at the same time.

Fixed number of failures:

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

Percentage based number of failures:

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

Now, let's start our second experiment and see what happens:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/aks-experiment2-start.png" %}

After the experiment has started, we can see that `(1)` is completely down:

```console
$ kubectl get pods -n app1
NAME                               READY   STATUS             RESTARTS     AGE
app1-deployment-75787c7cdd-fzjxt   0/1     CrashLoopBackOff   3 (9s ago)   45h
app1-deployment-75787c7cdd-mxkmw   0/1     CrashLoopBackOff   3 (9s ago)   45h

$ curl $app1_svc_ip
curl: (28) Failed to connect to 4.158.40.219 port 80: Connection timed out
```

But `(2)` is still running and serving requests even if 66% of the PODs are failing:

```console
$ kubectl get pods -n app2
NAME                               READY   STATUS    RESTARTS      AGE
app2-deployment-858f68d4cd-jxlnn   1/1     Running   0             45h
app2-deployment-858f68d4cd-mzxmw   0/1     Running   5 (13s ago)   45h
app2-deployment-858f68d4cd-xxdn6   0/1     Running   5 (13s ago)   45h

$ curl -s $app2_svc_ip/api/update | jq .
{
  "machineName": "app2-deployment-858f68d4cd-jxlnn",
  "started": "2024-08-16T07:05:37.7032398Z",
  "uptime": "00:00:13.4063413",
  "appEnvironment": null,
  "appEnvironmentSticky": null,
  "content": "1.0.11\n"
}
```

This is good example how you can use **POD Chaos** to test out your application resiliency
especially when you have microservices architecture and you have dependencies between different services.
You can then use these to test out your implemented circuit breakers, retries, timeouts, etc.
Here are a few links to the related resources:
- [Retry pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry)
- [Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- [Implement retries with exponential backoff](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/implement-resilient-applications/implement-retries-exponential-backoff)
- [Transient fault handling](https://learn.microsoft.com/en-us/azure/architecture/best-practices/transient-faults)

Of course, you should start asking questions like these from yourself:

Would your application survive if some other service is not running in full capacity?

How many replicas you should have per service and how many of them can be down at the same time?

What if you're under heavy load and some of the services are failing?
[Azure Load Testing](https://learn.microsoft.com/en-us/azure/load-testing/overview-what-is-azure-load-testing)
is good companion for Chaos Studio for generating load to your services so that you can test the impact of the failures.

## Experiment 3: Simulate availability zone failure

In this experiment, we are going to simulate availability zone failure in our 3 node AKS cluster:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/nodepool.png" %}

Here is our application deployments in the cluster:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/aks-az-failure1-3n.png" %}

I have helper `list_pods` function in my shell to list pods and their nodes and zones:

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

Here is example output of the function listing pods of app `(1)`:

```console
$ list_pods app1
Pod: app1-858f68d4cd-6hrvw, Node: aks-nodepool1-17464156-vmss000000, Zone: uksouth-1
Pod: app1-858f68d4cd-bhtjz, Node: aks-nodepool1-17464156-vmss000001, Zone: uksouth-2
Pod: app1-858f68d4cd-smxd4, Node: aks-nodepool1-17464156-vmss000002, Zone: uksouth-3
```

So I can see that they're spread across different availability zones.

Similarly, here is listing of `(2)`:

```console
$ list_pods app2
Pod: app2-75787c7cdd-qbk8v, Node: aks-nodepool1-17464156-vmss000001, Zone: uksouth-2
```
Before starting the experiment, our cluster nodes are running as expected:

```console
$ kubectl get nodes
NAME                                STATUS   ROLES    AGE     VERSION
aks-nodepool1-17464156-vmss000000   Ready    <none>   73m     v1.30.3
aks-nodepool1-17464156-vmss000001   Ready    <none>   5m46s   v1.30.3
aks-nodepool1-17464156-vmss000002   Ready    <none>   5m51s   v1.30.3
```

Now, we are going to simulate availability zone 2 failure.
Here is the experiment configuration:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/experiment3.png" %}

Now, let's start our third experiment and see what happens:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/aks-experiment3-start.png" %}

After the experiment has started and availability zone 2 is impacted, many things start to happen quite fast:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/aks-az-failure2-3n.png" %}

You might see that node is reported to be `NotReady`:

```console
$ kubectl get nodes
NAME                                STATUS     ROLES    AGE    VERSION
aks-nodepool1-17464156-vmss000000   Ready      <none>   104m   v1.30.3
aks-nodepool1-17464156-vmss000001   NotReady   <none>   36m    v1.30.3
aks-nodepool1-17464156-vmss000002   Ready      <none>   36m    v1.30.3
```

If we monitor our apps, we can see that they're being rescheduled to other cluster nodes:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/aks-az-failure3-3n.png" %}

```console
$ kubectl get pods -n app1 -w
NAME                    READY   STATUS              RESTARTS   AGE
app1-858f68d4cd-bhtjz   1/1     Running             0          20m
app1-858f68d4cd-bhtjz   1/1     Terminating         0          20m
app1-858f68d4cd-bhblt   0/1     Pending             0          0s
app1-858f68d4cd-bhblt   0/1     ContainerCreating   0          0s
app1-858f68d4cd-bhblt   0/1     Running             0          1s
app1-858f68d4cd-bhtjz   1/1     Terminating         0          20m
app1-858f68d4cd-bhblt   1/1     Running             0          6s

$ list_pods app1
Pod: app1-858f68d4cd-6hrvw, Node: aks-nodepool1-17464156-vmss000000, Zone: uksouth-1
Pod: app1-858f68d4cd-bhblt, Node: aks-nodepool1-17464156-vmss000002, Zone: uksouth-3
Pod: app1-858f68d4cd-smxd4, Node: aks-nodepool1-17464156-vmss000002, Zone: uksouth-3

$ list_pods app2
Pod: app2-75787c7cdd-bhblt, Node: aks-nodepool1-17464156-vmss000002, Zone: uksouth-3
```

Here is the final state of the cluster after the experiment has completed:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/aks-az-failure4-3n.png" %}

---

You can run the same experiment with larger clusters and see how it then behaves.

Starting point:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/aks-az-failure1.png" %}

After the experiment has started:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/aks-az-failure2.png" %}

During the experiment:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/aks-az-failure3.png" %}

After the experiment has completed:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/26/chaos-studio-and-aks/aks-az-failure4.png" %}

---

**Availability Zone Chaos** extremely powerful experiment to test out your AKS cluster resiliency.

There are tons of scenarios you can test out with availability zone failures.
You can test if you application is correctly scheduled to across zones and nodes as you expected
when you set various _almost magical elements_ in your deployment configurations.
Read more about
[Assigning Pods to Nodes](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/).

Another important test scenario is of course storage. Put persistent storage to the picture and you might see some interesting issues if you by accident have deployed
[Locally redundant storage (LRS)](https://learn.microsoft.com/en-us/azure/virtual-machines/disks-redundancy#locally-redundant-storage-for-managed-disks)
disks into your cluster.
Unfortunately, clusters with 1.28 and below does not have
[storage classes](https://learn.microsoft.com/en-us/azure/aks/concepts-storage#storage-classes)
with
[Zone-redundant storage (ZRS)](https://learn.microsoft.com/en-us/azure/virtual-machines/disks-redundancy#zone-redundant-storage-for-managed-disks)
support built-in. You have to create storage class for them yourself.
From [Release 2024-04-28](https://github.com/Azure/AKS/releases/tag/2024-04-28):

> Effective **starting with Kubernetes version 1.29**,
> when you deploy Azure Kubernetes Service (AKS) clusters across **multiple availability zones**,
> AKS now utilizes **zone-redundant storage (ZRS) to create managed disks within built-in storage classes**.

This gives us many interesting scenarios to test out with Chaos Studio, including
[Azure Container Storage](https://learn.microsoft.com/en-us/azure/storage/container-storage/container-storage-introduction),
but they do deserve their own post.

## Conclusion

In this post, we have seen how you can use Chaos Studio to test out your AKS cluster resiliency.
We have seen how you can simulate DNS failures, POD failures, and availability zone failures.

Chaos Studio is a powerful tool for testing your hypotheses and making sure
that your applications are resilient to failures.

This is broad topic and I have only scratched the surface here.
Expect to see more posts about these topics the future.

You can find the above examples in my GitHub:

{% include githubEmbed.html text="JanneMattila/aks-workshop/26-chaos-studio.sh" link="JanneMattila/aks-workshop/blob/main/26-chaos-studio.sh" %}

I hope you find this useful!
