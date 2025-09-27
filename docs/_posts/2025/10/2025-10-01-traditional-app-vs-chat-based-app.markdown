---
title: Traditional application vs. chat-based application
image: /assets/posts/2025/10/01/traditional-app-vs-chat-based-app/crud-vs-chat.png
date: 2025-10-01 06:00:00 +0300
layout: posts
categories: azure
tags: azure ai chat
---

Recently, we've seen a significant increase in the adoption of chat-based applications powered by AI.
Sure, we had our Bot Frameworks and chatbots before, but the recent advancements in AI have made these applications much more lucrative to build and use.

However, I've found myself debating that maybe some of these applications could be better served by
traditional, _and good old_, CRUD (**C**reate, **R**ead, **U**pdate, **D**elete) applications. 
I know, _I know_, they're not as exciting and trendy but they still have their time and place.

In this post, we'll explore two of scenarios and compare the two different approaches.

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

{% include imageEmbed.html link="/assets/posts/2025/10/01/traditional-app-vs-chat-based-app/crud-app1.png" %}

User interface is very structured and guides the user to input order number and any
other relevant information in very structured way.
Additionally, your application can easily implement valuable features like form validation,
data integrity checks, etc. which improves overall user experience and reduces errors.
You can also get real-time data updates and notifications about order status changes without user interactions.

Here is the same order processing analysis scenario as a chat-based experience:

{% include imageEmbed.html link="/assets/posts/2025/10/01/traditional-app-vs-chat-based-app/chat-app1.png" %}

This user experience is very flexible and dynamic and users input would
be processed by AI model, making the interaction feel more like a conversation than a transaction.
Of course, it needs to get the information from somewhere, and therefore
we need to implement some tooling for providing this information to the AI model.

