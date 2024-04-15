---
title: Utilizing Key Vault in Azure Kubernetes Service
image: /assets/posts/2024/04/22/utilizing-key-vault-in-aks/keyvault.png
date: 2024-04-22 06:00:00 +0300
layout: posts
categories: azure
tags: azure keyvault aks
---

[Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/general/basic-concepts)
is a excellent service for storing your various secrets,
so that you don't have to store them in your code.

If you would have to implement Key Vault integration yourself, then very like you would have to follow this kind of pattern:

{% include mermaid.html postfix="1" text="
sequenceDiagram
    actor User
    participant KeyVault
    participant App
    User->>KeyVault: Update key
    App->>KeyVault: Pull for updates<br/>e.g., every 5 minutes
" %}

Luckily, there are many ready-made integrations available for Azure services, such as:
[Use Key Vault references as app settings in Azure App Service and Azure Functions](https://learn.microsoft.com/en-us/azure/app-service/app-service-key-vault-references).
Similarly, there is a such integration for 
[Azure Kubernetes Service (AKS)](https://learn.microsoft.com/en-us/azure/aks/intro-kubernetes)
and in this post we'll play around with it.

[Azure Key Vault provider for Secrets Store CSI Driver](https://learn.microsoft.com/en-us/azure/aks/csi-secrets-store-driver)
is the key enabler for this integration.
You can enable it when creating your AKS cluster or enable it later on:

```bash
az aks create -g $resource_group_name -n $aks_name \
 # Enable the Key Vault provider for Secrets Store CSI Driver
 --enable-addons azure-keyvault-secrets-provider \
 --enable-oidc-issuer \
 --enable-workload-identity \
 # Enable auto rotation of secrets
 --enable-secret-rotation \
 # Poll interval for secret rotation
 --rotation-poll-interval 2m \
 # ...
```

Couple of things to note here:

- It's [add-on](https://learn.microsoft.com/en-us/azure/aks/integrations#add-ons) for AKS, which means that it's upgraded automatically when AKS is upgraded
- It's does support polling for updates, with a configurable interval

See more information about
[auto-rotation](https://learn.microsoft.com/en-us/azure/aks/csi-secrets-store-configuration-options#enable-and-disable-auto-rotation)
in the documentation.

Let's directly jump into the code and see how it works.
I have created the following Key Vault with a secret in it:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/utilizing-key-vault-in-aks/keyvault.png" %}

To start using the Secrets Store CSI Driver, you need to create a _SecretProviderClass_:

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: azure-keyvault-wi
  namespace: secrets-app
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"
    clientID: "${aks_keyvault_client_id}"
    keyvaultName: ${keyvault_name}
    objects: |
      array:
        - |
          objectName: secret1
          objectType: secret
          objectVersion: ""
    tenantId: "${tenant_id}"
  # These are optional. If not provided, then no K8s secret will be created.
  # OPTIONAL->
  secretObjects:
  - data:
    - key: mysecret1
      objectName: secret1
    secretName: app-secret
    type: Opaque
  # <-OPTIONAL
```

There are plenty of details there but main points are:

- `${keyvault_name}` is the name of your Key Vault
- `${aks_keyvault_client_id}` is the client ID of configured identity for connecting to Key Vault

At the bottom there is `secretObjects` section, which is _optional_.
If that is provided, then the secrets are _also_ stored as Kubernetes secrets.

**Note**: Details of the identity setup are in the GitHub repository linked at the end of this post.
Primary point of this post is to show the delays in secret updates and not the identity setup.

Let's first deploy the above **without** the optional `secretObjects` section.
Here is our pod deployment:

```yaml
kind: Pod
apiVersion: v1
metadata:
  name: busybox-secrets-store-inline-wi
  namespace: secrets-app
  labels:
    azure.workload.identity/use: "true"
spec:
  serviceAccountName: "${keyvault_service_account_name}"
  containers:
    - name: busybox
      image: registry.k8s.io/e2e-test-images/busybox:1.29-4
      command:
        - "/bin/sleep"
        - "10000"
      volumeMounts:
      - name: secrets-store
        mountPath: "/mnt/secrets-store"
        readOnly: true
  volumes:
    - name: secrets-store
      csi:
        driver: secrets-store.csi.k8s.io
        readOnly: true
        volumeAttributes:
          secretProviderClass: "azure-keyvault-wi"
```

If we deploy this, there won't be any Kubernetes secrets created:

```console
$ kubectl get secret -n secrets-app
No resources found in secrets-app namespace.
```

Let's check the secret inside the pod:

```console
$ kubectl exec -it busybox-secrets-store-inline-wi -n secrets-app -- sh
/ # cat /mnt/secrets-store/secret1
This is new value
/ # watch -n 1 cat /mnt/secrets-store/secret1
```

In the above command, we started watching the secret file for changes:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/utilizing-key-vault-in-aks/scenario1-watch1.png" %}

In the background, I'll update the secret to the Key Vault.

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/utilizing-key-vault-in-aks/newsecret.png" %}

After a while, the secret is updated in the pod:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/utilizing-key-vault-in-aks/scenario1-watch2.png" %}

It takes at maximum the `rotation-poll-interval` time to update the secret in the pod.
So, you should get that value reflected in less than 2 minutes (which is the default rotation poll interval).

You can also see this from the Key Vault audit logs:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/utilizing-key-vault-in-aks/logs.png" %}

Follow-up question is: What if you deploy second pod... will you have twice as much `SecretGet` operations? 🤔

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/utilizing-key-vault-in-aks/logs2.png" %}

As you can see, the answer is yes since you can see two different
2 minute intervals in the logs.

---

For our second test, let's deploy the above _SecretProviderClass_ **with** the `secretObjects` section.
Here is our updated pod deployment:

```yaml
kind: Pod
apiVersion: v1
metadata:
  name: busybox-secrets-store-inline-wi
  namespace: secrets-app
  labels:
    azure.workload.identity/use: "true"
spec:
  serviceAccountName: "${keyvault_service_account_name}"
  containers:
    - name: busybox
      image: registry.k8s.io/e2e-test-images/busybox:1.29-4
      command:
        - "/bin/sleep"
        - "10000"
      volumeMounts:
      - name: secrets-store
        mountPath: "/mnt/secrets-store"
        readOnly: true
      - name: secret-volume
        mountPath: "/mnt/secrets-volume"
        readOnly: true
  volumes:
    - name: secrets-store
      csi:
        driver: secrets-store.csi.k8s.io
        readOnly: true
        volumeAttributes:
          secretProviderClass: "azure-keyvault-wi"
    - name: secret-volume
      secret:
        secretName: app-secret
```

Notice the new `secret-volume` volume mount, which is using Kubernetes secret created by our deployed _SecretProviderClass_.
If we now check the secrets:

```console
$ kubectl get secret -n secrets-app
NAME                              READY   STATUS    RESTARTS   AGE
busybox-secrets-store-inline-wi   1/1     Running   0          66s
```

Indeed, the secret is created as we expected.
Now, let's check those two secrets inside the pod:

```console
$ kubectl exec -it busybox-secrets-store-inline-wi -n secrets-app -- sh
/ # cat /mnt/secrets-store/secret1
Even newer value
/ # cat /mnt/secrets-volume/mysecret1
Even newer value
```

Both of the values match as expected.
Let's start the watch for those two files:

```console
/ # watch -n 1 cat /mnt/secrets-store/secret1 /mnt/secrets-volume/mysecret1
```

Watching the files:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/utilizing-key-vault-in-aks/scenario2-watch1.png" %}

After updating the secret in the Key Vault, the secret store specific file is updated:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/utilizing-key-vault-in-aks/scenario2-watch2.png" %}

And the Kubernetes secret is updated after that:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/utilizing-key-vault-in-aks/scenario2-watch3.png" %}

But as you can see, in the above test, time difference between these two  updates was ~1 minute.

The above can be illustrated using the following diagram:

_Click diagram to view in fullscreen_

{% include mermaid.html postfix="2" text="
sequenceDiagram
    actor User
    participant KeyVault
    participant AKS
    participant Secret
    participant App
    User->>KeyVault: Update key
    AKS->>KeyVault: Pull for updates
    AKS->>App: Update secret
    AKS->>Secret: Update secret
    Secret->>App: Update secret
" %}

From [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/#:~:text=As%20a%20result%2C%20the%20total%20delay%20from%20the%20moment%20when%20the%20Secret%20is%20updated%20to%20the%20moment%20when%20new%20keys%20are%20projected%20to%20the%20Pod%20can%20be%20as%20long%20as%20the%20kubelet%20sync%20period%20%2B%20cache%20propagation%20delay) documentation:

> As a result, the total delay from the moment when the Secret is updated to the moment when new keys
> are projected to the Pod **can be as long as the kubelet sync period + cache propagation delay**

There is good blog post do describe this in more detail:
[Why Kubernetes secrets take so long to update?](https://ahmet.im/blog/kubernetes-secret-volumes-delay/)

### Your responsibility

In the above tests, we were focusing on how the AKS fetches the secrets from the Key Vault
and they landed into volumes as files.

After that it's up to the application to take responsibility:

> The application **needs to watch for the file changes**
> from the volume mounted by the CSI driver
> and update itself accordingly.

The follow-up questions are:

- Did you plan for this in your application?
- Are you using **environment variables** for managing your variables and secrets?
- Does you application framework support this kind of dynamic updates to configuration files?

[Environment variables](https://learn.microsoft.com/en-us/azure/aks/csi-secrets-store-configuration-options#enable-and-disable-auto-rotation:~:text=Use%20the%20Kubernetes%20Secret%20for%20an%20environment%20variable)
are tricky in the sense that they don't update while the process is running
and then you need to resort to some kind of trick to update them e.g., [Reloader](https://github.com/stakater/Reloader).

_Btw_... there is also interesting discussion about
"_Don't rely on pod creation to mount to Kubernetes secrets_" in the following GitHub issue:

{% include githubEmbed.html text="kubernetes-sigs/secrets-store-csi-driver/issues/298" link="kubernetes-sigs/secrets-store-csi-driver/issues/298" %}

## Alternative solution: Key Vault events

Alternatively, you can use Key Vault events to trigger updates to your application:

{% include mermaid.html postfix="3" text="
sequenceDiagram
    actor User
    participant KeyVault
    User->>KeyVault: Update key
    KeyVault->>Webhook: Push update
" %}

Setting then up can be done from the Azure Portal:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/utilizing-key-vault-in-aks/events.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/utilizing-key-vault-in-aks/subscription1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/utilizing-key-vault-in-aks/subscription2.png" %}

To use webhooks, you need to have a service that listens for the events.
I have created a simple echo service for this purpose and it's available in Docker Hub:

{% include dockerEmbed.html text="JanneMattila/echo" link="r/jannemattila/echo" %}

If you want to implement your own webhook service, then you can use the following code as a starting point:

{% include githubEmbed.html text="JanneMattila/Echo/EchoController" link="JanneMattila/Echo/blob/1c778672c8b1ea836a8db8be85394b2b40b5bac9/src/Echo/Controllers/EchoController.cs#L63-L71" %}

Key Vault updates the webhook right after the secret is updated:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/utilizing-key-vault-in-aks/keyvaulttoecho.gif" %}

You can see the update reflected to the right-hand side tab in the browser showing `Echo: 1` after the secret is updated.

Here is example of the event in [CloudEvents](https://cloudevents.io/) format that is sent to the webhook:

```json
{
  "id": "0a09caf8-8056-4a4b-9de4-4452cf7ad05b",
  "source": "/subscriptions/0afdd038-221b-4938-8564-5c62d1399393/resourceGroups/rg-aks/providers/Microsoft.KeyVault/vaults/kvjanne1234567890",
  "specversion": "1.0",
  "type": "Microsoft.KeyVault.SecretNewVersionCreated",
  "subject": "secret1",
  "time": "2024-04-01T16:21:21.2932321Z",
  "data": {
    "Id": "https://kvjanne1234567890.vault.azure.net/secrets/secret1/0c7751761b5a4ca09f3deec5fba4af83",
    "VaultName": "kvjanne1234567890",
    "ObjectType": "Secret",
    "ObjectName": "secret1",
    "Version": "0c7751761b5a4ca09f3deec5fba4af83",
    "NBF": null,
    "EXP": null
  }
}
```

Here are additional resources to get you started:

[Webhooks, Automation runbooks, Logic Apps as event handlers for Azure Event Grid events](https://learn.microsoft.com/en-us/azure/event-grid/handler-webhooks)

[Azure Key Vault as Event Grid source](https://learn.microsoft.com/en-us/azure/event-grid/event-schema-key-vault?tabs=cloud-event-schema)

[Monitoring Key Vault with Azure Event Grid](https://learn.microsoft.com/en-us/azure/key-vault/general/event-grid-overview)

Implementing this kind of solution is more complex you need to roll up your sleeves and start coding to get it implemented.

## Conclusion

In this post, we saw how to utilize Azure Key Vault in Azure Kubernetes Service.
We also saw that updates are not instant and you need to understand how the system works.

The longer version of the code is available in the GitHub repository:

{% include githubEmbed.html text="JanneMattila/aks-workshop" link="JanneMattila/aks-workshop" %}

I hope you find this useful!
