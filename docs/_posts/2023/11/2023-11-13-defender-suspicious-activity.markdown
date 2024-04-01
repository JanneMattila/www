---
layout: posts
title:  "\"Microsoft Defender for Cloud has detected suspicious activity in your environment\""
image: /assets/posts/2023/11/13/defender-suspicious-activity/alerts-list.png
date:   2023-11-13 06:00:00 +0300
categories: azure
tags: azure security defender
---
You might have received emails from "Microsoft Defender for Cloud" like this:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/email-dangling-domain.png" %}

or like this:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/email-sensitive-volume-mount.png" %}

or one with extra bonus twist and _multiple alerts_ from a single cluster in one email:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/email-multiple.png" %}

and if you haven't, then please go to:

**Microsoft Defender for Cloud > Environment settings > Select subscription > Email notifications**

and validate that your [email notification settings](https://learn.microsoft.com/en-us/azure/defender-for-cloud/configure-email-notifications)
are correctly set:

{% include imageEmbed.html link="/assets/posts/2023/11/13/defender-suspicious-activity/email-notifications.png" %}

after that you should go to:

**Microsoft Defender for Cloud > Security alerts**

and see your "Security alerts" list in case you have not noticed them before:

{% include imageEmbed.html link="/assets/posts/2023/11/13/defender-suspicious-activity/alerts-list.png" %}

and if you for some reason haven't yet enabled _Microsoft Defender for Cloud_, then now is a good time to do that.

**Microsoft Defender for Cloud > Environment settings > Select subscription > Defender plans: Enable all plans** or select all the plans that you want to enable.

More information can be found here:
[Connect your Azure subscriptions](https://learn.microsoft.com/en-us/azure/defender-for-cloud/connect-azure-subscription).

---

But let's get back to the list of alerts above. It does look bad, doesn't it?
Let's go through them one-by-one.

### Dangling domain

I use [Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/overview) a lot. It's
my go to service for hosting web applications. 

Quite often, I use custom domains in my demos to match customers testing scenarios.
Things are always a bit harder if you have your own domain and then you need to
use your own certificates etc.

Of course, I do clean up environments after demos, but cleaning up DNS Records
might be something that I _forget_ to do. And that's exactly what happened here.
I had created app service with custom domain and then I had deleted it, but I
had forgotten to delete DNS Records associated with it.

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/dangling-domain.png" %}
{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/dangling-domain2.png" %}

More information about 
[App Service introduces dangling DNS protection](https://azure.microsoft.com/en-us/blog/azure-defender-for-app-service-introduces-dangling-dns-protection/)
and
[Alerts for Azure App Service](https://learn.microsoft.com/en-us/azure/defender-for-cloud/alerts-reference#alerts-azureappserv).

So, I went to DNS zone and deleted the old record. Problem solved!

### Sensitive volume mount

[Azure Kubernetes Service](https://learn.microsoft.com/en-us/azure/aks/intro-kubernetes)
is a service that is used by many of my customers and it means that I actively work with it.
Therefore, I have created a lot of demos around it _including_
_Microsoft Defender for Cloud_. This alert wasn't a surprise, since
I have caused it on purpose by adding [hostPath](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath)
to my demo deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: network-app-deployment
  namespace: network-app
spec:
  replicas: 1
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
      containers:
        - image: jannemattila/webapp-network-tester:1.0.60
          name: network-app
          resources:
            requests:
              cpu: 100m
              memory: 100Mi
            limits:
              cpu: 150m
              memory: 150Mi
          ports:
            - containerPort: 80
              name: http
              protocol: TCP
          volumeMounts:            # <--
            - name: hostpath       # <--
              mountPath: /mnt/host # <--
      volumes:
        - name: hostpath # <--
          hostPath:      # <--
            path: /      # <--
```

Microsoft Defender for Cloud alerts about this:
{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/container-mount.png" %}

It also provides all the details needed to take corrective actions:
{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/container-mount2.png" %}

### HCIBox related alerts

In my previous post
[Use HCIBox to learn Azure Stack HCI]({% post_url 2023/10/2023-10-16-use-hcibox-to-learn-azure-stack-hci %})
I wrote about how you can use HCIBox to learn Azure Stack HCI.
Apparently, my demo environment had some issues and Microsoft Defender for Cloud
highlighted them to me:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/role-binding.png" %}

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/role-binding2.png" %}

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/container.png" %}

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/container2.png" %}

Since this is learning environment which I only deploy temporarily, I'll just
mark these as resolved:

{% include imageEmbed.html link="/assets/posts/2023/11/13/defender-suspicious-activity/resolve.png" %}

### Multiple alerts from single cluster

This is something that I got after preparing for workshop about AKS:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/multiple-incidents.png" %}

After opening the details, we can quickly see that `sensitive volume mount`
is also in this cluster:
{% include imageEmbed.html link="/assets/posts/2023/11/13/defender-suspicious-activity/multiple-incidents2.png" %}

But the second one with `New high privileges role detected` was new one.
Opening details of the alert explains it right away: 

{% include imageEmbed.html link="/assets/posts/2023/11/13/defender-suspicious-activity/multiple-incidents-high-role.png" %}

So indeed, I've deployed [ClusterInfo](https://scubakiz.github.io/clusterinfo/)
into my cluster using [Helm](https://helm.sh/):

```text
helm repo add scubakiz https://scubakiz.github.io/clusterinfo/
helm install clusterinfo scubakiz/clusterinfo
```

I use it to demo the deployments so that it's visually easy to see the changes
using Cluster Info. Despite this alert, I recommend using it for learning purposes.

This AKS resource lifespan is only duration of one workshop, so I can dismiss these two alerts.

### Suspicious User Agent detected

This one is an interesting one. Clearly something is scanning my web application:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/app-service.png" %}

Quite interesting user agent in the request:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/app-service2.png" %}

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/app-service3.png" %}

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/app-service4.png" %}

From the [Alerts for Azure App Service](https://learn.microsoft.com/en-us/azure/defender-for-cloud/alerts-reference#alerts-azureappserv)
we get good explanation for this:

> Azure App Service activity log indicates requests with suspicious user agent.
> This behavior can indicate on attempts to exploit a vulnerability
> in your App Service application.

This is something that I'll monitor because it seems to be one time thing for now.

### Sample alerts

You can also use _Sample alerts_ functionality to generate alerts for your environment:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/13/defender-suspicious-activity/sample-alerts.png" %}

{% include imageEmbed.html link="/assets/posts/2023/11/13/defender-suspicious-activity/sample-alerts2.png" %}

### Summary

I hope you got some idea how 
[Microsoft Defender for Cloud](https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-cloud-introduction)
can help you to find these issues and alert you about these findings. 
Now it's your turn to take it for a spin and learn more about it.

I hope you find this useful!
