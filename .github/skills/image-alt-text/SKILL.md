---
name: image-alt-text
description: Generates alt text for images to improve accessibility.
---
# Generating Alt Text for Images

Markdown document contains image references like this:

```markdown
{% include imageEmbed.html imagesize="80%" link="/assets/posts/2025/12/14/advent-of-code/day7.png" %}
```

You need to find the image based on the `link` attribute and generate descriptive alt text for it.
Path in the above example is `/assets/posts/2025/12/14/advent-of-code/day7.png` which means the
image is located in the repository at `docs/assets/posts/2025/12/14/advent-of-code/day7.png`.
Check that image exists in the repository.

Here is example alt text for the above image:
"Diagram showing a series of interconnected nodes representing a network of computers communicating with each other."

You should provide alt text that accurately describes the content and context of the image to enhance accessibility for users relying on screen readers.

Update the image reference in the Markdown document to include the generated alt text like this:

```markdown
{% include imageEmbed.html imagesize="80%" alt="Diagram showing a series of interconnected nodes representing a network of computers communicating with each other." link="/assets/posts/2025/12/14/advent-of-code/day7.png" %}
```

Make sure the alt text is concise yet descriptive, capturing the essence of the image without being overly verbose.
Repeat this process for all image references in the Markdown document to ensure each image has appropriate alt text.
