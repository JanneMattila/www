# www

## Install

[Jekyll on Windows](https://jekyllrb.com/docs/installation/windows/)

```powershell
gem install bundler
bundle clean --force
bundle install

bundle install

bundle update --bundler
gem update
gem update --system
```

## Run locally

```powershell
cd docs
bundle exec jekyll serve
```

## Run using image

```powershell
podman machine start
# Build the image
podman build -t blog .

# Run the container
podman run -d -p 8080:80 blog

start http://localhost:8080

podman tag blog jannemattila/blog:2025-06-19
podman push jannemattila/blog:2025-06-19

podman machine stop
```
