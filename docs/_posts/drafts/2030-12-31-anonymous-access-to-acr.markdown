---
title: Anonymous access to my images from Azure Container Registry
image: /assets/share.png
date: 2030-12-31 06:00:00 +0300
layout: posts
categories: azure
tags: azure containers acr aci
---

If I want to deploy Azure Container Instances (ACI) with my images from Docker Hub, I'm quite frequently 
running into these deployment errors:

```bash
resource_group_name="rg-aci-demo"
location="swedencentral"

az group create -l $location -n $resource_group_name -o table

aci_ip=$(az container create \
  --name "aci-demo" \
  --resource-group $resource_group_name \
  --image "jannemattila/webapp-network-tester:1.0.76" \
  --ports 80 \
  --ip-address Public \
  --cpu 1 \
  --memory 1 \
  --environment-variables "ASPNETCORE_URLS=http://*:80" \
  --restart-policy Always \
  --query ipAddress.ip -o tsv)

curl $aci_ip
```

```bash
az acr update --name "jannemattila" --anonymous-pull-enabled true
```

- Public ACR to avoid ACI issues
  - 
  - https://github.com/Azure/acr/blob/main/docs/custom-domain/README.md
  - az acr update --name <your-registry-name> --custom-domain <your-custom-domain>

  az acr import --name jannemattila --source docker.io/jannemattila/web-navigator:latest --image web-navigator