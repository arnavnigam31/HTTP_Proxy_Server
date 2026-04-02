#!/bin/bash

echo "Compiling C proxy..."
gcc Proxy_server_cache.c proxy_parse.c -o proxy -lpthread

echo "Starting proxy..."
./proxy 8080 &

echo "Starting node bridge..."
node server.js 
