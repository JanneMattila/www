---
layout: posts
title:  "Don't fall behind the Kubernetes changes"
image: /assets/posts/2023/12/11/k8s-api-deprecations/archive-data-retrieval.png
date:   2023-12-11 06:00:00 +0300
categories: kubernetes
tags: kubernetes azure 
---
<!--
- K8s & Docker desktop local API, Deprecations
  - If you use old kubectl, then you might not have those capabilities introduced in newer versions
  - It doesn't necessarily mean that you get error message
-->

It's fair to say that Kubernetes evolves very fast. In order to understand how fast,
I highly recommend that you read 
[Kubernetes release cycle](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-release/release.md#the-release-cycle).
In summary:

- ~3 releases per year
- 3 most recent minor versions are supported at a time

From that you can directly jump to [Azure Kubernetes Service (AKS) Kubernetes Release Calendar](https://docs.microsoft.com/en-us/azure/aks/supported-kubernetes-versions?tabs=azure-cli#aks-kubernetes-release-calendar)
to see the timelines for different Kubernetes versions.
And next to it, you'll also find [AKS Components Breaking Changes by Version](https://learn.microsoft.com/en-us/azure/aks/supported-kubernetes-versions?tabs=azure-cli#aks-components-breaking-changes-by-version).

Above just means, that you should be prepared to update your Kubernetes and
prepare for the changes that come with it.

---

_What kind of changes are we then talking about that might impact you?_

[Kubernetes](https://kubernetes.io/) has good documentation about how they evolve
Kubernetes API to support new experimental features and at the same time they
might remove some of the old features to enable fast development also in the future.
At the end of the day, the more old stuff you carry over, the more energy it will take
from you in the development which would slow down the innovation.

You can read more about that in here:

[Kubernetes Deprecation Policy](https://kubernetes.io/docs/reference/using-api/deprecation-policy/)

Since evolving the API is so important, you should understand which APIs
are going to be removed in which version. This is documented in here:

[Kubernetes Deprecated API Migration Guide](https://kubernetes.io/docs/reference/using-api/deprecation-guide/)

To make this API depreciation more concrete, 
I'm going to now only focus to that topic in this blog post. 
Given the above, I think better title for this post would be:

## Don't fall behind the Kubernetes <u>API</u> changes

Above you've learned that Kubernetes is evolving fast and that
it's API-driven system in the background. 

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

```PowerShell
kubectl api-versions

kubectl explain deployment.v1beta1
```
<!-- 
AKS API deprecated versions check
-->

{% include githubEmbed.html text="JanneMattila/kubernetes-notes" link="JanneMattila/kubernetes-notes" %}

## Summary

Create yourself a strategy to keep up with the Kubernetes versions.
