---
layout: posts
title: "Azure DevOps and \"VS402846: The number of picklists in the collection has reached the limit of 2048\""
image: /assets/posts/2024/01/08/azure-devops-and-vs402846/new-field.png
date:   2024-01-08 06:00:00 +0300
categories: azure
tags: azure devops
---
Many companies have customized their Azure DevOps processes over the years.
You start that by going to the `Organization Settings` and then `Process`:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2024/01/08/azure-devops-and-vs402846/process.png" %}

There you can see the list of processes that you have in your organization.
You can then also view the fields that you have in use in your processes:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2024/01/08/azure-devops-and-vs402846/fields.png" %}

If you open up one process and then one workitem type, you can then add new fields to the workitem type:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2024/01/08/azure-devops-and-vs402846/new-field.png" %}

If you do all this manually, then most likely you don't easily get yourself to
a situation where you have too many fields. 

However, if you are trying to migrate your process from one organization to another
by using the _VSTS Process Migrator for Node.js_ tool,
then you might hit this problem.
Here is link to the tool:

{% include githubEmbed.html text="microsoft/process-migrator" link="microsoft/process-migrator" %}

It has [issue #47](https://github.com/microsoft/process-migrator/issues/47) which has
this exact problem described.
Migration fails with error:

> VS402846: The number of picklists in the collection has reached the limit of 2048

This happens if you need to re-run the migration process multiple times for testing or for some
other reason. Migration process creates new fields early in the process and if you hit some another issue,
those fields are left behind and not cleaned up.
These fields are _ghost fields_ since they are not visible in the user interface, but they are still there.
Running the migration process again will create new fields and then you will eventually
hit the limit of 2048 fields.

You can easily replicate this by deleting the field from the user interface:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2024/01/08/azure-devops-and-vs402846/delete-field.png" %}

The above field is now deleted from the user interface, but it is still in the database.

To fix this, you need to use [Azure DevOps REST API](https://learn.microsoft.com/en-us/rest/api/azure/devops/processes/lists?view=azure-devops-rest-7.2)
to delete the fields.

I've developed a small PowerShell script that you can use to delete the fields.

Process is quite simple. First, we export the list of fields to Excel file:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/08/azure-devops-and-vs402846/script1.png" %}

Export file looks like this:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/08/azure-devops-and-vs402846/excel1.png" %}

As you can see, first row does not contain `DisplayName`, `ReferenceName` or
the other details, so it's our _phantom_ field that we need to delete.
We mark `ToBeDeleted` column of that first row to `Yes` and save the file and close Excel:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/08/azure-devops-and-vs402846/excel2.png" %}

Script shows all the rows to be deleted and asks confirmation before proceeding:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/08/azure-devops-and-vs402846/script2.png" %}

Script now deletes the selected fields:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/01/08/azure-devops-and-vs402846/script3.png" %}

You can find this script here:

{% include githubEmbed.html text="JanneMattila/some-questions-and-some-answers" link="JanneMattila/some-questions-and-some-answers/blob/master/q%26a/azure_devops.md#remove-unnecessary-picklists" %}

I've on _purpose_ set that delete part to be commented out in the example script,
so that if you're testing, then it won't do anything unless you uncomment that part.

**Remember to be extra careful when deleting fields from your organization!**

I hope you find this useful!
