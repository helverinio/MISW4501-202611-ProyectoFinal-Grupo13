FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom config
COPY nginx.conf /etc/nginx/conf.d/

# Increase worker connections and enable multi_accept for high concurrency
RUN sed -i 's/worker_connections  1024;/worker_connections  8192;/' /etc/nginx/nginx.conf && \
    sed -i '/worker_connections/a\        multi_accept on;' /etc/nginx/nginx.conf && \
    sed -i 's/worker_processes  auto;/worker_processes  4;/' /etc/nginx/nginx.conf

EXPOSE 80
