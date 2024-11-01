---
title: "\"Action recommended: Begin managing public content with Artifact Cache\""
image: /assets/posts/2024/09/09/acr-artifact-cache/email.png
date: 2024-09-09 06:00:00 +0300
layout: posts
categories: azure
tags: azure acr acr-cache aks kubernetes docker-hub
---

If you're working with containers in Azure,  you've most likely received the following email:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/09/09/acr-artifact-cache/email.png" %}

Key point from the email is: "_if you use Docker Hub, you may be affected by Docker rate limiting_".
More information about the limits here:
[Docker Hub rate limit](https://docs.docker.com/docker-hub/download-rate-limit/)

So, what does this mean in practice?
When you build your own images which use base images from Docker Hub or
when you  deploy apps using images available from Docker Hub,
then you might get throttled.

Here are examples that you might see in your deployments:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/09/09/acr-artifact-cache/aci-deployment.png" %}

More detailed error message:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/09/09/acr-artifact-cache/aci-deployment2.png" %}

```json
{
 "code": "RegistryErrorResponse",
 "message": "An error response is received from the docker registry 'index.docker.io'. Please retry later."
}
```

Or deployment to AKS:

```console
$ kubectl apply -f network-app/deployment.yaml
deployment.apps/network-app-deployment created
$ kubectl get pod -n network-app
NAME                                      READY   STATUS             RESTARTS   AGE
network-app-deployment-78c68f74bf-2bmtx   0/1     ImagePullBackOff   0          11s
$ kubectl describe pod network-app-deployment-7f8f5c4f7b-7z5zv
...
Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  79s                default-scheduler  Successfully assigned network-app/network-app-deployment-78c68f74bf-2bmtx to aks-nodepool1-17464156-vmss000008
  Normal   Pulling    32s (x2 over 78s)  kubelet            Pulling image "jannemattila/webapp-network-tester:1.0.47"
  Warning  Failed     17s (x2 over 47s)  kubelet            Failed to pull image "jannemattila/webapp-network-tester:1.0.47": failed to pull and unpack image "docker.io/jannemattila/webapp-network-tester:1.0.47": failed to copy: httpReadSeeker: failed open: unexpected status code https://registry-1.docker.io/v2/jannemattila/webapp-network-tester/manifests/sha256:c866ebedc921ec29c7d94b11fdf6fbf4cbe65696afeb744dcc039e92fea5b4c8: 429 Too Many Requests - Server message: toomanyrequests: You have reached your pull rate limit. You may increase the limit by authenticating and upgrading: https://www.docker.com/increase-rate-limit
  Warning  Failed     17s (x2 over 47s)  kubelet            Error: ErrImagePull
  Normal   BackOff    6s (x2 over 46s)   kubelet            Back-off pulling image "jannemattila/webapp-network-tester:1.0.47"
  Warning  Failed     6s (x2 over 46s)   kubelet            Error: ImagePullBackOff
```

Most important detail from the above error message is:

> **429 Too Many Requests - Server message: toomanyrequests**:<br/>
> **You have reached your pull rate limit**. <br/>
> You may increase the limit by authenticating and upgrading:
> [https://www.docker.com/increase-rate-limit](https://www.docker.com/increase-rate-limit)

You can overcome the above issues by
[importing container images to Azure Container Registry (ACR)](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-import-images?tabs=azure-cli)
and use them from there:

```bash
az acr import \
 -n $acr_name \
 -t "docker/jannemattila/webapp-network-tester" \
 --source "docker.io/jannemattila/webapp-network-tester" 
```

_However_, this is a manual process, and you need to do this for each image you want to use.

An easier way to overcome the above challenges is to use ACR as a cache for pulling images from Docker Hub.
This feature is called [Artifact cache](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-artifact-cache).
With Artifact cache, ACR automatically fetches the image from Docker Hub when you try to pull it from ACR and stores it in the cache.
This allows you to avoid rate limiting issues and have more reliable deployments.

---

Let's see how to set up the Artifact cache. Starting point for our setup is empty ACR:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/09/09/acr-artifact-cache/acr-repositories.png" %}

We don't have any cache rules set up either:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/09/09/acr-artifact-cache/acr-cache.png" %}

Before we start creating a new cache rule, we need to understand the big picture:

1. We need to store Docker Hub credentials securely, therefore we need to create Key Vault
  - Create two new secrets into Key Vault: Docker Hub username and password
2. Create new credentials into ACR and use secrets from Key Vault.
  - Credentials will automatically get new system managed identity
  - You need to grant access to Key Vault for this new identity so that it can read secrets from it 
3. Create a new cache rule in ACR and use the configured credentials
  - Cache rule will define which images are fetched from Docker Hub and stored in the cache
4. Test by deploying workload using image from ACR

Let's start by creating Key Vault and secrets:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/09/09/acr-artifact-cache/kv.png" %}

Key Vault is using Azure RBAC as permission model:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/09/09/acr-artifact-cache/kv-access-model.png" %}

Next, I'll create credentials and reference the secrets from Key Vault:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/09/09/acr-artifact-cache/acr-credential-info.png" %}

Credentials creates a new system managed identity which I need to grant access to read the secrets from Key Vault:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/09/09/acr-artifact-cache/kv-access.png" %}

Finally, I'll create a new cache rule and use newly created credentials:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/09/09/acr-artifact-cache/acr-rule.png" %}

The above means that following thing happens:<br/>
If image is requested from ACR from path `docker/*` e.g.,  `docker/jannemattila/webapp-network-tester`,
then it will convert that request to `docker.io/jannemattila/webapp-network-tester` and fetch the image from Docker Hub
using the credentials provided earlier.

Now, I can test the setup by deploying a new workload to my AKS cluster:

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
        - image: $acr_loginserver/docker/jannemattila/webapp-network-tester:1.0.75
          name: network-app
          ports:
            - containerPort: 8080
              name: http
              protocol: TCP
```

Image of the workload is set to `$acr_loginserver/docker/jannemattila/webapp-network-tester:1.0.75`, so
ACR should fetch it from Docker Hub as configured in the cache rule.

After successful deployment, I can see the image in the ACR:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/09/09/acr-artifact-cache/acr-repositories2.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/09/09/acr-artifact-cache/acr-repositories3.png" %}

And I can see the cache rule is also showing green status:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/09/09/acr-artifact-cache/rule-green.png" %}

Similarly, credential set is showing healthy status:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/09/09/acr-artifact-cache/acr-credential-set.png" %}

In case you have problems setting up the Artifact cache, you can find more information from the following resources:
[Troubleshoot guide for Artifact cache](https://learn.microsoft.com/en-us/azure/container-registry/troubleshoot-artifact-cache)

# Conclusion

Using ACR as a cache for Docker Hub images is a great way to
avoid rate limiting issues and have more reliable deployments.

Docker Hub rate limits are not low, but we all know that you hit them
when you least expect it. Therefore, it's a good idea to prepare for them in advance.

Hopefully, I managed to explain the setup process clearly
so you can start using the Artifact cache in your own environments.
