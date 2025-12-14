---
layout: posts
title:  "My Advent of Code 2025 summary"
image: /assets/posts/2025/12/14/advent-of-code/day7.png
date:   2025-12-14 06:00:00 +0300
categories: appdev
tags: appdev advent-of-code aoc fun
---

This year I wanted to continue the tradition from
[last year]({% post_url 2024/12/2024-12-27-advent-of-code-visualizations %})
and 
[year before that]({% post_url 2023/12/2023-12-29-advent-of-code-visualizations %})
and share my summary and some visualizations for [Advent of Code 2025](https://adventofcode.com/).

This year there was 12 days of puzzles compared to previous years 25 days.

#### Day 7

Tachyon beams and splitters:

{% include youtubeEmbed.html id="HQWdytH6orQ" %}

I don't now why, but I really like these kinds of puzzles:

{% include imageEmbed.html imagesize="80%" link="/assets/posts/2025/12/14/advent-of-code/day7.png" %}

#### Day 10

I used [Z3](https://github.com/Z3Prover/z3) which is
a theorem prover from Microsoft Research.
I immediately thought one puzzle from two years ago
when I first used Z3 and it turned out to be useful again this year.

Idea was to create formulas for each voltage requirement
with button presses as variables.
Then I used Z3 optimizer to minimize the total button presses.

I first created these formulas on paper to validate the idea (yes it was awfully messy):

{% include imageEmbed.html imagesize="80%" link="/assets/posts/2025/12/14/advent-of-code/day10-snippet.jpg" %}

Here is the main code snippet of that solution:

```csharp
var ctx = new Context();
var optimizer = ctx.MkOptimize();

List<int> resultButtonPresses = [];
List<IntExpr> buttonExpressions = [];
for (int button = 0; button < machine.ButtonList.Count; button++)
{
  var buttonExpr = ctx.MkIntConst($"button_{button}");
  buttonExpressions.Add(buttonExpr);
  optimizer.Add(buttonExpr >= 0);
}

for (int voltage = 0; voltage < machine.VoltageRequirements.Count; voltage++)
{
  ArithExpr left = ctx.MkInt(0);
  for (int button = 0; button < machine.ButtonList.Count; button++)
  {
    if (machine.ButtonList[button].Contains(voltage))
    {
      left = ctx.MkAdd(left, buttonExpressions[button]);
    }
  }

  var right = ctx.MkInt(machine.VoltageRequirements[voltage]);
  optimizer.Add(ctx.MkEq(left, right)); // A + B + ... = requiredVoltage
}

ArithExpr totalPresses = ctx.MkInt(0);
foreach (var buttonExpr in buttonExpressions)
{
  totalPresses = ctx.MkAdd(totalPresses, buttonExpr);
}
optimizer.MkMinimize(totalPresses);

optimizer.Check();
var model = optimizer.Model;

List<Expr> results = [];
for (int button = 0; button < machine.ButtonList.Count; button++)
{
  var expr = model.Eval(buttonExpressions[button]);
  results.Add(expr);
}

for (int button = 0; button < machine.ButtonList.Count; button++)
{
  var text = results[button].ToString();
  resultButtonPresses.Add(int.Parse(text));
}

return resultButtonPresses.Sum();
```

#### Day 11

Time for [Mermaid](https://mermaid.live/) diagrams (see previous years for background)!

{% include imageEmbed.html imagesize="100%" link="/assets/posts/2025/12/14/advent-of-code/day11.png" %}

As you can see from the diagram, it is a humangous map!
I've highlighted with red arrow the starting point,
with green arrows the intermediate points and with blue arrow the end point.

Unfortunately, when I was building my solution I stumbled
a bit and took extra time to finally solve this puzzle.
The key, _of course_, was to use path from start to first intermediate point,
then from there to second intermediate point and finally to the end point.

#### Day 12

Day 12 really got me. I struggled a lot and really tried to find way to solve it.
With example input it was easy to find the solution and I created
ways to validate the solution visually:

{% include imageEmbed.html imagesize="40%" link="/assets/posts/2025/12/14/advent-of-code/day12.png" %}

But the real input was so much bigger than I couldn't figure out how to solve it.
I finally gave up and peeked at the [r/adventofcode](https://www.reddit.com/r/adventofcode/) and [2025 Day 12 Solutions](https://www.reddit.com/r/adventofcode/comments/1pkje0o/2025_day_12_solutions/) megathread.

And yes, immediately I understood that the good old trick to confuse puzzle solver like
me really did it job well:

{% include imageEmbed.html imagesize="40%" link="/assets/posts/2025/12/14/advent-of-code/excel.png" %}

Here is my visualization of the solution (but I had to add a bit more variance in presents to show cooler visualization):

{% include youtubeEmbed.html id="0Jp61jzLuZ8" %}

#### Community visualizations

My visualizations don't compare to some of the amazing visualizations
created by the community:

[[2025 Day 8 Part 1] Wanted to see what it would look like to stand next to all those hooked-up junction boxes. (Blender)](https://www.reddit.com/r/adventofcode/comments/1pjq8e5/2025_day_8_part_1_wanted_to_see_what_it_would/)

[[2025 Day 08 Part 2]](https://www.reddit.com/r/adventofcode/comments/1pkumaa/2025_day_08_part_2/)

[[2025 Day 9 (Part 2)] [Python] Terminal toy!](https://www.reddit.com/r/adventofcode/comments/1pidqdz/2025_day_9_part_2_python_terminal_toy/)

[[2025 Day 10 (Part 1)] [Python] Terminal toy!](https://www.reddit.com/r/adventofcode/comments/1pjtkvn/2025_day_10_part_1_python_terminal_toy/)

### In closing

Yet another year of Advent of Code has passed. As always, 
I want to give a big shout out to [Eric Wastl](https://x.com/ericwastl) for creating another amazing event:

{% include imageEmbed.html imagesize="40%" link="/assets/posts/2025/12/14/advent-of-code/aoc-stars.png" %}

I still have some puzzles to finish up from 2017 and 2018. Maybe next year I'll find time to finish those.