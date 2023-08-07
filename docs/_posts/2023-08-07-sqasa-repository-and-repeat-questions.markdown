---
layout: posts
title:  "Some-Questions-And-Some-Answers (SQASA) repository and repeat questions"
image: /assets/posts/2023-08-07-sqasa-repository-and-repeat-questions/sqasa.png
date: 2023-08-07 17:00:00 +0300
categories: blog
tags: blog github
---
Over the years I have received tons of different questions around
application development and Azure from my customers and colleagues.

As I have been answering those questions, I have also been writing many of them down.
This of course has made my life a lot easier, since I can just provide link to my notes
instead of writing the same answer over and over again.

In fact, many people are quite frequently asking from me:

> _"Do you happen to have code example about...?"_

Maybe it's not a big suprise that same questions have come up several times.
Therefore, I created a repository for all these smaller random questions.
I ended up calling it **SQASA (Some Questions And Some Answers)** and
you can find it here: [JanneMattila/some-questions-and-some-answers](https://github.com/JanneMattila/some-questions-and-some-answers)

[![JanneMattila/some-questions-and-some-answers](/assets/posts/2023-08-07-sqasa-repository-and-repeat-questions/sqasa.png)](https://github.com/JanneMattila/some-questions-and-some-answers)

Below you can find three examples of the questions that I have received several times over the years.

---

First example is quite technical and many times complex. These kind of questions might come up when you're doing
custom application development or when you're migrating older application to cloud.
This is definitely a _repeat_ question for me and it has come up **at least 10+ times**.

It comes in many different forms, such as:

> _"My app seems to perform slowly in Azure."_

> _"Our application works so much faster in our laptops."_

> _"We're scaling up the database but we don't see performance improvements we're expecting."_

Core question from above discussions can be summarized to:

> _"My app seems to have higher latencies that I'm expecting when using our database. Why?"_

I'm not going to duplicate my notes here, but you can check my notes from the original location:
[Azure Databases](https://github.com/JanneMattila/some-questions-and-some-answers/blob/master/q%26a/azure_databases.md).

---

Second example of _repeat_ question is related to Azure DevOps Agents and network access:

> _"I want to connect to Azure Storage from my pipeline, but it doesn't work because of network restrictions."_

> _"I want to update my database schema but I can't connect to database during the deployment due to network configuration."_

Those questions can be summarized to:

> _"How do I access network restricted resource from pipeline?"_

For some reason it took me years to write this down but eventually I did it. 
You can find it here: [How do I access network restricted resource from pipeline](https://github.com/JanneMattila/some-questions-and-some-answers/blob/master/q%26a/azure_devops.md#how-do-i-access-network-restricted-resource-from-pipeline).
Again, it should help you when having the customer discussions.

GitHub Actions & GitHub-hosted Runners have similar challenge and above applies there as well.
Additionally, GitHub has documented other more 
[complex options](https://docs.github.com/en/actions/using-github-hosted-runners/connecting-to-a-private-network)
but I haven't really seen these used within Enterprise customers.

---

Third and final _repeat_ question example is **the most repeat question that I've ever had**.

It's related to Azure deployments and what's my view on it. 
I wrote that to [Azure deployment entry point](https://github.com/JanneMattila/some-questions-and-some-answers/blob/master/q%26a/azure_deployment_entry_point.md)
and I have been using that as a reference for years to in my discussions.

---

Even if some of the above notes are already quite old, I have found them to be still useful for _suprisingly_ long time.

Therefore, I highly recommend you to begin documenting your own work 
and giving yourself a good productivity boost.
