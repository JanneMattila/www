---
title: Manage temporary employees with Entra ID Governance and Lifecycle workflows
image: /assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/workflows.png
date: 2024-02-17 06:00:00 +0300
layout: posts
categories: entra
tags: entra security azure
---

[Microsoft Entra ID Governance](https://learn.microsoft.com/en-us/entra/id-governance/identity-governance-overview)

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/identity-governance.png" %}

[Lifecycle workflows](https://learn.microsoft.com/en-us/entra/id-governance/what-are-lifecycle-workflows)

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/workflows.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/workflows2.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/workflows3.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/workflows6.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/users.png" %}

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/disabled-user.png" %}

Flow of the process:

{% include mermaid.html text="
sequenceDiagram
    actor User
    User->>+WebApp: Enable temporary employee(s)
    Note right of WebApp: Use Application permissions
    WebApp->>+Workflow: Start workflow
    Workflow-->>-WebApp: Started
    WebApp-->>-User: Employee(s) enabled
" %}

Users are selected using following filters:

`startswith(department, 'TempEmployees')`

`Workflow`

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/web1.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/web2.png" %}

{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/workflows4.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/workflows5.png" %}

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/enabled-user.png" %}

TBD: You can use any Active Directory groups to grant access to the resources.

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/groups.png" %}

TBD: How to add custom extension Logic App

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/tasks.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/tasks2.png" %}


{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/tasks3.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/tasks4.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/tasks5.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/tasks6.png" %}

More information about custom task extensions [here](https://learn.microsoft.com/en-us/entra/id-governance/lifecycle-workflow-extensibility).

{% include githubEmbed.html text="JanneMattila/entra-demos" link="JanneMattila/entra-demos" %}

_This post was done in collaboration with [Timo Hakala](https://www.linkedin.com/in/timo-hakala-7398ab5/)._
_Credit for the idea and excellent test environment goes to him. Thank you!_
