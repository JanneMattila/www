---
title: Automated Order Processing from emails with Logic Apps and Azure OpenAI
image: /assets/posts/2025/09/21/automated-order-processing/email1.png
date: 2025-09-21 06:00:00 +0300
layout: posts
categories: azure
tags: azure ai logicapp
---

Many organizations have processes that rely on manual handling of emails. For example, a company may
receive orders via email. Processing these orders manually can be time-consuming and error-prone.
In this blog post, we will explore how you could automate the order processing workflow using Azure Logic Apps and Azure OpenAI.

Let's begin by identifying how the order emails typically look. Here's an example of an order email:

{% include imageEmbed.html link="/assets/posts/2025/09/21/automated-order-processing/email1.png" %}

Here's a second example when data is copied from Excel and pasted into an email:

{% include imageEmbed.html link="/assets/posts/2025/09/21/automated-order-processing/email2.png" %}

And here's a third example where the order details are in an attachment:

{% include imageEmbed.html link="/assets/posts/2025/09/21/automated-order-processing/email3.png" %}

{% include imageEmbed.html link="/assets/posts/2025/09/21/automated-order-processing/email3-attachment.png" %}

As you can see, the format of these emails can vary significantly.
Some of them may contain inline tables in many different formats, while others may have the order details in attachments
again in various different formats.

Let's start by creating a Logic App that triggers when a new email arrives in a specific mailbox or folder:

{% include imageEmbed.html imagesize="50%" link="/assets/posts/2025/09/21/automated-order-processing/la1.png" %}

You can set various filters to ensure that only relevant emails trigger the workflow:

{% include imageEmbed.html imagesize="50%" link="/assets/posts/2025/09/21/automated-order-processing/la1-1.png" %}

If we now study the email content when the email had the order inline, we can see that the email body is in HTML format.
Here is _an abbreviated version_ of the email body:


```html
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:m="http://schemas.microsoft.com/office/2004/12/omml" xmlns="http://www.w3.org/TR/REC-html40"><head><meta http-equiv=Content-Type content="text/html; charset=utf-8"><meta name=Generator content="Microsoft Word 15 (filtered medium)"><style><!--
/* Font Definitions */
@font-face
	{font-family:"Cambria Math";
	panose-1:2 4 5 3 5 4 6 3 2 4;}
--></style></head>
<body lang=en-FI link="#467886" vlink="#96607D" style='word-wrap:break-word'>
<div class=WordSection1><p class=MsoNormal><span lang=EN-US>Hi!<o:p></o:p></span></p>
<p class=MsoNormal><span lang=EN-US>I would need these by the end of this week. Is that doable?<o:p></o:p></span></p>
<p class=MsoNormal><span lang=EN-US><o:p>&nbsp;</o:p></span></p><p class=MsoNormal><span lang=EN-US>BR,<o:p></o:p></span></p>
<p class=MsoNormal><span lang=EN-US><o:p>&nbsp;</o:p></span></p><p class=MsoNormal><span lang=EN-US>J</span><span lang=FI style='font-family:"Calibri",sans-serif;mso-ligatures:none;mso-fareast-language:FI'><o:p></o:p></span></p>
<p class=MsoNormal><span lang=en-FI><o:p>&nbsp;</o:p></span></p><p class=MsoNormal><o:p>&nbsp;</o:p></p>
</div></body></html>
```

Oh boy, that's a lot of HTML tags! We need to clean this up to get the relevant content from the email.

Before we do that, let's also process any potential orders from attachments:

{% include imageEmbed.html imagesize="50%" link="/assets/posts/2025/09/21/automated-order-processing/la2.png" %}

