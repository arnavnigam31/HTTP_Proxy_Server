#!/bin/bash

echo "Compiling C proxy..."
gcc Proxy_server_cache.c proxy_parse.c -o proxy -lpthread

echo "Starting proxy..."
./proxy_server 8080 &

echo "Starting node bridge..."
node server.js 8080
