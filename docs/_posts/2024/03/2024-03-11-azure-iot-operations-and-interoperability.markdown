---
layout: posts
title: Azure IoT Operations and interoperability between Windows and Linux
image: /assets/posts/2024/03/11/azure-iot-operations-and-interoperability/http-paths.png
date:   2024-03-11 06:00:00 +0300
categories: azure
tags: azure iot
---
I previously blogged about 
[Azure IoT Operations]({% post_url 2023/11/2023-11-22-azure-iot-operations %})
and demonstrated many management and connectivity related capabilities,
like SSH and RDP access to the machines etc.
That post also included simple example of data processing pipeline.

One thing that I forgot to mention in that post was the **interoperability**
between different components.
I'll try to cover that in this post.

## Demo setup

Let's remind ourselves about the components that I have in my demo environment:

1. Windows Server 2022 running in Intel NUC
- This Windows is [Arc-enabled](https://learn.microsoft.com/en-us/azure/azure-arc/servers/overview) so I get all the good management capabilities to this layer directly from Azure
2. [AKS Edge Essentials](https://learn.microsoft.com/en-us/azure/aks/hybrid/aks-edge-overview) is installed on top of the Windows Server
 - This Kubernetes is also [Arc-enabled](https://learn.microsoft.com/en-us/azure/azure-arc/kubernetes/overview), so _again_ I get all the capabilities of Arc-enabled Kubernetes such as GitOps and Azure Monitoring
3. [Azure IoT Operations](https://learn.microsoft.com/en-us/azure/iot-operations/get-started/overview-iot-operations) is deployed into this Kubernetes
 - It's running in Linux containers but AKS EE does support Windows containers as well

## Custom applications

I can now deploy my _custom applications_ into my  Kubernetes, and
my preferred way of managing the deployments is GitOps.
Here is my GitOps configuration used in my demo environment:

{% include githubEmbed.html text="JanneMattila/aks-ee-gitops" link="https://github.com/JanneMattila/aks-ee-gitops" %}

It also includes my [webapp-network-tester](https://github.com/JanneMattila/webapp-network-tester)
too which I've already blogged few times earlier. Read more about it
[here]({% post_url 2023/08/2023-08-22-testing-your-network-configuration %}). 

I can **also** deploy _custom applications_ directly to the **Windows host**
e.g., as a Windows Service, IIS hosted or a scheduled task or whatever I want.

There are many situations when you need to deploy something to the Windows Host.
E.g., .NET Framework based applications or C/C++ 
Windows Services (from end of 90s which are minimally maintained)
and those would be hard to containerize.
Rewriting those applications to support containerization is not many times even an option.
Maybe it's in your plans to get rid of some of these applications in the future,
but for now, they are there and you need to run them.

Or if you have _3rd party software_ that is only supported in the Windows Host,
then you don't even have option to migrate those applications to containers.

This brings us to the main point of this post:

> _You **very likely** have scenarios that require connectivity between your different applications_
> _running either directly in Windows Host or then inside Kubernetes._

## Interoperability in AKS EE

Okay now I've described my demo setup and hopefully we're agreeing that
you very likely have scenarios that require connectivity between Windows Host and your
container based applications.

How can we then connect these different components together?

## Azure IoT Operations and data processing pipeline

Finally, we're landing into my 


Azure IoT Operations pipeline can also take advantage of the above setup.
You can invoke HTTP endpoints running in Windows or Linux.

[Expose Kubernetes services to external devices](https://learn.microsoft.com/en-us/azure/aks/hybrid/aks-edge-howto-expose-service)

{% include mermaid.html text="
sequenceDiagram
    actor User
    User->>+Windows: Use webapp
    Windows->>+Linux: Port forward
    Linux-->>-Windows: Response
    Windows-->>-User: Response
" %}

```bash
$ kubectl get service -n demos
NAME                         TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
k8s-probe-demo               LoadBalancer   10.43.103.13    192.168.0.4   80:31902/TCP   105d
webapp-network-tester-demo   LoadBalancer   10.43.216.203   192.168.0.5   80:31379/TCP   105d
```

Since I want to expose `webapp-network-tester-demo`, then I'll select the IP `192.168.0.5` and port `80` to be exposed to the outside world.

```powershell
New-NetFirewallRule -DisplayName "aks-ee-svc" -Direction Inbound -Protocol TCP -LocalPort 80,443 -Action Allow
netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=80 connectaddress=192.168.0.5
```

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/03/11/azure-iot-operations-and-interoperability/fw.png" %}

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/03/11/azure-iot-operations-and-interoperability/remote.png" %}

{% include mermaid.html text="
sequenceDiagram
    note left of Pipeline: Use application running<br/>in Windows host
    Pipeline->>+Windows: Invoke Rest API
    Windows->>+Pipeline: Response
    note left of Pipeline: Use application running<br/>in Linux containers
    Pipeline->>+Linux: Invoke Rest API
    Linux->>+Pipeline: Response
" %}

## Conclusion

Just to be clear:

> Interoperability is capability of AKS Edge Essentials and
> we can take advantage of it in our custom applications and
> Azure IoT Operations data processing pipelines.
