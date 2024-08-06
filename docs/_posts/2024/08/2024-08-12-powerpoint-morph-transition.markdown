---
title: Enhance your PowerPoint presentations with morph transitions
image: /assets/posts/2024/08/12/powerpoint-morph/powerpoint2.png
date: 2024-08-12 06:00:00 +0300
layout: posts
categories: productivity
tags: productivity office powerpoint
---

PowerPoint has feature called
[Morph transition](https://support.microsoft.com/en-us/office/use-the-morph-transition-in-powerpoint-8dd1c7b2-b935-44f5-a74c-741d8d9244ea)
that allows you to create smooth animations between slides.

It has been there a long time but somehow, I have managed to miss one important part of the feature: **Naming of objects**.

You can use `!!` prefix to name objects allowing PowerPoint to morph these objects with the same name across slides. 

Let's check this out with a simple example:

1) Create a new PowerPoint presentation

2) Add a stock image of a cat on the first slide:
   - Insert > Pictures > Stock images

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/12/powerpoint-morph/powerpoint1.png" %}

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/08/12/powerpoint-morph/animal1.png" %}

3) Select the image and go to the Selection Pane:
   - Home > Select > Selection Pane

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2024/08/12/powerpoint-morph/selection-pane1.png" %}

4) Rename the image `Picture 4` to `!!Animal`:

{% include imageEmbed.html width="90%" height="90%" link="/assets/posts/2024/08/12/powerpoint-morph/selection-pane2.png" %}

After the name change:

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/08/12/powerpoint-morph/selection-pane3.png" %}

5) Create a new slide and add a different stock image to it

6) Rename the newly added image to `!!Animal` as well

7) Go to the Transitions tab and select Morph transition

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/12/powerpoint-morph/powerpoint2.png" %}

8) Now PowerPoint will automatically create a smooth transition between these two objects:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/12/powerpoint-morph/demo.gif" %}

You can use the above technique for visualizing complex architectural diagrams, process flows, data flows etc.

Here is one concrete example how you can use this feature:<br/>
_Visualize your Azure Kubernetes Service (AKS) application deployments during zonal failure_.<br/>
I will blog more about this in my upcoming [Azure Chaos Studio](https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-overview) post.

Here is simple PowerPoint slide demonstrating my AKS application deployment across three different availability zones:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/12/powerpoint-morph/aks-start.png" %}

I'll make sure that my objects are named so that they're easy to identify (do you still remember [Two Hard Things](https://martinfowler.com/bliki/TwoHardThings.html)?):

{% include imageEmbed.html width="70%" height="70%" link="/assets/posts/2024/08/12/powerpoint-morph/aks-pane.png" %}

I can now create new slides to show the transition between different states:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/08/12/powerpoint-morph/aks-final.png" %}

And here is the result demonstrating availability zone 2 outage:

{% include videoEmbed.html width="100%" height="100%" tags="autoplay muted controls loop" link="/assets/posts/2024/08/12/powerpoint-morph/aks-morph.mp4" %}

You might notice from my visualization that application instances marked with `(2)` are moved to the remaining two availability zones
but the application instance marked with `(1)` is not.
As mentioned earlier, I will blog more about this in my upcoming [Azure Chaos Studio](https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-overview) post.

Checkout also [Morph transition: Tips and tricks](https://support.microsoft.com/en-us/office/morph-transition-tips-and-tricks-bc7f48ff-f152-4ee8-9081-d3121788024f).

_Kudos to [Timo Salomäki](https://www.linkedin.com/in/hankidesign) for teaching me this cool trick!_
