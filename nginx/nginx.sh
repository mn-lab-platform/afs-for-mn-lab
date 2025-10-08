.sh
#!/bin/sh

echo "Starting Nginx without SSL..."
echo "Nginx will serve HTTP traffic on port 80"

# Create logs directory
mkdir -p /logs/nginx

echo "Starting Nginx..."
exec nginx -g "daemon off;"