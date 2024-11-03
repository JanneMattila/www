---
title: Managed identities, Application Permissions and Entra ID automations
image: /assets/posts/2024/11/04/managed-identity-and-application-permissions/application-permissions.png
date: 2024-11-04 06:00:00 +0300
layout: posts
categories: azure
tags: azure graph managed-identity application-permissions
---

I have previously blogged about various Azure and Entra ID automation topics
e.g., 
[Automating maintenance tasks with Azure Functions and PowerShell]({% post_url 2023/10/2023-10-30-automating-maintenance-tasks-part1 %}),
[Entra ID Group automation with PowerShell]({% post_url 2024/02/2024-02-05-entra-id-group-automation %}),
and
[Automations with Azure Pipelines or GitHub Actions]({% post_url 2024/05/2024-05-27-automations-with-azure-pipelines-or-github-actions %}).

Typically, when you start working on these automations, you need to create a new app registration in Entra ID and assign it the necessary permissions based on your scenario.
So, you end up into this Entra ID view:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/application-permissions.png" %}

Since we would be looking to do some kind of background processing, we would need to select the following permissions:

> **Application permissions**<br/>
> Your application runs as a background service or daemon without a signed-in user.

Let's try to cover the following implementation scenario:

- Automation to create **a new group** in Entra ID
- Simple incoming data to define the group information and members
- The group will **only have users as members**
- Automation is implemented using PowerShell and Microsoft Graph API

I would start by adding the necessary permissions to the app registration in Entra ID. 
First, I would need to add the following permission to be able to create a new group:
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/group-create-permission.png" %}

Second, I would need to add the following permission to be able to read the basic information of the users:
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/user-readbasic-all-permission.png" %}

Here are the permissions that I've added:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/permissions.png" %}

Since the above permissions are _application permissions_, they require admin consent:

