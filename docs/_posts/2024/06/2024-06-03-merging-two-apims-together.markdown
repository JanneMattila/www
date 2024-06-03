---
title: Merging two Azure API Management services together
image: /assets/posts/2024/06/03/merging-two-apims-together/merging-two-apims-together-after.png
date: 2024-06-03 06:00:00 +0300
layout: posts
categories: azure
tags: azure apim
---

[Azure API Management](https://learn.microsoft.com/en-us/azure/api-management/api-management-key-concepts)
has over the years become a very popular service in Azure. 
Over the years many practices with APIM have matured including
[DevOps and CI/CD](https://learn.microsoft.com/en-us/azure/api-management/devops-api-development-templates)
practices. 

Previously there was
[Azure API Management DevOps Resource Kit](https://github.com/Azure/azure-api-management-devops-resource-kit)
and currently there is
[Azure APIOps Toolkit](https://github.com/Azure/APIOps).

Many customers are using Infrastructure as Code (IaC) to manage their APIM instances.
If you have all that in place, then making even larger changes to the environment should not be too daunting task.

I was working with one customer who had two APIM instances for their internal integrations
and they wanted to merge them together.
Before merging two Azure API Management services together, they had the following setup:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/03/merging-two-apims-together/merging-two-apims-together-before.png" %}

They wanted to merge these two APIM instances together and this was the interim state:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/03/merging-two-apims-together/merging-two-apims-together-after.png" %}

And course, after the successful merge, the final state is this:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/03/merging-two-apims-together/merging-two-apims-together-end.png" %}

One thing they didn't yet have a solution in their process: how to handle the subscription keys.
They had already quite a lot of integrations connecting to another instance they planned to merge
into the main instance. They wanted to keep the subscription keys the same for the existing customers.
It should be "seamless" for their customers.

Luckily, there are
[Get-AzApiManagementSubscriptionKey](https://learn.microsoft.com/en-us/powershell/module/az.apimanagement/get-azapimanagementsubscriptionkey?view=azps-11.6.0)
cmdlet for getting the subscription keys and
[New-AzApiManagementSubscription](https://learn.microsoft.com/en-us/powershell/module/az.apimanagement/new-azapimanagementsubscription?view=azps-11.6.0)
cmdlet for creating **a new subscription with existing keys**:

```powershell
# Export
Get-AzApiManagementSubscription `
        -Context $apimContextSource

# Import
New-AzApiManagementSubscription `
        -Context $apimContextTarget `
        -Name $subscriptionName `
        -Scope $scope `
        -PrimaryKey $primarySubscriptionKey `
        -SecondaryKey $secondarySubscriptionKey `
```

I created a small _example_ PowerShell script to handle the subscription key move:

1. Export the subscription keys from the source APIM to a CSV file
2. Allows you to review the CSV file and make any necessary manual changes
   - There is `ToBeImported` column indicating if the subscription key should be imported to the target APIM
3. Import the subscription keys to the target APIM from the CSV file

Here is the script:

{% include githubEmbed.html text="JanneMattila/azure-api-management-demos/subscription-keys.ps1" link="JanneMattila/azure-api-management-demos/blob/main/subscription-keys.ps1" %}

Btw... 
[aka.ms/apimlove](https://aka.ms/apimlove)
is good link collection to APIM resources.

I hope you find this useful!