In this step we process one attachment at a time using Azure Functions.
We'll simplify this step and plan to only process Excel files
with [MarkItDown](https://github.com/microsoft/markitdown).
It is such a powerful library that it can convert many different formats into markdown format. 
Here's the full code of our Azure Function that uses MarkItDown to convert the attachment content into markdown format:

```python
import azure.functions as func
from markitdown import MarkItDown
import io

app = func.FunctionApp()

@app.function_name(name="Converter")
@app.route(route="", auth_level=func.AuthLevel.ANONYMOUS)
def Converter(req: func.HttpRequest) -> func.HttpResponse:
    md = MarkItDown()
    result = md.convert_stream(io.BytesIO(req.get_body()))
    return func.HttpResponse(result.text_content, mimetype="text/markdown")
```

There is also [MarkItDown MCP](https://github.com/microsoft/mcp#-markitdown) if you want to build agent
that can process documents in various formats.

To deploy this Python function to Azure, you can follow the instructions here:
[Create a function in Azure from the command line](https://learn.microsoft.com/en-us/azure/azure-functions/how-to-create-function-azure-cli?pivots=programming-language-python&tabs=windows%2Cpowershell%2Cazure-cli)


{% include imageEmbed.html imagesize="50%" link="/assets/posts/2025/09/21/automated-order-processing/la3.png" %}

{% include imageEmbed.html link="/assets/posts/2025/09/21/automated-order-processing/la3-1.png" %}

```plain
There is content from email from the user. It might be in plain text or HTML or whatever format. Clean it up to be markdown format:

@{variables('emailContent')}
```

{% include imageEmbed.html imagesize="60%" link="/assets/posts/2025/09/21/automated-order-processing/la3-2.png" %}

Here's the expression used in the above step:

```plain
first(body('Clean_user_inputs')['choices'])?['message']?['content']
```

Here's an example output from this part of the process:

```plain
Here is the data:

Subject: Order from Jack

Body:

Hello there!

Find my orders from the attachment.

Thanks!

Jack

Attachment — orders-2025.xlsx (Sheet1)

| Product | Qty | Comment |
| --- | ---: | --- |
| P123 | 5 | We need this before end of the month |
| P345 | 4 |  |
```

{% include imageEmbed.html imagesize="50%" link="/assets/posts/2025/09/21/automated-order-processing/la4.png" %}

```plain
You are sales agent trying to identity what product user is trying to buy. User might provide this information in any kind of format. From their provided material you should identify list of products and their quantities. If user has some other important information that impacts their order, then collect this information as well. Example: "I would need this by end of this week" which would be hard requirement to their purchase. This information can be also product specific and not entire order specific.

Summarize this information into this format:
{
  "text": "insert original user text here",
  "description": "insert any additional information that user has provided e.g., hard requirements here",
  "products": [
    {
      "productId": "first product id",
      "qty": 2,
      "description": "any product specific information from user"
    },
    {
      "productId": "second product id",
      "qty": 5,
      "description": "any product specific information from user"
    }
  ]
}

Here is the user provided information:

@{variables('emailContentText')}
```

Similarly, here's the expression used to extract the response from Azure OpenAI:

```plain
first(body('Convert_users_input_text_to_JSON')['choices'])?['message']?['content']
```

Here's the expected output format:

```json
{
  "text": "insert original user text here",
  "description": "insert any additional information that user has provided e.g., hard requirements here",
  "products": [
    {
      "productId": "first product id",
      "qty": 2,
      "description": "any product specific information from user"
    },
    {
      "productId": "second product id",
      "qty": 5,
      "description": "any product specific information from user"
    }
  ]
}
```

Here is an example output when the order details were in an attachment:

```json
{
  "text": "Subject: Order from Jack\n\nBody:\n\nHello there!\n\nFind my orders from the attachment.\n\nThanks!\n\nJack\n\nAttachment — orders-2025.xlsx (Sheet1)\n\n| Product | Qty | Comment |\n| --- | ---: | --- |\n| P123 | 5 | We need this before end of the month |\n| P345 | 4 |  |",
  "description": "Order details provided in attachment orders-2025.xlsx (Sheet1). No additional global constraints, but P123 has a timing requirement (see product-specific info).",
  "products": [
    {
      "productId": "P123",
      "qty": 5,
      "description": "We need this before end of the month"
    },
    {
      "productId": "P345",
      "qty": 4,
      "description": ""
    }
  ]
}
```

Here's the entire Logic App workflow:

{% include imageEmbed.html imagesize="60%" link="/assets/posts/2025/09/21/automated-order-processing/la5.png" %}

Unfortunately, many different kind of errors can happen in this process.
Here's an example of an email that did not have any attachment since the user forgot to add it:

{% include imageEmbed.html link="/assets/posts/2025/09/21/automated-order-processing/email-no-attachment.png" %}

Similarly, the user might provide invalid product IDs or quantities that are not numbers or formatting of 
attachment might be something that MarkItDown cannot handle.

Of course, this implementation just a starting point. In a real-world scenario, you would need to add more steps to handle:

- You need to consider error scenarios, logging, monitoring, alerting etc.
- Store the original email, extracted order details and any errors to a database or storage for auditing and troubleshooting.
- Validate the extracted product IDs and quantities against your product catalog.
- Design human-in-the-loop (HITL) processes for cases where the system is unsure about the order details.
- Integrate with your order management system to create the order automatically.
- Send a confirmation email to the user with the extracted order details.

etc.

Alternatively, you might want to start with a semi-automated process where the system extracts the order details,
validates it and sends them to a human for review before finalizing the order.
It can also create a prebaked email draft to the user.
User can then just review the email and click button to send it.
Here's a mockup of such user interface:

{% include imageEmbed.html imagesize="70%" link="/assets/posts/2025/09/21/automated-order-processing/automated-order-processing.png" %}

You can find the source code of the Function App here:

{% include githubEmbed.html text="JanneMattila/azure-ai-demos/pythonfunc" link="JanneMattila/azure-ai-demos/tree/main/src/pythonfunc" %}

Hope you found this useful!