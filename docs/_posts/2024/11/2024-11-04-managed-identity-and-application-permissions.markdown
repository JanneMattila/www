---
title: Managed identity and Application Permissions
image: /assets/share.png
date: 2024-11-04 06:00:00 +0300
layout: posts
categories: azure
tags: azure graph managed-identity application-permissions
---

Entra ID App registration and Application Permissions

This question pops up quite frequently: How do I use managed identity with application permissions?

https://learn.microsoft.com/en-us/graph/api/group-post-groups?view=graph-rest-1.0&tabs=http

[Entra ID Group automation with PowerShell]({% post_url 2024/02/2024-02-05-entra-id-group-automation %})

[Entra ID Group automation with PowerShell]({% post_url 2024/02/2024-02-05-entra-id-group-automation %})

https://techcommunity.microsoft.com/t5/azure-integration-services-blog/grant-graph-api-permission-to-managed-identity-object/ba-p/2792127

https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/grant-admin-consent?pivots=portal

https://learn.microsoft.com/en-us/graph/api/resources/approleassignment?view=graph-rest-1.0

https://learn.microsoft.com/en-us/graph/api/serviceprincipal-post-approleassignedto?view=graph-rest-1.0&tabs=http

```bash
identity_name="id-group-automation"
resource_group_name="rg-group-automation"
location="swedencentral"

az group create -l $location -n $resource_group_name -o table

identity_principal_json=$(az identity create \
  --name $identity_name \
  --resource-group $resource_group_name \
  -o json)

identity_principal_id=$(echo $identity_principal_json | jq -r .principalId)
identity_app_id=$(echo $identity_principal_json | jq -r .clientId)
echo $identity_principal_id
echo $identity_app_id

# Command format example

az rest --method get --url "https://graph.microsoft.com/v1.0/groups"
az rest --method get --url "https://graph.microsoft.com/v1.0/servicePrincipals/00000003-0000-0000-c000-000000000000/appRoleAssignedTo"
az rest --method get --url "https://graph.microsoft.com/v1.0/servicePrincipals/8f8e24bb-5694-49b1-b8b9-1ddbe696b43b"
az rest --method get --url "https://graph.microsoft.com/v1.0/servicePrincipals/(appId='$identity_app_id')/appRoleAssignedTo"
az rest --method get --url "https://graph.microsoft.com/v1.0/servicePrincipals/(appId='00000003-0000-0000-c000-000000000000')/appRoleAssignedTo"
az rest --method get --url "https://graph.microsoft.com/v1.0/servicePrincipals(appId='00000003-0000-0000-c000-000000000000')"
az rest --method get --url "https://graph.microsoft.com/v1.0/servicePrincipals/$identity_principal_id"

cat >body.json  <<EOF
{
 'principalId': '$identity_principal_id', 
 'resourceId': '00000003-0000-0000-c000-000000000000', 
 'appRoleId': '97235f07-e226-4f63-ace3-39588e11d3a1'
}
EOF

cat >body.json  <<EOF
{
 'principalId': '$identity_app_id', 
 'resourceId': '00000003-0000-0000-c000-000000000000', 
 'appRoleId': '97235f07-e226-4f63-ace3-39588e11d3a1'
}
EOF

cat body.json

az rest \
 --method post \
 --url "https://graph.microsoft.com/v1.0/servicePrincipals/$identity_principal_id/appRoleAssignedTo" \
  --body @body.json
  
  az rest \
 --method post \
 --url "https://graph.microsoft.com/v1.0/servicePrincipals/$identity_principal_id/appRoleAssignedTo" \
  --body @body.json

az rest \
 --method post \
 --url "https://graph.microsoft.com/v1.0/servicePrincipals(appId='00000003-0000-0000-c000-000000000000')/appRoleAssignedTo" \
  --body @body.json

echo ""


az rest --method post --url https://management.azure.com/subscriptions/<subscriptionId>/resourceGroups/<resourceGroup>/providers/Microsoft.ContainerRegistry/registries/<containerRegistryName>?api-version=2023-01-01-preview --body "{'location': '<locationName>', 'sku': {'name': '<skuName>'}, 'properties': {'adminUserEnabled': '<propertyValue>'}}"

```