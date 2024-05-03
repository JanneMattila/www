---
title: Automations with Azure DevOps or GitHub Actions
image: /assets/posts/2024/05/27/automations-with-azure-devops-or-github-actions/entra6.png
date: 2024-05-27 06:00:00 +0300
layout: posts
categories: azure
tags: azure powershell devops github actions
---

I have been recently blogging about various automation topics:

[Automating maintenance tasks with Azure Functions and PowerShell]({% post_url 2023/10/2023-10-30-automating-maintenance-tasks-part1 %})

[Automation PowerShell tasks with Container App Jobs]({% post_url 2024/05/2024-05-20-automating-powershell-tasks-with-container-apps %})

https://learn.microsoft.com/en-us/azure/devops/pipelines/process/scheduled-triggers?view=azure-devops&tabs=yaml

https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure?tabs=azure-portal%2Cwindows

https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure


Workload ID

[Arc-enabled Kubernetes and Microsoft Entra Workload ID]({% post_url 2024/05/2024-05-13-arc-enabled-kubernetes-and-entra-workload-id %})

## Azure DevOps

Issuer:

```
https://vstoken.dev.azure.com/d16bb96a-a9de-4052-abe3-18bde0abb46c
```

Subject identifier:

```
sc://jannemattilademo/AzureDemo/DevelopmentConnection
```

## GitHub Actions

Issuer:

```
https://token.actions.githubusercontent.com
```

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-devops-or-github-actions/ado1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-devops-or-github-actions/ado2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-devops-or-github-actions/ado3.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-devops-or-github-actions/ado4.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-devops-or-github-actions/ado5.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-devops-or-github-actions/ado6.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-devops-or-github-actions/ado7.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-devops-or-github-actions/ado8.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-devops-or-github-actions/entra1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-devops-or-github-actions/entra2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-devops-or-github-actions/entra3.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-devops-or-github-actions/entra4.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-devops-or-github-actions/entra5.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-devops-or-github-actions/entra6.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-devops-or-github-actions/gh1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-devops-or-github-actions/gh2.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/05/27/automations-with-azure-devops-or-github-actions/gh3.png" %}


Subject identifier:

```
repo:jannemattila/powershell-demos:ref:refs/heads/main
```

AZURE_CLIENT_ID
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID


## Conclusion

I hope you find this useful!
