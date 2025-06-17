FROM nginx:alpine
COPY docs/_site /usr/share/nginx/html
EXPOSE 80
