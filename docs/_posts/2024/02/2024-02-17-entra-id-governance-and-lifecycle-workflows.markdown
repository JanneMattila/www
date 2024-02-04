---
title: Manage temporary employees with Entra ID Governance and Lifecycle workflows
image: /assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/workflows.png
date: 2024-02-17 06:00:00 +0300
layout: posts
categories: entra
tags: entra security azure
---
Many companies have requirement to enable temporary employee access various company resources.
Sometimes, this process is handled via ticketing systems and long wait times
can be very problematic to the business process.
Access management can span from IT systems to physical building accesses and
the need to enable this access can come very urgently.

Let's look how we can handle this process with
[Microsoft Entra ID Governance](https://learn.microsoft.com/en-us/entra/id-governance/identity-governance-overview)
based solution:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/identity-governance.png" %}

Identity Governance has a feature called
[Lifecycle workflows](https://learn.microsoft.com/en-us/entra/id-governance/what-are-lifecycle-workflows)
which we're going to leverage in this demo:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/workflows.png" %}

Lifecycle workflows can be used to automate various tasks related to identity management.
In this post, we're going to use workflows for enabling temporary employee access
in this fictional Healthcare organization.

Here is the demo setup:

- Temporary employees are part of the directory, but they are in _disabled_ state
- They might be asked to come to work at very short notice
- They do not have standing access to resources
  - They will get access to confidential IT systems and areas
    for the duration of their visit
- Few ready-made business roles are defined
- Granting access to these business roles is handled by end users from those departments
  and not by any centralized function like IT department or support
- Entra ID Group memberships are synchronized to the on-premises Active Directory groups
  - On-premises systems use these groups for access management

Read more about group member synchronization [here](https://learn.microsoft.com/en-us/entra/identity/hybrid/cloud-sync/govern-on-premises-groups).

Here you can see a list of different workflows defining temporary employee accesses:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/workflows2.png" %}

If we now focus on one of the workflows, we can see that it does enable
_Nurse_ role and access to the _Emergency_ department and its resources:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/workflows3.png" %}

Workflow itself defines tasks which are executed when the workflow is started:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/workflows6.png" %}

Now let's walk through the process of enabling temporary employees:

Urgent need to fill in for a sick nurse for half a day.
Luckily, a suitable temporary employee is quickly found: _Mike Jensen_.

In the Active Directory, he is in _disabled_ state:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/users.png" %}

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/disabled-user.png" %}

Manager from the department opens the web application and
logs in with their Entra ID account:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/web1.png" %}

They'll see a list of users which are filtered to show only temporary employees.
In this demo users are filtered with this query: `startswith(department, 'TempEmployees')`.
Of course, you could use any custom logic here to find the correct users to display.

Similarly, the list of available workflows is filtered to show only relevant workflows.

User selects the correct workflow and starts it for _Mike Jensen_:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/web2.png" %}

User could select multiple users and multiple workflows at once,
if they would need to e.g., enable access for multiple temporary employees at once.

In the workflow history view, you can see status of the workflow:

{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/workflows4.png" %}

The workflow for _Mike Jensen_ has been _Completed_ successfully:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/workflows5.png" %}

This means that the temporary employee _Mike Jensen_ has also been
enabled in the Active Directory:

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/enabled-user.png" %}

It means that they now have access to the resources defined in the workflow
e.g., access to the emergency department restricted areas and IT systems.

It's important to note that the end user who initiated the workflow
doesn't need to have any special permissions for enabling the temporary employees.
Web application has rights to starts the workflow processes.

Here is the sequence diagram of the process:

{% include mermaid.html text="
sequenceDiagram
    actor User
    User->>+WebApp: Enable temporary employee(s)
    Note right of WebApp: Use Application permissions
    WebApp->>+Workflow: Start workflow
    Note right of Workflow: Tasks are executed
    Workflow-->>-WebApp: Started
    WebApp-->>-User: Employee(s) enabled
" %}

Let's look at the tasks in the workflow:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/tasks.png" %}

If you want to add a new task to the workflow, you can just click _Add task_ button.
It has many built-in tasks but now we're going to focus on the _Custom task extension_:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/tasks2.png" %}

Already implemented custom extensions can be found under lifecycle workflows:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/tasks3.png" %}

They are implemented as _Logic Apps_.
Let's quickly check the steps to add new custom task.
First, you need to provide a name and description:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/tasks4.png" %}

Then you can define behavior and authorization related parameters:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/tasks5.png" %}

Next you can pick the existing Logic App or create a new one:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/02/17/entra-id-governance-and-lifecycle-workflows/tasks6.png" %}

In your Logic App implementation, you can use other Azure services and
leverage those [numerous connectors](https://learn.microsoft.com/en-us/connectors/connector-reference/connector-reference-logicapps-connectors)
available for Logic Apps.
More information about custom task extensions [here](https://learn.microsoft.com/en-us/entra/id-governance/lifecycle-workflow-extensibility).

Here is the above example web application code:

{% include githubEmbed.html text="JanneMattila/entra-demos" link="JanneMattila/entra-demos" %}

<br/>_This post was done in collaboration with [Timo Hakala](https://www.linkedin.com/in/timo-hakala-7398ab5/)._<br/>
_Credit for the idea and excellent test environment goes to him. Thank you!_

I hope you find this useful!
