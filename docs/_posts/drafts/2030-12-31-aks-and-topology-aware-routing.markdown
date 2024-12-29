---
title: AKS and Topology Aware Routing
image: /assets/share.png
date: 2030-12-31 06:00:00 +0300
layout: posts
categories: azure
tags: azure chaos-studio chaos-engineering chaos-mesh kubernetes aks
---

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/10/21/azure-firewall-and-availability-zones/export1.png" %}

{% include imageEmbed.html link="/assets/posts/common/magic-large.gif" alt="Cosmos DB and networking is magic" %}

Sometimes modules encapsulate the functionality so well that you don't really understand
what's happening under the hood anymore. And as you might know, I hate [magic]({% post_url 2023/08/2023-08-14-cosmosdb-and-magic %}).

[text](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/)

[text](https://kubernetes.io/docs/concepts/services-networking/topology-aware-routing/)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: network-app-svc
  namespace: network-app
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 8080
  selector:
    app: network-app
```

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: network-app-deployment
  namespace: network-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: network-app
  template:
    metadata:
      labels:
        app: network-app
    spec:
      nodeSelector:
        kubernetes.io/os: linux
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: network-app
      containers:
        - image: jannemattila/webapp-network-tester:1.0.75
          name: network-app
          resources:
            requests:
              cpu: 100m
              memory: 100Mi
            limits:
              cpu: 150m
              memory: 150Mi
          ports:
            - containerPort: 8080
              name: http
              protocol: TCP
```

Update the service:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: network-app-svc
  namespace: network-app
  annotations:
    service.kubernetes.io/topology-mode: Auto
spec:
  type: ClusterIP
  trafficDistribution: PreferClose
  internalTrafficPolicy: Local
  ports:
    - port: 80
      targetPort: 8080
  selector:
    app: network-app
```
