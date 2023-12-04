---
layout: posts
title:  "Kubernetes API deprecations"
image: /assets/posts/2023/12/11/k8s-api-deprecations/archive-data-retrieval.png
date:   2023-12-11 06:00:00 +0300
categories: kubernetes
tags: kubernetes azure 
---
<!--
- K8s & Docker desktop local API, Deprecations
  - If you use old kubectl, then you might not have those capabilities introduced in newer versions
-->

https://kubernetes.io/docs/reference/using-api/deprecation-guide/

https://github.com/JanneMattila/kubernetes-notes

**Note**: Get yourself [Visual Studio Code](https://code.visualstudio.com/)
and [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension.

`PowerShell` example:

```powershell
$contextName = "docker-desktop"

$clientKeyData = kubectl config view --raw `
  -o jsonpath="{.users[?(@.name == $contextName)].user.client-key-data}"
$clientKeyDataString = [Text.Encoding]::Utf8.GetString([Convert]::FromBase64String($clientKeyData)) 
$clientKeyDataString > .vscode/client.key

$clientCertificateData = kubectl config view --raw `
  -o jsonpath="{.users[?(@.name == $contextName)].user.client-certificate-data}"
$clientCertificateData = [Text.Encoding]::Utf8.GetString([Convert]::FromBase64String($clientCertificateData))
$clientCertificateData > .vscode/client.crt

@"
{
  "rest-client.certificates": {
    "kubernetes.docker.internal:6443": {
      "cert": ".vscode/client.crt",
      "key": ".vscode/client.key"
    }
  }
}
"@ > .vscode/settings.json

Get-Content .vscode/settings.json

@"
@endpoint = https://kubernetes.docker.internal:6443

### Fetch paths
GET {{endpoint}}/ HTTP/1.1
Content-Type: application/json; charset=utf-8

### Fetch version
GET {{endpoint}}/version HTTP/1.1
Content-Type: application/json; charset=utf-8

### Health endpoints
GET {{endpoint}}/livez?verbose HTTP/1.1
Content-Type: application/json; charset=utf-8

### API resource list - v1
GET {{endpoint}}/api/v1 HTTP/1.1
Content-Type: application/json; charset=utf-8

### Fetch namespace list
GET {{endpoint}}/api/v1/namespaces HTTP/1.1
Content-Type: application/json; charset=utf-8
@" > k8s.http

code .
```

Longer example of `k8s.http`:

{% include githubEmbed.html text="k8s.http" link="JanneMattila/api-examples/blob/master/others/k8s.http" %}

Other various API examples are part of that same repository:

{% include githubEmbed.html text="JanneMattila/api-examples" link="JanneMattila/api-examples" %}

Here is similar example with `Bash` and using AKS API server:

```bash
aks_json=$(az aks create --resource-group $resource_group_name -n $aks_name \
 # ....abbreviated but details in link below
  -o json)
aks_api_server=$(echo $aks_json | jq -r .azurePortalFqdn)

# "Azure Kubernetes Service AAD Server"
# Search "6dae42f8-4368-4678-94ff-3960e28e3630" from Entra ID
aks_api_server_accesstoken=$(az account get-access-token --resource "6dae42f8-4368-4678-94ff-3960e28e3630" --query accessToken -o tsv)

# Study this access token in https://jwt.ms
echo $aks_api_server_accesstoken
echo $aks_api_server

curl -H "Authorization: Bearer $aks_api_server_accesstoken" https://$aks_api_server/
curl -H "Authorization: Bearer $aks_api_server_accesstoken" https://$aks_api_server/version
curl -H "Authorization: Bearer $aks_api_server_accesstoken" https://$aks_api_server/livez
curl -H "Authorization: Bearer $aks_api_server_accesstoken" https://$aks_api_server/healthz

curl -H "Authorization: Bearer $aks_api_server_accesstoken" https://$aks_api_server/api/v1/nodes
curl -H "Authorization: Bearer $aks_api_server_accesstoken" https://$aks_api_server/api/v1/namespaces
```

{% include githubEmbed.html text="03-compute-setup.sh" link="JanneMattila/aks-workshop/blob/main/03-compute-setup.sh" %}

{% include githubEmbed.html text="25-kubeconfig.sh" link="JanneMattila/aks-workshop/blob/main/25-kubeconfig.sh" %}
