FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY docs/_site /usr/share/nginx/html
EXPOSE 80
