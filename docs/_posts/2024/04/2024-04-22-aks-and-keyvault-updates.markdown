---
title: AKS and Key Vault updates
image: /assets/posts/2024/04/22/aks-and-keyvault-updates/keyvault.png
date: 2024-04-22 06:00:00 +0300
layout: posts
categories: azure
tags: azure appgw
---

{% include mermaid.html postfix="1" text="
sequenceDiagram
    actor User
    participant KeyVault
    participant App
    User->>KeyVault: Update key
    App->>KeyVault: Pull for updates<br/>e.g., every 5 minutes
" %}

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

App has to also monitor for file updates.

```bash
az aks addon update \
  -g $resource_group_name \
  -n $aks_name \
  -a azure-keyvault-secrets-provider \
  --enable-secret-rotation
```

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

```console
$ kubectl exec -it busybox-secrets-store-inline-wi -n secrets-app -- sh

$ cat /mnt/secrets-store/secret1
$ cat /mnt/secrets-volume/mysecret1
$ watch -n 1 cat /mnt/secrets-store/secret1 /mnt/secrets-volume/mysecret1
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/aks-and-keyvault-updates/keyvault.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/aks-and-keyvault-updates/newsecret.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/04/22/aks-and-keyvault-updates/events.png" %}

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

https://github.com/kubernetes-sigs/secrets-store-csi-driver/issues/298

TBA: Echo & Webhooks
