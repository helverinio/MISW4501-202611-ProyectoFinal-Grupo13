FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom config
COPY nginx.conf /etc/nginx/conf.d/

# Increase worker connections for high concurrency
RUN sed -i 's/worker_connections  1024;/worker_connections  4096;/' /etc/nginx/nginx.conf

EXPOSE 80
