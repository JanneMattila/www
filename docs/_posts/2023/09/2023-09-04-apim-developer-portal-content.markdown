---
layout: posts
title:  "Azure API Management Developer Portal content migrations"
image: /assets/posts/2023/09/04/apim-developer-portal-content/share.png
date:   2023-09-04 06:00:00 +0300
categories: azure
tags: azure development apim
---

Azure API Management has been quite a commonly used service over the years among my customers. 
Quite common practice is to create APIM using your favorite Infrastructure-as-Code tooling 
such as Bicep, Azure CLI script or terraform. Deploying this to multiple environments is 
like any other application deployment, so there are no big surprises there.

One aspect of APIM is sometimes overlooked _at least early_ in the development process, 
which is related to handling the Developer Portal content. 
You should plan to migrate that content between environments as well.

[![APIM Developer Portal settings](/assets/posts/2023/09/04/apim-developer-portal-content/share.png)](/assets/posts/2023/09/04/apim-developer-portal-content/share.png)

Official APIM documentation has [Automate developer portal deployments](https://learn.microsoft.com/en-us/azure/api-management/automate-portal-deployments) instructions.
It links to [api-management-developer-portal](https://github.com/Azure/api-management-developer-portal)
in GitHub. 

Starting point for migration is [scripts.v3/migrate.bat](https://github.com/Azure/api-management-developer-portal/blob/master/scripts.v3/migrate.bat)
which contains the following code snippet:

```batch
node ./migrate ^
--sourceSubscriptionId "< your subscription ID >" ^
--sourceResourceGroupName "< your resource group name >" ^
--sourceServiceName "< your service name >" ^
--destSubscriptionId "< your subscription ID >" ^
--destResourceGroupName "< your resource group name >" ^
--destServiceName "< your service name >"
```

The above script shows how to pass connection details for _source_ APIM Developer Portal instance
and **at the same time** to the _target_ instance. This means that you have to have access to both
environments at the same time. 

_However_, I do not think that it's an approach that many Enterprises want.
The flow of moving changes from Development to Test to Production is 
quite established and commonly used in the large companies.
These environments should be disconnected from each other 
even during the deployment process.

Therefore, I took the ideas from the migrations scripts and converted them
into PowerShell "_Export_" and "_Import_" scripts. 
Idea of these scripts was simple: "_Export_" extracts Developer Portal content
to local filesystem and enables you to store these artifacts somewhere, 
which you can later use to deploy them to next environment. 
"_Import_" script takes content from local filesystem and
then pushes them to Developer Portal. 
**These two above migration steps are now disconnected from each other**, and you can build things like approvals to your deployment workflows between these steps. 

There scripts and more information can be found here:

{% include githubEmbed.html text="JanneMattila/azure-api-management-developer-portal-import-and-export-scripts" link="JanneMattila/azure-api-management-developer-portal-import-and-export-scripts" %}

I've also created GitHub Action for this, so you can use it in your GitHub workflows:

{% include githubEmbed.html text="JanneMattila/azure-api-management-developer-portal-action" link="JanneMattila/azure-api-management-developer-portal-action" %}

It's available in GitHub Marketplace. You can find it here: [Import or export Azure API Management Developer Portal content](https://github.com/marketplace/actions/import-or-export-azure-api-management-developer-portal-content).
