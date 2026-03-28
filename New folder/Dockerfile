# speciesmap.org — Landing page Dockerfile
# Pure static HTML served with nginx

FROM nginx:alpine

COPY index.html /usr/share/nginx/html/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
