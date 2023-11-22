---
layout: posts
title:  "Azure IoT Operations Preview is now available"
image: /assets/posts/2023/11/22/aio/aio-homeaks.png
date:   2023-11-22 06:00:00 +0300
categories: azure
tags: azure iot
---
[Azure IoT Operations](https://azure.microsoft.com/en-us/updates/azureiotoperationspreview/) was announced at Ignite last week.

Read more about the announcement from the following blog post and official documentation pages:

[Accelerating Industrial Transformation with Azure IoT Operations](https://techcommunity.microsoft.com/t5/internet-of-things-blog/accelerating-industrial-transformation-with-azure-iot-operations/ba-p/3976702)

[What is Azure IoT Operations?](https://learn.microsoft.com/en-us/azure/iot-operations/get-started/overview-iot-operations)

Arc Jumpstart folks has been busy at work and created a new jumpstart for this topic: 

[Enhance operational insights at the edge using Azure IoT Operations (AIO)](https://azurearcjumpstart.com/azure_arc_jumpstart/azure_edge_iot_ops/aio_manufacturing)

So quite a lot of content is available already for this new service.
Of course, I had to deploy this to my Intel NUC machine running in my living room:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/22/aio/nuc1.jpg" %}
{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/11/22/aio/nuc2.jpg" %}

Here are my deployed resources in Azure:

{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/azure-rg.png" %}

Main resources from above list are:

[Azure Arc-enabled servers](https://learn.microsoft.com/en-us/azure/azure-arc/servers/overview): Intel NUC machine running Windows Server 2022.

[Azure Arc-enabled Kubernetes](https://learn.microsoft.com/en-us/azure/azure-arc/kubernetes/overview): AKS Edge Essentials

And then new [IoT Assets](https://learn.microsoft.com/en-us/azure/iot-operations/manage-devices-assets/overview-manage-assets) like `thermostat` and `boiler`.

I just want to reiterate that even if Azure IoT Operations itself is in _preview_,
it is building on top of many other services that are already generally available (GA).

Arc-enabled servers became [generally available in 2020](https://azure.microsoft.com/en-us/updates/azure-arc-enabled-servers-is-now-generally-available/).

[AKS Edge Essentials](https://learn.microsoft.com/en-us/azure/aks/hybrid/aks-edge-overview) became [generally available in March 2023](https://techcommunity.microsoft.com/t5/internet-of-things-blog/bring-all-your-workloads-to-the-edge-with-aks-edge-essentials/ba-p/3765162).

[MQTT broker feature in Azure Event Grid](https://techcommunity.microsoft.com/t5/messaging-on-azure-blog/fully-managed-mqtt-broker-flexible-consumption-patterns-and-more/ba-p/3978957)
became [generally available in November 2023](https://azure.microsoft.com/en-us/updates/mqtt-broker-feature-pubsub-capabilities-now-available-for-azure-event-grid/)

You want to build your service in shoulders of giants.

## Arc capabilities

It would be hard to talk about Azure IoT Operations without talking about Azure Arc.
It solves many of those challenges that you're facing when you're building an edge solution.

I'll pick a few examples to show in here. First one is the connectivity
options for connecting to your device. You can use SSH, Windows Admin Center
and RDP to access Arc-enabled servers.

You can connect in the Portal using [Cloud Shell](https://learn.microsoft.com/en-us/azure/cloud-shell/overview)
by clicking on the _Connect in browser_ button:

{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/arc-connect.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/cloudshell.png" %}

Or then you can connect from your local machine using [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli):

{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/arc-ssh.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/arc-ssh2.png" %}

You can also use [Windows Admin Center](https://learn.microsoft.com/en-us/windows-server/manage/windows-admin-center/azure/manage-arc-hybrid-machines) to connect to your Arc-enabled servers:
{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/arc-wac.png" %}

From Window Admin Center you can then use Remote Desktop for connecting to your machine:
{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/arc-wac-rdp.png" %}

Azure Arc-enabled Kubernetes has tons of features, but I'll just show
two favorite ones of mine. 
[Azure Monitor Container Insights for Azure Arc-enabled Kubernetes clusters](https://learn.microsoft.com/en-us/azure/azure-monitor/containers/container-insights-enable-arc-enabled-clusters?toc=%2Fazure%2Fazure-arc%2Fkubernetes%2Ftoc.json&bc=%2Fazure%2Fazure-arc%2Fkubernetes%2Fbreadcrumb%2Ftoc.json&tabs=create-cli%2Cverify-portal)
is the first feature to highlight:

{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/aks-monitoring.png" %}

Second one is [GitOps using Flux v2](https://learn.microsoft.com/en-us/azure/azure-arc/kubernetes/conceptual-gitops-flux2) for application deployment:
{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/aks-gitops.png" %}

With the above configuration cluster pulls configuration from this GitHub repository and
deploys it to the cluster automatically:
{% include githubEmbed.html text="JanneMattila/aks-ee-gitops" link="JanneMattila/aks-ee-gitops" %}

## Azure IoT Operations (AIO)

Azure IoT Operations has its own portal:

[https://iotoperations.azure.com](https://iotoperations.azure.com)

It displays all your AIO enabled clusters in the home view:

{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/aio-home.png" %}

Opening my `homeaks` shows all the assets underneath it:
{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/aio-homeaks.png" %}

Thermostat properties:
{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/aio-thermostat.png" %}
Thermostat tags:
{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/aio-thermostat2.png" %}
Boiler properties:
{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/aio-boiler.png" %}
Boiler tags:
{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/aio-boiler2.png" %}

I can then manage [Data pipelines](https://learn.microsoft.com/en-us/azure/iot-operations/process-data/overview-data-processor) that are then executed on the edge. I can do all this work from the same portal:
{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/aio-pipelines.png" %}

I've created the world's most simple pipeline just to show how it works:
{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/aio-pipeline1.png" %}

It takes messages from topics (note the [MQTT Topic filter](https://learn.microsoft.com/en-us/azure/event-grid/mqtt-topic-spaces#mqtt-topic-filter) as `#` in the end):
{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/aio-pipelines-mq.png" %}

For demo purposes, I'll invoke external rest endpoint for each message so
that I can see the message content and see how frequent messages are being sent:
{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/aio-pipelines-http.png" %}

I can then enable that pipeline from the portal:
{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/aio-pipelines-edit.png" %}

It's then synchronized to the edge, and it gets executed there:
{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/aio-pipelines-save2.png" %}

Now messages start to flow to my external endpoint, and I can capture them there.
Here is one example message:

```json
{
  "payload": {
    "dataSetWriterName": "thermostat",
    "messageType": "ua-deltaframe",
    "payload": {
      "Tag 10": {
        "SourceTimestamp": "2023-11-18T19:16:14.3165612Z",
        "Value": 84854
      },
      "temperature": {
        "SourceTimestamp": "2023-11-18T19:16:14.3164787Z",
        "Value": 84854
      }
    },
    "sequenceNumber": 69281,
    "timestamp": "2023-11-18T19:16:14.6770589Z"
  },
  "properties": {
    "contentType": "application/json",
    "payloadFormat": 1
  },
  "qos": 0,
  "systemProperties": {
    "partitionId": 0,
    "partitionKey": "azure-iot-operations/data/opc.tcp/opc.tcp-1/thermostat",
    "timestamp": "2023-11-18T19:16:14.681Z"
  },
  "topic": "azure-iot-operations/data/opc.tcp/opc.tcp-1/thermostat",
  "userProperties": [
    {
      "key": "mqtt-enqueue-time",
      "value": "2023-11-18 19:16:14.678 +00:00"
    },
    {
      "key": "uuid",
      "value": "d52b7fbf-b98d-4105-82b2-7e1545397485"
    },
    {
      "key": "externalAssetId",
      "value": "d52b7fbf-b98d-4105-82b2-7e1545397485"
    },
    {
      "key": "traceparent",
      "value": "00-010ff7463fb00cdb8c8babadea229ecb-772f11e4996284b8-01"
    }
  ]
}
```

Here is another example message:

```json
{
  "payload": {
    "dataSetWriterName": "boiler-1-c46fdde37f577b9ab0cd7b90b89d2a4e",
    "messageType": "ua-deltaframe",
    "payload": {
      "dtmi:microsoft:opcuabroker:Boiler__2:tlm_CurrentTemperature_6211;1": {
        "SourceTimestamp": "2023-11-18T19:16:14.3122101Z",
        "Value": 85
      }
    },
    "sequenceNumber": 79112,
    "timestamp": "2023-11-18T19:16:14.677051Z"
  },
  "properties": {
    "contentType": "application/json",
    "payloadFormat": 1
  },
  "qos": 0,
  "systemProperties": {
    "partitionId": 0,
    "partitionKey": "azure-iot-operations/data/opc.tcp/opc.tcp-1/boiler-1-c46fdde37f577b9ab0cd7b90b89d2a4e",
    "timestamp": "2023-11-18T19:16:14.681Z"
  },
  "topic": "azure-iot-operations/data/opc.tcp/opc.tcp-1/boiler-1-c46fdde37f577b9ab0cd7b90b89d2a4e",
  "userProperties": [
    {
      "key": "mqtt-enqueue-time",
      "value": "2023-11-18 19:16:14.677 +00:00"
    },
    {
      "key": "traceparent",
      "value": "00-232fabe6f2baa6ffd22fa0fd0677bbe5-9025710285afea84-01"
    }
  ]
}
```

Those messages started flowing very fast, so the data processing pipeline
works exactly as expected.

You can process the data on the edge using
capabilities under _Stages_. You can use multiple
steps in the data processing pipeline:

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2023/11/22/aio/stages.png" %}

You can use _Destinations_ to push your data to e.g., 
[Microsoft Fabric](https://learn.microsoft.com/en-us/azure/iot-operations/connect-to-cloud/howto-configure-destination-fabric):

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2023/11/22/aio/destinations.png" %}

So let's enhance our above pipeline to this:

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2023/11/22/aio/pipeline-edited.png" %}

Filter stage only selects messages coming from `thermostat`:

```sql
.payload.dataSetWriterName == "thermostat"
```

Transform stage selects only `temperature` element:
  
```sql
.payload |= .payload.temperature
```

And I only send `.payload` to the external endpoint.
This way I get messages like this:

```json
{
  "SourceTimestamp": "2023-11-22T13:08:54.3203304Z",
  "Value": 408414
}
```

All of this I managed to do directly from the Azure IoT Operations portal.
Pretty powerful right?

---

If you were wondering how Azure IoT Operations was deployed to the edge, then you
can see it in the Kubernetes clusters extensions:

{% include imageEmbed.html link="/assets/posts/2023/11/22/aio/aks-extensions.png" %}

## Summary

If you're building an edge solution, then you should definitely check out Azure IoT Operations.
Take it for a spin and let us know what you think about it.

I hope you find this useful!
