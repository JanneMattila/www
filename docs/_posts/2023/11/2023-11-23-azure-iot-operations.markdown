---
layout: posts
title:  "Azure IoT Operations Preview is now available"
image: /assets/posts/2023/11/27/advent-of-code/2022.png
date:   2023-11-25 06:00:00 +0300
categories: azure
tags: azure iot
---
[Azure IoT Operations](https://azure.microsoft.com/en-us/updates/azureiotoperationspreview/) was announced in Ignite last week.

Read more about the announcement from the following blog post and documentation pages:

[Accelerating Industrial Transformation with Azure IoT Operations](https://techcommunity.microsoft.com/t5/internet-of-things-blog/accelerating-industrial-transformation-with-azure-iot-operations/ba-p/3976702)

[What is Azure IoT Operations?](https://learn.microsoft.com/en-us/azure/iot-operations/get-started/overview-iot-operations)

Arc Jumpstart folks has been busy at work and created a new jumpstart for this topic: 

[Enhance operational insights at the edge using Azure IoT Operations (AIO)](https://azurearcjumpstart.com/azure_arc_jumpstart/azure_edge_iot_ops/aio_manufacturing)

{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/azure-rg.png" %}

{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/arc-connect.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/arc-ssh.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/arc-ssh2.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/arc-wac.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/arc-wac-rdp.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/aks-extensions.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/aks-gitops.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/aks-monitoring.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/aio-home.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/aio-homeaks.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/aio-thermostat.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/aio-thermostat2.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/aio-boiler.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/aio-boiler2.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/aio-pipelines.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/aio-pipeline1.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/aio-pipelines-mq.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/aio-pipelines-http.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/aio-pipelines-edit.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/aio-pipelines-save.png" %}
{% include imageEmbed.html link="/assets/posts/2023/11/25/aio/aio-pipelines-save2.png" %}


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

Here is another message:

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