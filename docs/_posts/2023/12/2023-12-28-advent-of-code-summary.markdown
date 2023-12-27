---
layout: posts
title:  "My Advent of Code 2023 summary and visualizations"
image: /assets/posts/2023/12/27/advent-of-code/aoc-2023-day23.png
date:   2023-12-28 06:00:00 +0300
categories: appdev
tags: appdev advent-of-code aoc fun
---
[Advent of Code 2023](https://adventofcode.com/) is now over.
25 days of intense coding puzzles behind us.
I'm sure every participant learned something new and I can assure you that I did.

Before Advent of Code 2023 started I wrote about it
[in this blog]({% post_url 2023/11/2023-11-27-advent-of-code %})
and mentioned that I haven't done many visualizations for my solutions
over the years.

But this year I took a another approach and tried to build visualization if I had
good idea how to visualize my solution.

So, here are my visualizations for Advent of Code 2023:

#### Day 11

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2023/12/28/advent-of-code/aoc-2023-day11.png" %}

#### Day 14

{% include youtubeEmbed.html id="5HSWmVC7ik4" %}

#### Day 16

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2023/12/28/advent-of-code/aoc-2023-day16.png" %}

{% include youtubeEmbed.html id="iPueaulpbNY" %}

#### Day 17

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2023/12/28/advent-of-code/aoc-2023-day17.png" %}

{% include youtubeEmbed.html id="A3O6QSj8Qes" %}

#### Day 18

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2023/12/28/advent-of-code/aoc-2023-day18.png" %}

{% include youtubeEmbed.html id="69n5d7wjE4w" %}

#### Day 20

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2023/12/28/advent-of-code/aoc-2023-day20.png" %}

Snippet from the above [mermaid](https://mermaid.live/) diagram:

```text
stateDiagram-v2
    classDef red fill:#f00,color:white,font-weight:bold,stroke-width:2px,stroke:yellow
    classDef green fill:#0f0,color:white,font-weight:bold,stroke-width:2px,stroke:yellow
    classDef green2 fill:#0f0,color:black,font-weight:bold,stroke-width:2px,stroke:yellow
    classDef blue fill:#00f,color:white,font-weight:bold,stroke-width:2px,stroke:yellow
    class rx red
    class gq green
    class xj green2
    class qs green2
    class kz green2
    class km green2
    
    dj --> fj
    dj --> jn
    xz --> cm
    fn --> rj
    fv --> nt
    fv --> zp
```

#### Day 23

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2023/12/28/advent-of-code/aoc-2023-day23.png" %}

{% include youtubeEmbed.html id="KgpGITQ7oUk" %}

#### Day 25

[Mermaid](https://mermaid.live/) is a great tool for creating diagrams
as seen in the above day 20 visualization.
I tried to use it for day 25 as well but learned that there were too many
data points to succesfully visualize my dataset using it.

In the [discussions](https://www.reddit.com/r/adventofcode/comments/18qbsxs/2023_day_25_solutions/) I learned about
[Graphviz](https://graphviz.org/) and then [GraphvizOnline](https://dreampuf.github.io/GraphvizOnline)
which seemed to work just fine:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2023/12/28/advent-of-code/aoc-2023-day25-1.png" %}

Zoomed in for the critical part:
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2023/12/28/advent-of-code/aoc-2023-day25-2.png" %}

Here is snippet how you can also generate similar graphs:

```text
graph G {
  dlk -- skp;
  dlk -- knc;
  dlk -- vqm;
  dlk -- nnh;
  dlk -- prk;
  dlk -- kkl;
  dlk -- hpk;
  skp -- rrz;
  skp -- sjh;
  skp -- rfn;
}
```

### Community visualizations

Nothing in the above compares to the many community [visualizations](https://www.reddit.com/r/adventofcode/?f=flair_name%3A%22Visualization%22).

To show level of the visualizations from the community, here's 
[Advent of Code 2023, visualizations (all days)](https://www.youtube.com/watch?v=vb7JcjZs_GM) by [Guillaume Brunerie](https://www.youtube.com/@guillaumebrunerie):

{% include youtubeEmbed.html id="vb7JcjZs_GM" %}

### Summary

Huge appreciation to [Eric Wastl](https://twitter.com/ericwastl) for creating such an amazing event.
I can't even imagine how much work it takes to create all the puzzles and the stories.

Now I have to go the previous events and try to solve those remaining
52 puzzles that are still unsolved for me.

See you next year!
