---
layout: posts
title: Azure IoT Operations and interoperability between Windows and Linux
image: /assets/posts/2024/03/11/azure-iot-operations-and-interoperability/pipeline1.png
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

[Arc Jumpstart Resources](https://azurearcjumpstart.com/)

 {% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/11/azure-iot-operations-and-interoperability/aksee1.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/03/11/azure-iot-operations-and-interoperability/aksee2.png" %}

## Custom applications

I can now deploy my _custom applications_ into my  Kubernetes, and
my preferred way of managing the deployments is GitOps.
Here is my GitOps configuration used in my demo environment:

{% include githubEmbed.html text="JanneMattila/aks-ee-gitops" link="JanneMattila/aks-ee-gitops" %}

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

**Easily**, since this has been designed to be interoperable.
Let me show this in practice with a demo:

`webapp-network-tester` is running **both** in _Windows Host_ and inside AKS EE in _Linux container_.

If I now RDP to the Windows Host and open a browser, I can access the webapp running in Windows Host:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2024/03/11/azure-iot-operations-and-interoperability/localhost.png" %}

I started my application with following command, so it's running in port `8080` and listening on all interfaces:

```powershell
dotnet run --urls="http://+:8080"
```

Therefore, I can access it using the IP address of the Windows Host:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2024/03/11/azure-iot-operations-and-interoperability/localhost2.png" %}

I can also reach the app directly from my laptop in the same network by using that machines IP address:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2024/03/11/azure-iot-operations-and-interoperability/remote-local.png" %}

In my server, I can use `kubectl` to get the information about the exposed services from Kubernetes:

```bash
$ kubectl get service -n demos
NAME                         TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
k8s-probe-demo               LoadBalancer   10.43.103.13    192.168.0.4   80:31902/TCP   105d
webapp-network-tester-demo   LoadBalancer   10.43.216.203   192.168.0.5   80:31379/TCP   105d
```

Reason for seeing `EXTERNAL-IP` is that I've just used the `LoadBalancer` type of service in my Kubernetes configuration:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: webapp-network-tester-demo
  namespace: demos
spec:
  type: LoadBalancer
  ports:
    - port: 80
  selector:
    app: webapp-network-tester-demo
```

Since I'm only interested about `webapp-network-tester-demo`, I'll pick the IP `192.168.0.5` and port `80`
from the above list and put them into browser:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2024/03/11/azure-iot-operations-and-interoperability/remote-remote.png" %}

Why is that showing white background and others are not? At the time of writing this post,
it's using older version of the image (as you can see from my GitOps configuration).
You can find the latest version from here:

{% include dockerEmbed.html text="JanneMattila/webapp-network-tester" link="r/jannemattila/webapp-network-tester" %}

So okay, we've now **verified** that you can connect directly to the applications running inside AKS EE from the Windows Host.

---

Next I want to expose this containerized application to the other users in the same network.
Here's the diagram to illustrate the setup:

{% include mermaid.html text="
sequenceDiagram
    actor User
    note right of User: User is in the same network<br/>as the Windows machine
    User->>Windows: Use webapp
    Windows->>Linux: Port forward
    Linux-->>Windows: Response
    Windows-->>User: Response
" %}

You can follow these [instructions](https://learn.microsoft.com/en-us/azure/aks/hybrid/aks-edge-howto-expose-service)
and here's the summary what I did:

```powershell
New-NetFirewallRule -DisplayName "aks-ee-svc" -Direction Inbound -Protocol TCP -LocalPort 80,443 -Action Allow
netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=80 connectaddress=192.168.0.5
```

Above enables port `80` and `443` in the Windows Firewall and then sets up port forwarding from the Windows Host to the Kubernetes service. 

Firewall rule has been created:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/03/11/azure-iot-operations-and-interoperability/fw.png" %}

Now I can access that application running inside AKS EE from my laptop in the same network:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/03/11/azure-iot-operations-and-interoperability/remote.png" %}

You can use this setup to expose web user interfaces for Operators or other users in your network.

Now we have **verified** that you can connect directly to the applications running inside AKS EE from the Windows Host and also from the rest of the machines in the same network.

---

Next test is a bit more complex. I'll illustrate it with the diagram:

{% include mermaid.html text="
sequenceDiagram
    actor User
    User->>Windows: Invoke Rest API
    Windows->>Linux: Port forward
    Linux->>Windows App: Invoke Rest API
    Windows App-->>Linux: Response
    Linux-->>Windows: Response
    Windows-->>User: Response
" %}

Now we want test that the application running inside AKS EE is able to invoke a REST API running in the Windows Host.
We can use our test tool to do this.
Here is the test in [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension format:

```
### Invoke Rest API
POST http://192.168.68.68/api/commands HTTP/1.1

HTTP POST http://192.168.0.1:8080/api/commands
INFO HOSTNAME
```

We post to our exposed service in the Windows Host and then that application will do another
post to the address of the application running in Windows Host. Payload will be `INFO HOSTNAME`
which means that output of this call chain should be the the hostname of the Windows Host.

Here's the output of that test:

```
-> Start: HTTP POST http://192.168.0.1:8080/api/commands
-> Start: INFO HOSTNAME
HOSTNAME: WIN-OS3VAQEPSH7
<- End: INFO HOSTNAME 0,07ms
<- End: HTTP POST http://192.168.0.1:8080/api/commands 9.40ms
```

Above **verifies** that you can connect from applications running inside AKS EE to applications
running int the Windows Host.

All the above tests verify that the interoperability between Windows Host and AKS EE is working as expected
and that is pretty powerful capability.
You can now use this capability to plan your edge software architecture better.

## Azure IoT Operations and data processing pipeline

_Finally_, we're approaching the title of the post.

Naturally, Azure IoT Operations data processing pipelines can take advantage of the above capability.
You can invoke HTTP endpoints running in Windows Host or containerized applications.

Let's create a simple example about this using
[HTTP endpoint source in the pipeline](https://learn.microsoft.com/en-us/azure/iot-operations/process-data/howto-configure-datasource-http):

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/03/11/azure-iot-operations-and-interoperability/pipeline1.png" %}

Here is the HTTP endpoint source configuration:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2024/03/11/azure-iot-operations-and-interoperability/pipeline2.png" %}

URL is using DNS name available inside Kubernetes:

```
http://webapp-network-tester-demo.demos.svc.cluster.local/api/commands
```

Data format is `Raw` and request body is this:

```
HTTP POST "http://192.168.0.1:8080/api/commands"
INFO HOSTNAME
```

We want to achieve following integration:

{% include mermaid.html text="
sequenceDiagram
    Pipeline->>Linux: Invoke Rest API
    Linux->>Windows: Invoke Rest API
    Windows-->>Linux: Response
    Linux-->>Pipeline: Response
" %}

Above is very similar to the test we did earlier in the post.

I've set the request internal to `1m` in the pipeline,
so I get data echoed to my external web app once per every minute.

Here's the output:

```
-> Start: HTTP POST "http://192.168.0.1:8080/api/commands"
-> Start: INFO HOSTNAME
HOSTNAME: WIN-OS3VAQEPSH7
<- End: INFO HOSTNAME 0,03ms
<- End: HTTP POST "http://192.168.0.1:8080/api/commands" 4.61ms
```

Above **verifies** that you can use same interoperability capabilities
in the Azure IoT Operations data processing pipelines.

You can, of course, similarly connect directly to Windows Host as we did above
or even have multiple rest API calls in the same pipeline:

{% include mermaid.html text="
sequenceDiagram
    note left of Pipeline: Use application running<br/>in Windows host
    Pipeline->>+Windows: Invoke Rest API
    Windows->>+Pipeline: Response
    note left of Pipeline: Use application running<br/>in Linux containers
    Pipeline->>+Linux: Invoke Rest API
    Linux->>+Pipeline: Response
" %}

All the required capabilities are there, it's just up to you to use them.

## Conclusion

Just to be clear:

> Interoperability is capability of AKS Edge Essentials and
> we can take advantage of it in our custom applications and
> Azure IoT Operations data processing pipelines.

This is powerful and provides flexibility to your edge software architecture.

I hope you find this useful!