{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/admin-consent.png" %}

Now, I can test my automation script to create a new group in Entra ID.
I'll 
[Login with a service principal](https://learn.microsoft.com/en-us/powershell/azure/authenticate-noninteractive?view=azps-12.4.0#login-with-a-service-principal),
I've created using the above configuration.

```powershell
$clientId = "<put your client id here>"
$clientSecret = "<put your client secret here>"
$tenantId = "<put your tenant id here>"

$clientPassword = ConvertTo-SecureString $clientSecret -AsPlainText -Force
$credentials = New-Object System.Management.Automation.PSCredential($clientID, $clientPassword)
Connect-AzAccount -ServicePrincipal -Credential $credentials -TenantId $tenantId
```

After the login, I can execute my script to create a new group in Entra ID.
Here is _an abbreviated and simplified_ version of the script but you can find the link to the full script at
the end of the post: 

```powershell
$groupJson = @{
  displayName         = $GroupName
  description         = $GroupDescription
  mailEnabled         = $false
  mailNickname        = $GroupMailNickName
  securityEnabled     = $true
  groupTypes          = @()
  "owners@odata.bind" = [string[]]"https://graph.microsoft.com/v1.0/servicePrincipals(appId='$($ClientId)')"
} | ConvertTo-Json

$groupResponse = Invoke-AzRestMethod `
  -Uri "https://graph.microsoft.com/v1.0/groups" `
  -Method Post -Payload $groupJson
$group = $groupResponse.Content | ConvertFrom-Json

$memberIds | ForEach-Object {
  $id = $_
  $bodyJson = @{
    "@odata.id" = "https://graph.microsoft.com/v1.0/directoryObjects/$id"
  } | ConvertTo-Json

  Invoke-AzRestMethod `
    -Uri "https://graph.microsoft.com/v1.0/groups/$($group.id)/members/`$ref" `
    -Method POST -Payload $bodyJson
}
```

Notice that we're using `members@odata.bind` to add owner to the group during the
[create operation](https://learn.microsoft.com/en-us/graph/api/group-post-groups?view=graph-rest-1.0&tabs=http):

> Creating a group using the `Group.Create` application permission
> without specifying owners **creates the group anonymously and the group isn't modifiable**.
> **Add owners to the group while creating it** so the owners can manage the group.

The above approach works fine, and a new group gets created as expected:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/new-group.png" %}

_However_, using service principal requires you to use
client secrets, certificates or federated credentials for the authentication.
You must maintain and store these secrets securely.

Therefore, we'll investigate achieving the same using managed identity.
Let's start by creating a new user assigned-identity:

```powershell
$identityName = "id-entra-id-automation-identity"
$resourceGroupName = "rg-entra-id-automation"
$location = "swedencentral"

# Create a new resource group
New-AzResourceGroup `
  -Name $resourceGroupName `
  -Location $location

# Create a new managed identity
$identity = New-AzUserAssignedIdentity `
  -ResourceGroupName $resourceGroupName `
  -Location $location `
  -Name $identityName
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/resource-group.png" %}

Unfortunately, we don't have _API Permissions_ in the managed identity view.
Therefore, we need to assign the necessary permissions using the APIs.

If we quickly still get back to the previous configuration of our service principal,
we can see the permission names:

{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/group-create-permission2.png" %}

{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/user-readbasic-all-permission2.png" %}

Permissions to our managed identity can be granted using<br/>
[New-AzADServicePrincipalAppRoleAssignment](https://learn.microsoft.com/en-us/powershell/module/az.resources/new-azadserviceprincipalapproleassignment?view=azps-12.4.0) cmdlet:

```powershell
$microsoftGraphApp = Get-AzADServicePrincipal -ApplicationId "00000003-0000-0000-c000-000000000000"
$graphPermissions = $microsoftGraphApp | Select-Object -ExpandProperty AppRole

New-AzADServicePrincipalAppRoleAssignment `
  -ServicePrincipalId $identity.PrincipalId `
  -ResourceId $microsoftGraphApp.Id `
  -AppRoleId ($graphPermissions `
  | Where-Object { $_.Value -eq "Group.Create" } `
  | Select-Object -ExpandProperty Id)
```

Or alternatively, you can use
[Graph Rest API directly](https://learn.microsoft.com/en-us/graph/api/serviceprincipal-post-approleassignedto?view=graph-rest-1.0&tabs=http):

```powershell
$appRoleJson = [ordered]@{
  principalId = $identity.PrincipalId
  resourceId  = $microsoftGraphApp.Id
  appRoleId   = ($graphPermissions `
    | Where-Object { $_.Value -eq "Group.Create" } `
    | Select-Object -ExpandProperty Id)
} | ConvertTo-Json

$response = Invoke-AzRestMethod `
  -Method Post `
  -Uri "https://graph.microsoft.com/v1.0/servicePrincipals/$($microsoftGraphApp.Id)/appRoleAssignedTo" `
  -Payload $appRoleJson
```

After the `Group.Create` and `User.ReadBasic.All` permissions are granted, you can see these permissions under _Enterprise apps_:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/enterprise-apps1.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/enterprise-apps2.png" %}

Now, we're ready to use the configured managed identity in e.g., Virtual Machine
(or 
[any other service that supports it](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/managed-identities-status)):

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/vm-identity.png" %}

In
[Azure PowerShell](https://learn.microsoft.com/en-us/powershell/azure/install-azps-linux?view=azps-12.4.0),
you can replace the above service principal login with the managed identity
**and rest of the script remains the same**:

```powershell
Connect-AzAccount -Identity
```

If you just want to use `bash` script, you can use the following approach
based on this
[tutorial](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/tutorial-windows-vm-access?pivots=windows-vm-access-lvm):

```bash
# Get the identity information including token
curl -s \
 'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://graph.microsoft.com/' \
 -H 'Metadata: true' > identity.json

# Create a new group
curl -s -X POST 'https://graph.microsoft.com/v1.0/groups' \
  -H "Authorization: Bearer $(cat identity.json | jq -r .access_token)" \
  -H "Content-Type: application/json" \
  -d '{
  "displayName": "Example Group",
  "description": "Example Group Description",
  "mailEnabled": false,
  "mailNickname": "examplegroup",
  "securityEnabled": true,
  "groupTypes": [],
  "owners@odata.bind": [
    "https://graph.microsoft.com/v1.0/servicePrincipals(appId='\'$(cat identity.json | jq -r .client_id)\'')"
  ] 
}' | jq -r .id > id.txt

# Add member to the group
curl -X POST "https://graph.microsoft.com/v1.0/groups/$(cat id.txt)/members/\$ref" \
  -H "Authorization: Bearer $(cat identity.json | jq -r .access_token)" \
  -H "Content-Type: application/json" -d '{
    "@odata.id": "https://graph.microsoft.com/v1.0/directoryObjects/cdbc71fd-0e73-48f0-b14c-f5216c4fb440"
}'
```

If you grab the access token from the above, you can see the `roles` claims
with the help of
[jwt.ms](https://jwt.ms/):

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/jwt.png" %}

It would be nice to use
[Azure PowerShell](https://learn.microsoft.com/en-us/powershell/azure/install-azps-linux?view=azps-12.4.0)
cmdlets in this limited permissions scenario, but _unfortunately_, the
[New-AzADGroup](https://learn.microsoft.com/en-us/powershell/module/az.resources/new-azadgroup?view=azps-12.4.0)
doesn't support adding owners during the creation.

---

Another very similar scenario is automating group memberships
which is typically combined with the requirement to **scope this to only specific groups**.

Typical requirements are:

- We have 1000s of groups in Entra ID
- We have a list of groups that we want to manage via this specific automation e.g., 25
- Permissions should be limited to only these 25 groups

Here's how you can achieve this:

1) Create a new app registration in Entra ID or use managed identity as shown above
  - Start *without* any permissions

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/group-owner-spn-api-permissions.png" %}

2) Add this identity as _owner_ to the groups that you want to manage:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/group-owner-spn.png" %}


Now you can add the members directly to those groups _even_ if you don't have any permissions:

```powershell
# Add member
$bodyJson = @{
    "@odata.id" = "https://graph.microsoft.com/v1.0/directoryObjects/cdbc71fd-0e73-48f0-b14c-f5216c4fb440"
} | ConvertTo-Json

Invoke-AzRestMethod `
    -Uri "https://graph.microsoft.com/v1.0/groups/ae22a67d-ce3e-4626-8b0c-94b003525a09/members/`$ref" `
    -Method POST -Payload $bodyJson
```

As in the above first example, you will have to add _additional permissions_ if you need to look up e.g., users.
Typical permissions for this case is the same as the one used above: `User.ReadBasic.All`.
In this scenario, our identity is limited managing only these 25 groups and it cannot manage any other groups.

# Conclusion

In this post, we've looked into how to use managed identity and application permissions to automate Entra ID operations.
We've also saw how to limit the permissions to only specific groups.

You can find the full scripts from the following links:

{% include githubEmbed.html text="entra-create-groups.ps1" link="JanneMattila/some-questions-and-some-answers/blob/master/q%26a/entra-create-groups.ps1" %}

{% include githubEmbed.html text="entra-managed-identity.ps1" link="JanneMattila/some-questions-and-some-answers/blob/master/q%26a/entra-managed-identity.ps1" %}

I hope you find this useful!
