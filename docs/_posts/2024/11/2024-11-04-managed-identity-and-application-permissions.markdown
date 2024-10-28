---
title: Managed identity and Application Permissions
image: /assets/posts/2024/11/04/managed-identity-and-application-permissions/application-permissions.png
date: 2024-11-04 06:00:00 +0300
layout: posts
categories: azure
tags: azure graph managed-identity application-permissions
---

I have previously blogged about various Azure and Entra ID automation topics
e.g., 
[Automating maintenance tasks with Azure Functions and PowerShell]({% post_url 2023/10/2023-10-30-automating-maintenance-tasks-part1 %})
and
[Entra ID Group automation with PowerShell]({% post_url 2024/02/2024-02-05-entra-id-group-automation %}).

Typically, when you start that work, you need to create a new app registration in Entra ID and assign it the necessary permissions based on your scenario.
So, you end up into this Entra ID view:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/application-permissions.png" %}

Since we would be looking to do some kind of background processing, we would need to select the following permissions:

> **Application permissions**<br/>
> Your application runs as a background service or daemon without a signed-in user.

Let's try to cover the following implementation scenario:

- Automation to create a new group in Entra ID
- Simple incoming data to define the group information
- Group will only have users as members
- The automation is implemented using PowerShell and the Microsoft Graph API

I would then start by adding the necessary permissions to the app registration in Entra ID. 
First, I would need to add the following permissions in order to be able to create a new group:
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/group-create-permission.png" %}

Second, I would need to add the following permissions in order to be able to read the basic information of the users:
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
Here is _abbreviated_ version of the script but you can find the link full script at
the end of the post: 

```powershell
$groupJson = @{
  displayName     = $GroupName
  description     = $GroupDescription
  mailEnabled     = $false
  mailNickname    = $GroupMailNickName
  securityEnabled = $true
  groupTypes      = @()
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

The above approach works fine and a new group gets created as expected:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/new-group.png" %}

_However_, using service principal requires you to use
client secret, certificate or federated credentials for the authentication.

Therefore, we'll look into achieving the same using managed identity.
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

If quickly still get back to the previous configuration of our service principal,
we can see the permission names:

{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/group-create-permission2.png" %}

{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/user-readbasic-all-permission2.png" %}

Permissions can be granted using `New-AzADServicePrincipalAppRoleAssignment` cmdlet:

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
$appRoleJson

$response = Invoke-AzRestMethod `
  -Method Post `
  -Uri "https://graph.microsoft.com/v1.0/servicePrincipals/$($microsoftGraphApp.Id)/appRoleAssignedTo" `
  -Payload $appRoleJson
```

After the permissions are granted, you can find these permissions under _Enterprise apps_:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/enterprise-apps1.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/11/04/managed-identity-and-application-permissions/enterprise-apps2.png" %}

Now, we're ready to use the configured managed identity in e.g., Virtual Machine
(or 
[any other service that supports it](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/managed-identities-status)).

Here are commands executed inside Linux Virtual Machine:

```powershell
# tba
```

[text](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/tutorial-windows-vm-access?pivots=windows-vm-access-lvm)

```bash
# Get the identity information including token
curl -s \
 'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://graph.microsoft.com/' \
 -H Metadata:true > identity.json

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

