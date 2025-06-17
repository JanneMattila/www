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
# Build the image
docker build -t blog .

# Run the container
docker run -d -p 8080:80 blog

start http://localhost:8080

docker tag blog jannemattila/blog:2025-06-17
docker push jannemattila/blog:2025-06-17
```
