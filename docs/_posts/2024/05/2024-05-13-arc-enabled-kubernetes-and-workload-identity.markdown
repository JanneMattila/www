---
title: Arc-enabled Kubernetes and Workload Identity
image: /assets/posts/2024/05/13/arc-enabled-kubernetes-and-workload-identity/job1.png
date: 2024-05-13 06:00:00 +0300
layout: posts
categories: azure
tags: azure arc kubernetes identity
---

[Azure AD Workload Identity](https://azure.github.io/azure-workload-identity/docs/)

Here are the high-level steps for our deployment:

1. Create a managed identity
   - Assign the managed identity to reader access to the subscription
2. Create required signing keys
   - Create Storage Account and Blob Container
   - Generate a RSA key pair
   - Create a well-known endpoint for OIDC configuration
   - Create a JWKS endpoint for OIDC configuration
3. Create a Azure Arc-enabled Kubernetes cluster
4. Create a Kubernetes service account
5. Deploy a workload that uses the service account

## 1. Create a managed identity

```bash
identity_json=$(az identity create --name $app_identity_name --resource-group $resource_group_name -o json)
client_id=$(echo $identity_json | jq -r .clientId)
principal_id=$(echo $identity_json | jq -r .principalId)
echo $client_id
echo $principal_id

subscription_id=$(az account show --query id -o tsv)

# Grant reader access to identity to subscription
az role assignment create \
 --assignee-object-id $principal_id \
 --assignee-principal-type ServicePrincipal \
 --scope /subscriptions/$subscription_id \
 --role "Reader"
```

## 2. Create required signing keys

```bash
openssl genrsa -out sa.key 2048
openssl rsa -in sa.key -pubout -out sa.pub
```

```bash
curl -s "https://${storage_name}.blob.core.windows.net/${container_name}/.well-known/openid-configuration"
```

Output:

```json
{
  "issuer": "https://arck8s0000000010.blob.core.windows.net/oidc/",
  "jwks_uri": "https://arck8s0000000010.blob.core.windows.net/oidc/openid/v1/jwks",
  "response_types_supported": [
    "id_token"
  ],
  "subject_types_supported": [
    "public"
  ],
  "id_token_signing_alg_values_supported": [
    "RS256"
  ]
}
```

```bash
curl -s "https://${storage_name}.blob.core.windows.net/${container_name}/openid/v1/jwks"
```

Output:

```json
{
  "keys": [
    {
      "use": "sig",
      "kty": "RSA",
      "kid": "L2ugCzm68GebOnJR4dW9zicM8H2ixnjkyrFnurkQCYo",
      "alg": "RS256",
      "n": "yUJgjFBfnc...wQ",
      "e": "AQAB"
    }
  ]
}
```

## 3. Create a Azure Arc-enabled Kubernetes cluster

```bash
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.22.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

## 4. Create a Kubernetes service account

## 5. Deploy a workload that uses the service account

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/13/arc-enabled-kubernetes-and-workload-identity/arc1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/13/arc-enabled-kubernetes-and-workload-identity/arc2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/13/arc-enabled-kubernetes-and-workload-identity/jwt.png" %}

## Conclusion

In this post, we have seen how to use Azure AD Workload Identity
with Azure Arc-enabled Kubernetes. We have created a managed identity,
created required signing keys, created a Azure Arc-enabled Kubernetes cluster,
created a Kubernetes service account, and deployed a workload that uses the service account.

This is a powerful feature that allows you to use managed identities
for your workload and you don't have to manage any secrets (except for the signing keys of course).

I hope you find this useful!