You can use `members@odata.bind` to add members to the group during the
[create operation](https://learn.microsoft.com/en-us/graph/api/group-post-groups?view=graph-rest-1.0&tabs=http).

---

You can of course use the same approach with
[Azure PowerShell](https://learn.microsoft.com/en-us/powershell/azure/install-azps-linux?view=azps-12.4.0)
but with _caveats_:

```powershell
# Login with the managed identity
Connect-AzAccount -Identity

# Create a new group
$group = New-AzADGroup -DisplayName "Example Group 2" -Description "Example Group 2 Description" -MailNickname "examplegroup2" -SecurityEnabled

# Add owner to the group
New-AzADGroupOwner -GroupId $group.Id -OwnerId "cdbc71fd-0e73-48f0-b14c-f5216c4fb440"

# Add a member to the group
Add-AzADGroupMember -TargetGroupObjectId $group.Id -MemberObjectId "cdbc71fd-0e73-48f0-b14c-f5216c4fb440"
```

Unfortunately, `New-AzADGroup` doesn't support adding owners during the creation.
Therefore, you'll get following error message when calling `New-AzADGroupOwner`:

`Insufficient privileges to complete the operation.`

It's explained in
[Create group](https://learn.microsoft.com/en-us/graph/api/group-post-groups?view=graph-rest-1.0&tabs=http)
documentation:

> Creating a group using the `Group.Create` application permission
> without specifying owners **creates the group anonymously and the group isn't modifiable**.
> **Add owners to the group while creating it** so the owners can manage the group.

You can overcome the above challenges by using the Graph API directly:

```powershell
$identity = Invoke-RestMethod -Headers @{"Metadata"="true"} -Uri "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://graph.microsoft.com/"

$groupJson = [ordered]@{
  displayName         = $GroupName
  description         = $GroupDescription
  mailEnabled         = $false
  mailNickname        = $GroupMailNickName
  securityEnabled     = $true
  groupTypes          = @()
  "owners@odata.bind" = [string[]]"https://graph.microsoft.com/v1.0/servicePrincipals(appId='$($identity.client_id)')"
} | ConvertTo-Json

$groupResponse = Invoke-AzRestMethod `
    -Uri "https://graph.microsoft.com/v1.0/groups" `
    -Method Post -Payload $groupJson
$group = $groupResponse.Content | ConvertFrom-Json

$bodyJson = @{
    "@odata.id" = "https://graph.microsoft.com/v1.0/directoryObjects/cdbc71fd-0e73-48f0-b14c-f5216c4fb440"
} | ConvertTo-Json

Invoke-AzRestMethod `
    -Uri "https://graph.microsoft.com/v1.0/groups/$($group.Id)/members/`$ref" `
    -Method POST -Payload $bodyJson -Debug
```

---

Obviously, I recommend using other compute options like Azure Functions handling these automations. See my previous posts for more details:
[Entra ID Group automation with PowerShell]({% post_url 2024/02/2024-02-05-entra-id-group-automation %}).

---

One other typical automation scenario is automating group memberships.
This is many times combined with the requirement to scope this this to only specific groups.

Typical requirements are:

- We have 1000s of groups in Entra ID
- We have a list of groups that we want to manage via automation e.g., 25
- Permissions should be limited to only these 25 groups

Here's how you can achieve this:

1) Create a new app registration in Entra ID
  - I'll start *without* any permissions

2) Add this application as _owner_ to the groups that you want to manage:

Now you can add the members directly to that groups _even_ if you don't have any permissions:

```powershell
# Get group
Invoke-AzRestMethod `
    -Uri "https://graph.microsoft.com/v1.0/groups/ae22a67d-ce3e-4626-8b0c-94b003525a09"

# Add member
$bodyJson = @{
    "@odata.id" = "https://graph.microsoft.com/v1.0/directoryObjects/cdbc71fd-0e73-48f0-b14c-f5216c4fb440"
} | ConvertTo-Json

Invoke-AzRestMethod `
    -Uri "https://graph.microsoft.com/v1.0/groups/ae22a67d-ce3e-4626-8b0c-94b003525a09/members/`$ref" `
    -Method POST -Payload $bodyJson
    
# Get members
Invoke-AzRestMethod `
    -Uri "https://graph.microsoft.com/v1.0/groups/ae22a67d-ce3e-4626-8b0c-94b003525a09/members/`$ref"
```

If you need to look up users, then you need to have the necessary permissions e.g., `User.ReadBasic.All`.


<!--
[text](https://learn.microsoft.com/en-us/powershell/azure/create-azure-service-principal-azureps?view=azps-12.4.0)

https://techcommunity.microsoft.com/t5/azure-integration-services-blog/grant-graph-api-permission-to-managed-identity-object/ba-p/2792127

https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/grant-admin-consent?pivots=portal

https://learn.microsoft.com/en-us/graph/api/resources/approleassignment?view=graph-rest-1.0

https://learn.microsoft.com/en-us/graph/api/serviceprincipal-post-approleassignedto?view=graph-rest-1.0&tabs=http
-->