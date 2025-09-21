---
title: Traditional application vs. chat-based application
image: /assets/posts/drafts/traditional-app-vs-chat-based-app/crud-vs-chat.png
date: 2025-10-12 06:00:00 +0300
layout: posts
categories: azure
tags: azure ai chat
---

Recently, we've seen a significant increase in the adoption of chat-based applications powered by AI.
Sure, we had our Bot Frameworks and chatbots before, but the recent advancements in AI have made these applications much more lucrative to build and use.

However, I've found myself debating that maybe some of these applications could be better served by
traditional, _and good old_, CRUD (**C**reate, **R**ead, **U**pdate, **D**elete) applications. 
I know, _I know_, they're not as exciting and trendy but they still have their time and place.

In this post, we'll explore a couple of scenarios and compare the two approaches.

## Scenario 1: Order processing support tool

In this scenario, we want to implement a system that enables users to analyze
and see status of some specific process.
This can vary a lot from one organization to another, but
you can typically find scenarios that occur frequently enough and
users find themselves looking for this specific information.

In my previous blog post, I wrote about
[Automated Order Processing from emails with Logic Apps and Azure OpenAI]({% post_url 2025/09/2025-09-21-automated-order-processing %}),
so it was natural selection for this this first scenario.

Here is _one very simplified way_ of illustrating a traditional CRUD application user interface
for order processing analysis scenario:

{% include imageEmbed.html link="/assets/posts/drafts/traditional-app-vs-chat-based-app/crud-app1.png" %}

User interface is very structured and guides the user to input order number and any
other relevant information in very structured way.
Additionally, your application can easily implement valuable features like form validation,
data integrity checks, etc. which improves overall user experience and reduces errors.

Here is the same order processing analysis scenario as a chat-based experience:

{% include imageEmbed.html link="/assets/posts/drafts/traditional-app-vs-chat-based-app/chat-app1.png" %}

This user experience is very flexible and dynamic and users input would
be processed by AI model, making the interaction feel more like a conversation than a transaction.
Of course, it needs to get the information from somewhere, and therefore
we need to implement some tooling for providing this information to the AI model.

Here is an example of how you could implement this using
[Semantic Kernel](https://learn.microsoft.com/en-us/semantic-kernel/overview/)
and
[Function calling](https://learn.microsoft.com/en-us/semantic-kernel/concepts/ai-services/chat-completion/function-calling/?pivots=programming-language-csharp):

```csharp
var troubleshootOrderFunction = KernelFunctionFactory.CreateFromMethod(
    method: (string orderID) => $"Order {orderID} has been successfully processed.",
    functionName: "troubleshoot_order",
    description: @"
        Troubleshoots order status. 
        You need to have orderID in format 'ORD<order_number>'.");

// ...

kernelBuilder
    .Plugins
    .AddFromFunctions(
        "TroubleshootOrder", "Order troubleshooting", 
        [troubleshootOrderFunction]);
```

Here is an example output from the above:

```console
> What is order status of ORD123456?

The order with ID **ORD123456** has been successfully processed!
```

And here is an example of how you could implement this using
[Azure AI Foundry Agent Service](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/overview):

{% include imageEmbed.html link="/assets/posts/drafts/traditional-app-vs-chat-based-app/agent-service1.png" %}

Here's the corresponding Logic App used in the Agent Service as _Action_:

{% include imageEmbed.html link="/assets/posts/drafts/traditional-app-vs-chat-based-app/agent-service2.png" %}

Alternatively, you could implement
[Model Context Protocol (MCP) server](https://learn.microsoft.com/en-us/dotnet/ai/resources/mcp-servers)
for this scenario and use
that with Semantic Kernel or Azure AI Foundry Agent Service:

```csharp
using ModelContextProtocol.Server;
using System.ComponentModel;

[McpServerToolType]
public static class OrderTroubleshootingTool
{
  [McpServerTool(Name = "troubleshoot_order")]
  [Description(@"Troubleshoot order status")]
  public static string TroubleshootOrder(
    [Description("Order ID in format 'ORD<order_number>'")] 
    string orderID)
  {
    return $"Order {orderID} has been successfully processed.";
  }
}
```

These were just couple of options how to connect your chat-based application to backend systems.

If we try to compare the two approaches, we can see that CRUD app is very straightforward
and easy to implement. You basically just implement user interface,
business logic to analyze the order status,
and connect user provided parameters to the search conditions of the business logic.
In chat-based experiences, the user cannot directly "see" the options and they need to
know what to ask from the system.

From technical perspective, you also need to keep in mind that you cannot flood the AI model with too much information.
This means that you need to carefully place _just enough information_
to the context so that model starts to work correctly.
You need to plan and test it with the LLM.

From the 
[Function calling](https://learn.microsoft.com/en-us/semantic-kernel/concepts/ai-services/chat-completion/function-calling/?pivots=programming-language-csharp) documentation
you can find some guidance and tips on this topic:

> Verbosity of function schema – Serializing functions for the model to use doesn't come for free.
> The more verbose the schema, the more tokens the model has to process,
> which can slow down the response time and increase costs.
> <br/> <br/>
> Keep your functions as simple as possible.
> ..., you'll notice that not all functions have descriptions
> where the function name is self-explanatory.

---

For me, in scenario 1, the structured CRUD application seems to be a better solution.
You can easily copy-paste IDs from other systems or emails to the
user interface and make the experience more efficient for the user.

## Scenario 2: Travel booking

TBA

## Scenario 3: Customer support

TBA

## Conclusion

This post reminded me from one of my presentation from 2020:

{% include imageEmbed.html link="/assets/posts/drafts/traditional-app-vs-chat-based-app/right-tool-for-the-right-job.png" %}

> The right tool for the right job.

Hope you found this post useful!
