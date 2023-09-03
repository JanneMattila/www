---
layout: posts
title:  "VS Code and faster script development"
image: /assets/posts/2023/08/28/vs-code-and-faster-script-development/share.gif
date:   2023-08-28 06:00:00 +0300
categories: development
tags: development scripting vscode
---
Many of my GitHub repositories contain `bash` and `PowerShell` script-based demos and examples.
I've heard that they're easy to follow because the structure is so simple.
Scripts start from top and continue to the bottom. Just execute line by line and you are done.
Each step along the way adds a bit new e.g., to the Azure deployment.
If something doesn't work, you should be able to easily find the problem because it should
be the last command you executed.

One reason why I managed to create so many examples over the years is that I've developed a rapid way to
work with the scripts. 
Here are the main points:

- Use [VS Code](https://code.visualstudio.com/)
- Use integrated terminal (PowerShell 7+ & WSL)
- Use keyboard as much as possible!
- Use [Send snippet to Terminal](https://marketplace.visualstudio.com/items?itemName=jannemattila.send-snippet-to-terminal) VS Code extension (created by me)


[![Send snippet to Terminal](/assets/posts/2023/08/28/vs-code-and-faster-script-development/share.gif)](/assets/posts/2023/08/28/vs-code-and-faster-script-development/share.gif)

[Send snippet to Terminal](https://marketplace.visualstudio.com/items?itemName=jannemattila.send-snippet-to-terminal)
extension is the key in this rapid development. 
It expands the code block automatically before sending it to Terminal.

Here is the source code for the extension:

{% include githubEmbed.html text="JanneMattila/vscode-send-snippet-to-terminal" link="JanneMattila/vscode-send-snippet-to-terminal" %}

**GitHub repository contains instructions on how to set it up so that you can
enable keyboard shortcuts such as** `Shift+Enter` **to send code block to Terminal.**

_But hey_, it's **not limited** to just `bash` and `PowerShell` scripts, since it works with any language.
It technically just sends selected text to Terminal.
I've used it with different programming languages which have [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) support.
`Python`, `Node.js` and of course markdown files including snippets are good examples.

---

I've only briefly mentioned this earlier in _Some-Questions-And-Some-Answers (SQASA)_ repository:

{% include githubEmbed.html text="JanneMattila/some-questions-and-some-answers" link="JanneMattila/some-questions-and-some-answers/blob/master/q%26a/vs_code.md" %}

Please try it out to see if you find it useful!
