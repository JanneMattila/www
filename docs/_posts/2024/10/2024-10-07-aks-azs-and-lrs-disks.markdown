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

TBA

Especially, if you have deployed
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

## Older clusters

_TBA_

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/07/aks-azs-and-lrs-disks/architecture2.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/07/aks-azs-and-lrs-disks/chaos-studio1.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/07/aks-azs-and-lrs-disks/architecture3.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/07/aks-azs-and-lrs-disks/architecture4.png" %}

# Newer clusters

So, let's compare the above test with newly deployed cluster and storage classes:

```console
$ kubectl get nodes
NAME                                STATUS   ROLES    AGE     VERSION
aks-nodepool1-17464156-vmss000009   Ready    <none>   12m    v1.30.3
aks-nodepool1-17464156-vmss00000a   Ready    <none>   100s   v1.30.3

$ kubectl get storageclasses
NAME                    PROVISIONER          RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
azurefile               file.csi.azure.com   Delete          Immediate              true                   38d
azurefile-csi           file.csi.azure.com   Delete          Immediate              true                   38d
azurefile-csi-premium   file.csi.azure.com   Delete          Immediate              true                   38d
azurefile-premium       file.csi.azure.com   Delete          Immediate              true                   38d
default (default)       disk.csi.azure.com   Delete          WaitForFirstConsumer   true                   38d
managed                 disk.csi.azure.com   Delete          WaitForFirstConsumer   true                   38d
managed-csi             disk.csi.azure.com   Delete          WaitForFirstConsumer   true                   38d
managed-csi-premium     disk.csi.azure.com   Delete          WaitForFirstConsumer   true                   38d
managed-premium         disk.csi.azure.com   Delete          WaitForFirstConsumer   true                   38d

$ kubectl describe storageclass managed-csi-premium
Name:                  managed-csi-premium
IsDefaultClass:        No
Annotations:           <none>
Provisioner:           disk.csi.azure.com
Parameters:            skuname=Premium_ZRS
AllowVolumeExpansion:  True
MountOptions:          <none>
ReclaimPolicy:         Delete
VolumeBindingMode:     WaitForFirstConsumer
Events:                <none>
```

As you can see, the newer cluster has built-in storage classes with "ZRS" support.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: storage-app-deployment
  namespace: storage-app
spec:
  serviceName: storage-app-svc
  podManagementPolicy: Parallel
  replicas: 1
  selector:
    matchLabels:
      app: storage-app
  template:
    metadata:
      labels:
        app: storage-app
    spec:
      nodeSelector:
        kubernetes.io/os: linux
      terminationGracePeriodSeconds: 10
      containers:
        - image: jannemattila/webapp-fs-tester:1.1.20
          name: storage-app
          ports:
            - containerPort: 8080
              name: http
              protocol: TCP
          volumeMounts:
            - name: premiumdisk
              mountPath: /mnt/premiumdisk
      volumes:
        - name: premiumdisk
          persistentVolumeClaim:
            claimName: premiumdisk-pvc
  volumeClaimTemplates:
    - metadata:
        name: premiumdisk
      spec:
        accessModes:
          - ReadWriteOnce
        storageClassName: managed-csi-premium
        resources:
          requests:
            storage: 4Gi
```

Here is the created disk:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/07/aks-azs-and-lrs-disks/scenario2-disk1.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/07/aks-azs-and-lrs-disks/scenario2-disk2.png" %}

Let's now test the same scenario. Here is our apps _before_ the test:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/07/aks-azs-and-lrs-disks/architecture5.png" %}

```console
$ list_pods storage-app
Pod: storage-app-deployment-0, Node: aks-nodepool1-17464156-vmss00000a, Zone: uksouth-2

$ list_pods network-app
Pod: network-app-deployment-76c7c7cdc5-4wzs2, Node: aks-nodepool1-17464156-vmss00000a, Zone: uksouth-2
```

Call rest API of the `storage-app` to generate some files and then list them:

```console
$ curl -s -X POST --data '{"path": "/mnt/premiumdisk","folders": 2,"subFolders": 3,"filesPerFolder": 5,"fileSize": 1024}' -H "Content-Type: application/json" "http://$storage_app_ip/api/generate" | jq .
{
  "server": "storage-app-deployment-0",
  "path": "/mnt/premiumdisk",
  "filesCreated": 40,
  "milliseconds": 7.3026
}

$ curl -s -X POST --data '{"path": "/mnt/premiumdisk","filter": "*.*","recursive": true}' -H "Content-Type: application/json" "http://$storage_app_ip/api/files" | jq .
{
  "server": "storage-app-deployment-0",
  "files": [
    "/mnt/premiumdisk/1/1/1/2.txt",
    "...abbreviated...",
    "/mnt/premiumdisk/2/2/2/4.txt"
  ],
  "milliseconds": 0.7606
}
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/07/aks-azs-and-lrs-disks/chaos-studio1.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/07/aks-azs-and-lrs-disks/architecture6.png" %}

```console
$ kubectl get pod -n storage-app -w
NAME                       READY   STATUS    RESTARTS   AGE
storage-app-deployment-0   1/1     Running   0          18m
storage-app-deployment-0   1/1     Running   0          18m
storage-app-deployment-0   1/1     Running   0          18m
storage-app-deployment-0   1/1     Terminating   0          18m
storage-app-deployment-0   1/1     Terminating   0          18m
storage-app-deployment-0   1/1     Terminating   0          18m
storage-app-deployment-0   1/1     Terminating   0          18m
storage-app-deployment-0   0/1     Pending       0          0s
storage-app-deployment-0   0/1     Pending       0          0s
storage-app-deployment-0   0/1     ContainerCreating   0          0s
storage-app-deployment-0   1/1     Running             0          22s
```

Obviously, `network-app` (application without disk) was moved to zone 1:

```console
$ list_pods storage-app
Pod: storage-app-deployment-0, Node: aks-nodepool1-17464156-vmss000009, Zone: uksouth-1

$ list_pods network-app
Pod: network-app-deployment-8656fdf5df-t6m9w, Node: aks-nodepool1-17464156-vmss000009, Zone: uksouth-1
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/07/aks-azs-and-lrs-disks/architecture7.png" %}

## Upgrade cluster and storage class

What if you have older clusters and you want to upgrade them to e.g., 1.30?

```console
$ kubectl get storageclasses
```

## Troubleshooting

[Cause: Changing ownership and permissions for large volume takes much time](https://learn.microsoft.com/en-us/troubleshoot/azure/azure-kubernetes/storage/fail-to-mount-azure-disk-volume#cause-changing-ownership-and-permissions-for-large-volume-takes-much-time)


## Conclusion

When you have older AKS clusters with locally redundant storage (LRS) disks,
TBA