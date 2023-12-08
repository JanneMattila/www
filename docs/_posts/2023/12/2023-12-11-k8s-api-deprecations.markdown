---
layout: posts
title:  "Don't fall behind the Kubernetes changes"
image: /assets/posts/2023/12/11/k8s-api-deprecations/http-paths.png
date:   2023-12-11 06:00:00 +0300
categories: kubernetes
tags: kubernetes azure aks
---
It's fair to say that Kubernetes evolves very fast. In order to understand how fast,
I highly recommend that you read 
[Kubernetes release cycle](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-release/release.md#the-release-cycle).
In summary:

- ~3 releases per year
- 3 most recent minor versions are supported at a time

From that you can directly jump to [Azure Kubernetes Service (AKS) Kubernetes Release Calendar](https://docs.microsoft.com/en-us/azure/aks/supported-kubernetes-versions?tabs=azure-cli#aks-kubernetes-release-calendar)
to see the timelines for different Kubernetes versions and their support in AKS.
And next to it, you'll also find [AKS Components Breaking Changes by Version](https://learn.microsoft.com/en-us/azure/aks/supported-kubernetes-versions?tabs=azure-cli#aks-components-breaking-changes-by-version).

The above just means that you should be prepared to upgrade your Kubernetes clusters 
_at least once per year_ you should be prepared for the changes that come with it.

---

_What kind of changes are we then talking about that might impact you?_

[Kubernetes](https://kubernetes.io/) has good documentation about how they evolve
Kubernetes to support new experimental features and at the same time they
might remove some of the old features to enable fast development also in the future.
At the end of the day, if you carry over old features from release to another,
it will slow down the pace of new features and innovation.

You can read more about that here:

[Kubernetes Deprecation Policy](https://kubernetes.io/docs/reference/using-api/deprecation-policy/)

Since evolving the API is so important, you should understand which APIs
are going to be removed in which version. This is documented here:

[Kubernetes Deprecated API Migration Guide](https://kubernetes.io/docs/reference/using-api/deprecation-guide/)

To make this API deprecation more concrete, 
I’m going to focus on that topic in this blog post.
Given the above, I think a better title for this post would be:

## Don't fall behind the Kubernetes <u>API</u> changes

I hope we can agree that Kubernetes is evolving very fast and that
it's an API-driven system in the background. 

_However_, many people do not think their Kubernetes API usage, since they are using
`kubectl` to interact with their Kubernetes clusters.
In the background, `kubectl` is using Rest API to interact with the Kubernetes API server.

Let me try to give you two concrete examples, how you can test and learn more about this yourself.

### VS Code + REST Client extension + Docker Desktop

First, let's use [Docker Desktop](https://www.docker.com/products/docker-desktop/) Kubernetes cluster
for our testing. We'll use [Visual Studio Code](https://code.visualstudio.com/)
and [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension
to play with Kubernetes API.

In order to successfully interact with Kubernetes API, you need to have
proper credentials to access the API. In this case, we'll extract those from
`kubectl` configuration and use those in our `REST Client` extension.

Here is `PowerShell` example to pull these information out and then creating `rest-client.certificates` configuration:

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

code . # Open VS Code in current folder
```

Next, we'll create `k8s.http` file to interact with Kubernetes API:

```powershell
@endpoint = https://kubernetes.docker.internal:6443

### Fetch paths
GET {{endpoint}}/ HTTP/1.1
Content-Type: application/json; charset=utf-8

### Fetch namespace list
GET {{endpoint}}/api/v1/namespaces HTTP/1.1
Content-Type: application/json; charset=utf-8
```

If we now run the first command, this is what we get:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/12/11/k8s-api-deprecations/http-paths.png" %}

If we fetch the list of namespaces (=`kubectl get namespaces`), we get this:
{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/12/11/k8s-api-deprecations/http-ns.png" %}

If we now want to create a new namespace, we can do that with this command:

```powershell
### Create namespace "shiny"
POST {{endpoint}}/api/v1/namespaces HTTP/1.1
Content-Type: application/json; charset=utf-8

{
  "metadata": {
    "name": "shiny"
  }
}
```

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/12/11/k8s-api-deprecations/http-shiny.png" %}

Above example maps 1:1 to YAML file that you would use with `kubectl`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: shiny
```

`apiVersion` in the file is mapped to the url path `v1` and `kind` is mapped to `namespaces`.
`kubectl` just converts this YAML to JSON and sends it to the Kubernetes API server.

So it's clear that Kubernetes API is just a REST API and you can interact with it using
any tool that can send HTTP requests.

This does bring us to the API Deprecation example. 
Let's take example from `1.16` timeframe:

[Deprecated APIs Removed In 1.16: Here’s What You Need To Know](https://kubernetes.io/blog/2019/07/18/api-deprecations-in-1-16/)

> The **v1.16** release will stop serving the following deprecated API versions 
> in favor of newer and more stable API versions:
> ...
> - Deployment in the **extensions/v1beta1**, **apps/v1beta1**, and **apps/v1beta2** API versions is no longer served
>   - Migrate to use the **apps/v1** API version, available since v1.9.

If you still had YAML files referring to those old and removed APIs like this:

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: my-deployment
# ...
```

Technically, the above does map to this API endpoint:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/12/11/k8s-api-deprecations/http-404.png" %}

Of course, `kubectl` would give your more detailed error message:

```bash
error: resource mapping not found for name: "my-deployment" namespace: "demo-ns" from "demo.yaml":
no matches for kind "Deployment" in version "extensions/v1beta1"
ensure CRDs are installed first
```

Above would be easy to troubleshoot and understand, but what if you 
installed this via [Helm](https://helm.sh/) or some other mechanism and you would not know what is the exact YAML file causing these issue. You might have to spend a significant amount of time to troubleshoot and fix the issue.

Luckily, many Kubernetes foundational elements and their APIs are generally available and stable,
so this should not happen so easily. 
However, if you are using some of the more experimental or beta features,
then be prepared for these kinds of changes.

Here are some example APIs that people have been using quite extensively even though they were still in beta:

- [1.26](https://kubernetes.io/docs/reference/using-api/deprecation-guide/#v1-26) and `HorizontalPodAutoscaler` **autoscaling/v2beta2** API Version
- [1.22](https://kubernetes.io/docs/reference/using-api/deprecation-guide/#v1-22) and `Ingress` and 
**extensions/v1beta1** and **networking.k8s.io/v1beta1** API Versions

---

Longer version of the above `k8s.http` file can be found here:

{% include githubEmbed.html text="k8s.http" link="JanneMattila/api-examples/blob/master/others/k8s.http" %}

That same repository contains API examples that you might find interesting:

{% include githubEmbed.html text="JanneMattila/api-examples" link="JanneMattila/api-examples" %}

<br/>

### Bash + Curl + AKS API server

Here is another example but this time with `Bash` and using AKS API server.

First, create your AKS cluster like this:

```bash
aks_json=$(az aks create --resource-group $resource_group_name -n $aks_name \
 --enable-aad \
 # ....abbreviated but details in link below
  -o json)
aks_api_server=$(echo $aks_json | jq -r .azurePortalFqdn)
```

You can also see API server directly in AKS Overview:

{% include imageEmbed.html link="/assets/posts/2023/12/11/k8s-api-deprecations/aks.png" %}

Then you can get access token to AKS API server by using `6dae42f8-4368-4678-94ff-3960e28e3630`
as the target resource:

```bash
# "Azure Kubernetes Service AAD Server"
# Search "6dae42f8-4368-4678-94ff-3960e28e3630" from Entra ID
aks_api_server_accesstoken=$(az account get-access-token --resource "6dae42f8-4368-4678-94ff-3960e28e3630" --query accessToken -o tsv)

# Study this access token in https://jwt.ms
echo $aks_api_server_accesstoken
echo $aks_api_server
```

You can find the above Enterprise Application in Entra ID:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2023/12/11/k8s-api-deprecations/entra-k8s.png" %}

Now you can test against AKS API server:

```bash
curl -H "Authorization: Bearer $aks_api_server_accesstoken" https://$aks_api_server/
```

```json
{
  "paths": [
    "/.well-known/openid-configuration",
    "/api",
    "/api/v1",
    "/apis",
    "/apis/",
    "/apis/admissionregistration.k8s.io",
    // abbreviated
    "/readyz/shutdown",
    "/version"
  ]
}
```

Fetch version information:

```bash
curl -H "Authorization: Bearer $aks_api_server_accesstoken" https://$aks_api_server/version
```

```json
{
  "major": "1",
  "minor": "25",
  "gitVersion": "v1.25.11",
  "gitCommit": "504ecd04507e7ae7e57f0ce186390097c8d76ed5",
  "gitTreeState": "clean",
  "buildDate": "2023-10-09T14:44:32Z",
  "goVersion": "go1.19.10",
  "compiler": "gc",
  "platform": "linux/amd64"
}
```

Here are some other examples:

```bash
curl -H "Authorization: Bearer $aks_api_server_accesstoken" https://$aks_api_server/livez
curl -H "Authorization: Bearer $aks_api_server_accesstoken" https://$aks_api_server/healthz

curl -H "Authorization: Bearer $aks_api_server_accesstoken" https://$aks_api_server/api/v1/nodes
curl -H "Authorization: Bearer $aks_api_server_accesstoken" https://$aks_api_server/api/v1/namespaces
```

AKS setup example can be found here:

{% include githubEmbed.html text="03-compute-setup.sh" link="JanneMattila/aks-workshop/blob/main/03-compute-setup.sh" %}

More examples of `curl` and AKS API server usage can be found here:

{% include githubEmbed.html text="25-kubeconfig.sh" link="JanneMattila/aks-workshop/blob/main/25-kubeconfig.sh" %}

You can use `kubectl` to see what kind of APIs are available:

```bash
kubectl api-versions
```

Here is an example output:

```bash
admissionregistration.k8s.io/v1
apiextensions.k8s.io/v1
apiregistration.k8s.io/v1
apps/v1
# abbreviated
expansion.gatekeeper.sh/v1alpha1
expansion.gatekeeper.sh/v1beta1
flowcontrol.apiserver.k8s.io/v1beta1
flowcontrol.apiserver.k8s.io/v1beta2
metrics.k8s.io/v1beta1
# abbreviated
snapshot.storage.k8s.io/v1beta1
status.gatekeeper.sh/v1beta1
storage.k8s.io/v1
storage.k8s.io/v1beta1
templates.gatekeeper.sh/v1
templates.gatekeeper.sh/v1alpha1
templates.gatekeeper.sh/v1beta1
v1
```

Notice that there are quite a lot of `v1alpha1` and `v1beta1` APIs available.

You can use `explain` command to describe fields and structure of various resources:

```bash
kubectl explain deployments --api-version=extensions/v1beta1
```

Outputs:

```text
error: couldn't find resource for "extensions/v1beta1, Resource=deployments"
```

Here is an example with available API version:

```bash
kubectl explain deployments --api-version=apps/v1
```

Outputs:

```bash
GROUP:      apps
KIND:       Deployment
VERSION:    v1

DESCRIPTION:
    Deployment enables declarative updates for Pods and ReplicaSets.
    
# ...abbreviated
```

You can use `Diagnose and solve problems` in AKS resource to see if 
it has detected any deprecated APIs in use:

{% include imageEmbed.html link="/assets/posts/2023/12/11/k8s-api-deprecations/aks-diagnose1.png" %}

{% include imageEmbed.html link="/assets/posts/2023/12/11/k8s-api-deprecations/aks-diagnose2.png" %}

Hopefully you'll see this text:

> No usage of deprecated or soon to be deprecated APIs was found during the detection period

To further help you, AKS has support for stopping upgrade if deprecated APIs are in use.
See more details from here:

[Stop Azure Kubernetes Service (AKS) cluster upgrades automatically on API breaking changes](https://learn.microsoft.com/en-us/azure/aks/stop-cluster-upgrade-api-breaking-changes)

### What about `kubectl` version then?

So far, I have been highlighting that you should be aware of the Kubernetes API changes.
However, the same thing applies to `kubectl` version as well.

There is document describing [version Skew Policy](https://kubernetes.io/releases/version-skew-policy/)
between various Kubernetes components. For `kubectl` it says:

> kubectl<br/>
> kubectl is supported within one minor version (older or newer) of kube-apiserver.

So, if you are using `kubectl` version e.g., `1.12` and your Kubernetes cluster is `1.25`,
then you might not have all the capabilities available in `kubectl` that you would have
in `1.25` version. 
And as I showed above, since it's just a REST API Client, then you might not even notice
if something is not working as expected. 

**This has happened with real customers!** It's quite confusing if you expect something
to happen but it doesn't and you don't see any error messages.

Therefore, as a reminder for myself, I have this in my deployment scripts:

```bash
sudo az aks install-cli
```

That ensures that I have the latest `kubectl` version in use when
working with AKS.

## Conclusion

Create yourself a strategy to keep up with the Kubernetes versions.
Plan and design how and when you do upgrades. **Do not** let it be one of those things
that you "_do when you have time_".

Technically you need to upgrade your Kubernetes clusters at least once per year,
but if that's the only time you do it, then you might be a bit rusty with the process.
Also, if your upgrade is delayed for some reason, then you might be in a situation
where you start to fall out of support.

You can enable [auto-upgrades](https://learn.microsoft.com/en-us/azure/aks/auto-upgrade-cluster) for your Kubernetes clusters, but be careful with your API usage as shown above.
You should still have a plan and testing process in place to ensure that your
applications are working as expected after the upgrade.

Jumping multiple versions also makes it tricky to understand what has changed.
Updating all the deployed extensions and Helm charts at the same time can be
quite a daunting task.

People also change roles and jobs, so you might not have the same people
available to do the upgrade as you had when you did the previous upgrade.
But it does help if you have documented the process and all the assets
available in your source control.

I hope you find this useful!