Here is an example of how you could implement this using
[Semantic Kernel](https://learn.microsoft.com/en-us/semantic-kernel/overview/)
and
[Function calling](https://learn.microsoft.com/en-us/semantic-kernel/concepts/ai-services/chat-completion/function-calling/?pivots=programming-language-csharp)
(or [Plugin](https://learn.microsoft.com/en-us/semantic-kernel/concepts/plugins/?pivots=programming-language-csharp)):

```csharp
// Create function for troubleshooting order
var troubleshootOrderFunction = KernelFunctionFactory.CreateFromMethod(
    method: (string orderID) => $"Order {orderID} has been successfully processed.",
    functionName: "troubleshoot_order",
    description: @"
        Troubleshoots order status. 
        You need to have orderID in format 'ORD<order_number>'.");

// ...abbreviated...

// Add the function to the kernel
kernelBuilder
    .Plugins
    .AddFromFunctions(
        "TroubleshootOrder", "Order troubleshooting", 
        [troubleshootOrderFunction]);
```

> **Note:**<br/>
> Function calling, Plugins, Tools and Actions are different names for the same concept.
> They all refer to the ability of the AI model to call external functions or services
> to perform specific tasks or retrieve information.

Here is an example output from the above:

```console
> What is order status of ORD123456?

The order with ID **ORD123456** has been successfully processed!
```

And here is an example of how you could implement this using
[Azure AI Foundry Agent Service](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/overview):

{% include imageEmbed.html link="/assets/posts/2025/10/01/traditional-app-vs-chat-based-app/agent-service1.png" %}

Here's the corresponding Logic App used in the Agent Service as _Action_:

{% include imageEmbed.html link="/assets/posts/2025/10/01/traditional-app-vs-chat-based-app/agent-service2.png" %}

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

---

If we try to compare the two approaches, we can see that CRUD app is very straightforward
and easy to implement. You basically just implement user interface,
business logic to analyze the order status,
and connect user provided parameters to the search conditions of the business logic.
Additionally, you might have application that your users are already using that
would easily be extended with this kind of functionality. So, you would not have to create a new application from scratch.
Monitoring and logging is also easy to implement and you can leverage existing tools and practices for collecting your telemetry data.
You can then analyze this collected telemetry data and see how much it has been used and how well it has performed over time.

In comparison, in chat-based experiences, the user cannot directly "see" the options and they need to
know what to ask from the system. This can lead to misunderstandings, errors, and frustration.
If your use case requires a lot of fields and parameters (e.g., order number, customer ID, date range, product ID, etc.),
it can become cumbersome to provide all this information in a chat message.
I've said it in some discussions that if you have user interface with many cascading dropdowns,
then maybe chat-based experience is not the best fit for your use case.

From technical perspective, it's also good to understand the limitations of the model and its context window.
They have evolved a lot and their context windows have increased significantly.
For example (more information from [Foundry Models](https://learn.microsoft.com/en-us/azure/ai-foundry/foundry-models/concepts/models-sold-directly-by-azure?pivots=azure-openai&tabs=global-standard-aoai%2Cstandard-chat-completions%2Cglobal-standard)):

> `gpt-5` model:<br/>
> Input: **272,000 tokens**<br/>
> Output: **128,000 tokens**<br/>

and 

> `gpt-4o` model:<br/>
> Input: **128,000 tokens**<br/>
> Output: **16,384 tokens**<br/>

You can use [Tokenizer](https://platform.openai.com/tokenizer)
for understanding how your prompts and other context elements consume tokens.
Just to give you some idea about the usage, I used `=rand(30,30)` in Word to generate some random text
of 14340 words and 24 pages, and copied that to Tokenizer and it consumed 16,380 tokens with `gpt-4o` model.
So, with quick math, you could place 150-200 pages of text from Word document to the context of `gpt-4o` model.

From the 
[Function calling](https://learn.microsoft.com/en-us/semantic-kernel/concepts/ai-services/chat-completion/function-calling/?pivots=programming-language-csharp) documentation
you can find some guidance and tips on this topic:

> Verbosity of function schema – Serializing functions for the model to use **doesn't come for free**.
> **The more verbose the schema, the more tokens the model has to process**,
> which can **slow down the response time and increase costs**.
> <br/> <br/>
> Keep your functions as simple as possible.
> ..., you'll notice that not all functions have descriptions
> where the function name is self-explanatory.

---

For me, in scenario 1, the structured CRUD application seems to be a better solution.
You can easily copy-paste IDs from other systems or emails to the
user interface and make the experience more efficient for the user.

## Scenario 2: Travel booking

In this scenario, we want to implement a system that allows our corporate employees to book travel arrangements.
This includes flights, hotels, and car rentals.

Here is user interface of a traditional applications for travel booking scenario.
They typically start by looking for flights:

{% include imageEmbed.html link="/assets/posts/2025/10/01/traditional-app-vs-chat-based-app/crud-app2.png" %}

The above is of course just a first step of the travel booking process.
After selecting the flights, user would typically find the hotel and then proceed to look for
additional services like car rentals, etc. Corporate travel tools don't typically have other capabilities.

Here is the same travel booking scenario as a chat-based experience:

{% include imageEmbed.html link="/assets/posts/2025/10/01/traditional-app-vs-chat-based-app/chat-app2.png" %}

In this user experience, users can describe their travel needs in a more natural way.
This experience really feels like your personal travel assistant helping you to find the best options
based on your preferences and requirements.
It "knows" you based on your previous travel history and can make personalized recommendations.

Technical implementation of this chat-based experience is very similar to the one described
in the previous scenario. 

For this scenario, if built with Semantic Kernel, you could create separate functions for

- Fetching today's date
- Fetching previous travel details
- Fetching flights based on user preferences
- Fetching hotels
- Fetching car rentals
- Fetching activities

Here's is a tiny example of fetching flights:

```csharp
// Create function for fetching flights
var getFlightsFunction = KernelFunctionFactory.CreateFromMethod(
    method: GetFlights(),
    functionName: "get_flights",
    description: @"Finds a list of flights.
        You need to use the airport codes in IATA format '<airport_code>'."
);

// Add the function to the kernel
kernelBuilder
  .Plugins
  .AddFromFunctions("GetFlights", "Flight retrieval", [getFlightsFunction]);

// Example implementation of the function
static Func<string, string, DateTime, DateTime, string, string> GetFlights()
{
  return (string departureAirportCode, string arriveAirportCode,
          DateTime departureTime, DateTime returnTime,
          string travelClass) =>
  {
    Console.WriteLine($"<Function-GetFlights: Fetching flights from ...>");
    return $@"Here are some flight options ...";
  };
}
```

All other functions would be implemented in very similar way.
And in real implementation, you would connect to databases or call APIs to fetch the actual data.

System prompt can be filled with user specific information like:

- User's name
- User's travel preferences
  - Home airport
  - Preferred airlines
  - Preferred hotel chains

Here's an simplified example about system prompt:

```md
You are travel assistant helping users with their travel plans.
User is Mr. John Doe. His travel preferences are as follows:
- Home city is Helsinki and he departs from HEL airport.
- He prefers direct flights and Economy class accommodations.

...abbreviated: Guidance how to fetch and format the information...

Make sure you handle all the users requests in a single conversation.
Include total costs at the end when you present the options to the user.
Always ask for confirmation before finalizing the bookings to avoid any mistakes.
Remind them that they need to book any possible activities separately
as you will only finalize the flight, hotel, and car rental bookings.

After you have received confirmation, then
you can let user know that you're finalizing the travel arrangements
and that they will get a confirmation email shortly including
all the travel documents and calendar invites.
Provide relevant travel greetings at the end after confirmation.
```

Here's an example conversation output and you can see how
the functions are called in the background:

```md
**User:** I need to travel again to Stockholm next week Tuesday for 3 days.
Book me my usual hotel and rent a car as well.
Also, find something fun to do for Wednesday evening.
{% raw %}
<Function-GetToday: Fetching today's date>
<Function-GetPreviousTraveDetails: Fetching previous travels from last 180 days>
<Function-GetFlights: Fetching flights from HEL to ARN>
<Function-GetFlights: Departure time 30/09/2025 9.00.00, Return time 02/10/2025 18.00.00, Class Economy>
<Function-GetHotels: Fetching hotels in Stockholm>
<Function-GetHotels: Check-In Date 30/09/2025 15.00.00, Check-Out Date 02/10/2025 11.00.00, Number of Guests 1>
<Function-GetCarRentals: Fetching car rentals in Stockholm>
<Function-GetCarRentals: Check-In Date 30/09/2025 12.30.00, Check-Out Date 02/10/2025 17.00.00>
<Function-GetActivities: Fetching activities in Stockholm>
<Function-GetActivities: Date 01/10/2025 19.00.00>
{% endraw %}
**Assistant:** Here are my recommendations for your trip to Stockholm next week:

** Flight: HEL to ARN **

Here is my recommendation for flight from Helsinki (HEL) to Stockholm (ARN):

*Outbound:* Contoso Air CA123
Departure: Tuesday 09:00 | Arrival: Tuesday 12:00 | Duration: 3h | Class: Economy | Price: $300

*Return:* Contoso Air CA789
Departure: Thursday 18:00 | Arrival: Thursday 21:00 | Duration: 3h | Class: Economy | Price: $300

---

** Hotel in Stockholm **

Here is my recommendation for hotel in Stockholm (your usual hotel):

*Contoso Hotel*
Check-In: 2025-09-30 | Check-Out: 2025-10-02 | Number of Guests: 1 | Price per Night: $150

---

** Car Rental in Stockholm **

Here is my recommendation for car rental in Stockholm:

*Contoso Rentals*
Pick-Up: 2025-09-30 | Drop-Off: 2025-10-02 | Price per Day: $50

---

** Suggested Activity for Wednesday Evening **

You might enjoy this:

- *City Tour* | 2025-10-01 | Duration: 3 hours | Price: $100

---

** Total Costs (Flights, Hotel, Car Rental) **

- Flights: $600
- Hotel: $300 (2 nights x $150)
- Car Rental: $150 (3 days x $50)
**Total: $1,050**

---

Would you like me to proceed with *booking these flights, hotel, and car rental* for you?
*(The activity will need to be booked separately.)*

**User:** Yes please proceed

**Assistant:** Perfect! I'll proceed with finalizing the travel arrangements for you.
You will receive a **confirmation email shortly** including:
- Your **flight tickets**
- **Hotel booking confirmation**
- **Car rental confirmation**
- **Calendar invites** for all bookings

The listed Wednesday evening activity can be booked separately whenever you're ready.

---

Safe travels to Stockholm, Mr. Doe!
Enjoy your trip and have a great time exploring the city.
```

Here are additional capabilities that might be very useful in this kind of scenario and can be used to enhance the user experience:

- [Retrieval Augmented Generation (RAG)](https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview?tabs=docs) for fetching relevant information from large document repositories
- [Grounding with Bing Search](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/how-to/tools/bing-grounding) for fetching up-to-date information like weather, events, etc.
- [SharePoint](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/how-to/tools/sharepoint) or other document repository integration for company specific policies and guidelines

The above capabilities are Knowledge sources in the Azure AI Foundry Agent Service:

{% include imageEmbed.html link="/assets/posts/2025/10/01/traditional-app-vs-chat-based-app/agent-service3.png" %}

In this scenario, system prompt is more complex and if you add up all the
used functions and their output, it's totally 1000+ tokens.
Extending this scenario to handle a lot of other scenarios like all HR processes might easily become challenging.
In this case maybe it would be better to look for multi-agent architecture and orchestrate the user interactions across different agents.
Also, the above could be implemented using that kind of architecture and each of those functions could be operated parallelly by different agents.
This is a topic for another blog post.

I want to stress that you need to invest time in testing and ensuring that
the system prompt and other context elements works well with the LLM
and that it provides high-quality results.
And you need to make sure that security and prompt injections are also considered in this testing
(as I mentioned also in my previous post: 
[Automated Order Processing from emails with Logic Apps and Azure OpenAI]({% post_url 2025/09/2025-09-21-automated-order-processing %})),
This part is trickier in chat-based applications compared to traditional CRUD applications.
In traditional applications, you can validate and sanitize user inputs more easily and
we have established practices for unit testing for ensuring code quality.
SQL Injections in traditional applications are not anymore a big issue if you follow best practices
and use parameterized queries or ORM frameworks.
But prompt injections is the same thing but in different format.
Similarly, you should think about error handling and how it should be visible to the user.

You might encounter cases where more LLM specific testing is required, like travel time in this demo.
I noticed that the way you calculate travel dates requires additional prompting to get it right.
Initially, if I just said "_next week Tuesday for 3 days_", the model interpreted that as
Tuesday + 1 day = Wednesday, +1 day = Thursday, +1 day = Friday, so the return date was Friday.
But I realized, that this is not how most people would interpret "_for 3 days_" since they would typically
include the departure day as well.
So, I had to add additional guidance in the system prompt to ensure that the model understands this context:

```plain
When calculating travel dates, include both the departure and return dates
(e.g., if departing on a Monday and returning on Wednesday, that counts as 3 days)
but remember that hotel stays are calculated by stayed nights only.
```


Here's an example of my token usage metrics for `gpt-5-chat` model which I used for this example:

{% include imageEmbed.html link="/assets/posts/2025/10/01/traditional-app-vs-chat-based-app/token-usage.png" %}

---

For me, in scenario 2, the chat-based experience seems to be a better solution.
And I would really like to see this kind of experience in real life.

## Conclusion

In conclusion, both structured traditional CRUD-like applications and chat-based applications have their own strengths and weaknesses.
The choice between the two approaches depends on the specific use case and user needs.
Try to avoid coming to me with "_I have a business requirement to... and my solution is Chat-based app_".

And yes, I'm just going to put this out here:

> **It depends**

This post reminded me from one of my presentation from 2020. Here's the summary slide from that presentation:

{% include imageEmbed.html link="/assets/posts/2025/10/01/traditional-app-vs-chat-based-app/right-tool-for-the-right-job.png" %}

> Use the right tool for the right job

Code for the Travel assistant scenario is available in my GitHub:

- It's implemented so that Functions return hardcoded dummy data
- It's super easy to debug and see how the functions are called
  - Use this to learn how to build your own solution
- You can easily modify the code to call real APIs or databases

Have a look:

{% include githubEmbed.html text="JanneMattila/azure-ai-demos/01-SemanticKernelTravelAssistant" link="JanneMattila/azure-ai-demos/blob/main/src/01-SemanticKernelTravelAssistant/Program.cs" %}

Hope you found this post useful!
