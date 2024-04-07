---
title: Using Key Vault with Azure Kubernetes Service
image: /assets/posts/2024/04/22/using-key-vault-with-aks/keyvault.png
date: 2024-04-22 06:00:00 +0300
layout: posts
categories: azure
tags: azure appgw
---

[Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/general/basic-concepts)
is a excellent service for storing your various secrets,   so that you don't have to store them in your code.

If you need to fetch those secrets from your application, then typically you follow this kind of pattern:

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
You can enable it when creating your AKS cluster:

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
- It's _add-on_ for AKS, which means that it's upgraded automatically when AKS is upgraded.
- It's does support polling for updates, with a configurable interval.

See more information about
[auto-rotation](https://learn.microsoft.com/en-us/azure/aks/csi-secrets-store-configuration-options#enable-and-disable-auto-rotation)
in the documentation.

Let's directly jump into the code and see how it works.
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
- `${aks_keyvault_client_id}` is the client ID of configured identity

At the bottom there is `secretObjects` section, which is optional.
If that is provided, then the secrets are _also_ stored in Kubernetes secrets.


```console
$ kubectl exec -it busybox-secrets-store-inline-wi -n secrets-app -- sh

$ cat /mnt/secrets-store/secret1
$ cat /mnt/secrets-volume/mysecret1
$ watch -n 1 cat /mnt/secrets-store/secret1 /mnt/secrets-volume/mysecret1
```

App has to also monitor for file updates.


_Click diagram to view in fullscreen_

{% include mermaid.html postfix="1" text="
sequenceDiagram
    actor User
    participant KeyVault
    participant AKS
    participant Secret
    participant App
    User->>KeyVault: Update key
    KeyVault->>Webhook: Push update
    AKS->>KeyVault: Pull for updates
    AKS->>App: Update secret
    AKS->>Secret: Update secret
    Secret->>App: Update secret
" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/using-key-vault-with-aks/keyvault.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/using-key-vault-with-aks/newsecret.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/using-key-vault-with-aks/events.png" %}

{% include dockerEmbed.html text="JanneMattila/echo" link="r/jannemattila/echo" %}

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

{% include githubEmbed.html text="kubernetes-sigs/secrets-store-csi-driver/issues/298" link="kubernetes-sigs/secrets-store-csi-driver/issues/298" %}

{% include githubEmbed.html text="JanneMattila/aks-workshop" link="JanneMattila/aks-workshop" %}

TBA: Echo & Webhooks

[Webhooks, Automation runbooks, Logic Apps as event handlers for Azure Event Grid events](https://learn.microsoft.com/en-us/azure/event-grid/handler-webhooks)

[Azure Key Vault as Event Grid source](https://learn.microsoft.com/en-us/azure/event-grid/event-schema-key-vault?tabs=cloud-event-schema)

[Monitoring Key Vault with Azure Event Grid](https://learn.microsoft.com/en-us/azure/key-vault/general/event-grid-overview)