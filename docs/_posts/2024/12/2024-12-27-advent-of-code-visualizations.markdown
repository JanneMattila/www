---
layout: posts
title:  "My Advent of Code 2024 visualizations"
image: /assets/posts/2024/12/27/advent-of-code/day14.png
date:   2024-12-27 06:00:00 +0300
categories: appdev
tags: appdev advent-of-code aoc fun
---

This year I wanted to continue the tradition from
[last year]({% post_url 2023/12/2023-12-29-advent-of-code-visualizations %})
and share my visualizations for [Advent of Code 2024](https://adventofcode.com/).

#### Day 6

Traditional map visualization:

{% include youtubeEmbed.html id="wZkEh1X708g" %}

#### Day 14

Day 14 was fun since I first didn't quite understand how to find the _Easter egg_.
Therefore, I started creating the visualization just to find out that by accident I managed to see
flash of this Christmas tree when my animation was running:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/12/27/advent-of-code/day14.png" %}

Here is the full animation:

{% include youtubeEmbed.html id="Kz-00XgRUzw" %}

#### Day 15

Warehouse robot pushing boxes around:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/12/27/advent-of-code/day15.png" %}

{% include youtubeEmbed.html id="_nVoe1oQ2xY" %}

#### Day 23

Immediately, when I saw this puzzle, I thought that I have to use graphs to understand it better.
So, I created a few illustrations using 
[Mermaid](https://mermaid.live/) and
[GraphvizOnline](https://dreampuf.github.io/GraphvizOnline)
from the example dataset:

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/12/27/advent-of-code/day23-graph1.png" %}

This illustration helped me to to understand that I'm looking for largest _full mesh_ in the network:

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/12/27/advent-of-code/day23-graphviz1.png" %}

Much easier to implement when you have clear picture what to do!

#### Day 24

It was clear from the start that part 2 is not going to be solvable for me without graph illustrations.

I started with just overview diagram (it really is humongous!):

{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/12/27/advent-of-code/day24-graph.png" %}

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/12/27/advent-of-code/day24-graph2.png" %}

Adding colors made it slightly more easier to study:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/12/27/advent-of-code/day24-graph3.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/12/27/advent-of-code/day24-graph4.png" %}

Here is GraphViz version of the graph:

{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/12/27/advent-of-code/day24-graphviz1.png" %}
{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/12/27/advent-of-code/day24-graphviz2.png" %}

Snippet from the above [mermaid](https://mermaid.live/) diagram:

```text
stateDiagram-v2
    classDef red fill:#f00,color:white,font-weight:bold,stroke-width:2px,stroke:yellow
    classDef green fill:#0f0,color:white,font-weight:bold,stroke-width:2px,stroke:yellow
    classDef white fill:#fff,color:black,font-weight:bold,stroke-width:2px,stroke:yellow
    classDef blue fill:#00f,color:white,font-weight:bold,stroke-width:2px,stroke:yellow
    class smr green
    class z03 blue
    class qhs green
    class tvv green
    class cph white
    class gws white
    class hgj white
    class nnt white
    class npf white
    class z13 white
    class z19 white
    class z33 white

    y41 --> smr
    x41 --> smr
    bsj --> z03
    hgq --> z03
```

But none of my visualizations were even close to the ones created by the community members:

[[2024 Day 24 (Part 2)] Some improvement in my visualization](https://www.reddit.com/r/adventofcode/comments/1hm78rg/2024_day_24_part_2_some_improvement_in_my/)

[[2024 Day24 (Part 2)] Visualisation before and after swaps](https://www.reddit.com/r/adventofcode/comments/1hmfi1t/2024_day24_part_2_visualisation_before_and_after/)

[[2024 Day 24] Narrowing Down The Culprits](https://www.reddit.com/r/adventofcode/comments/1hmbug2/2024_day_24_narrowing_down_the_culprits/)

They also contain some incredible solutions like
[this](https://www.reddit.com/r/adventofcode/comments/1hl698z/comment/m3kt1je/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1) as an example.

I ended up by running the calculation and always stop to first bit that did not produce the correct value.
I then studied the graph and tried to find correct wires to swap. Here is the first fix to correct the `z09` value:
{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/12/27/advent-of-code/day24-fix1.png" %}

Here is the second fix to correct value in `z13`:
{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/12/27/advent-of-code/day24-fix2.png" %}

Third fix for `z19`:

{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/12/27/advent-of-code/day24-fix3.png" %}

And last fix for `z33`:

{% include imageEmbed.html width="60%" height="60%" link="/assets/posts/2024/12/27/advent-of-code/day24-fix4.png" %}

#### Community visualizations

There are lively discussions in the  community around the solutions.
People help each other out and explain their solutions so that others can benefit from them.

[https://www.reddit.com/r/adventofcode](https://www.reddit.com/r/adventofcode)

As every year, many people have built amazing visualizations around these puzzles.

I picked a few examples:

[[2024 Day 16] Optimal Path Finding](https://www.reddit.com/r/adventofcode/comments/1hfxrc1/2024_day_16_optimal_path_finding/)

[500 ⭐ in less than a second](https://www.reddit.com/r/adventofcode/comments/1hlyocd/500_in_less_than_a_second/)

[[2024 Day 25] [Python] Terminal Visualization!](https://www.reddit.com/r/adventofcode/comments/1hm4047/2024_day_25_python_terminal_visualization/)

### In closing

_Again_, I want to give a big shout out to [Eric Wastl](https://twitter.com/ericwastl) for creating 10th Advent of Code event:

{% include imageEmbed.html width="80%" height="80%" link="/assets/posts/2024/12/27/advent-of-code/aoc-stars.png" %}

Every year it manages to surprise me how well arranged event it is and how amazing puzzles you get to solve during December.

Already waiting for next year. See you there!
