CC=gcc
CFLAGS=-Wall -pthread
LIBS=

all: proxy_server

proxy_server: Proxy_server_cache.c proxy_parse.c
	$(CC) $(CFLAGS) -o proxy_server Proxy_server_cache.c proxy_parse.c $(LIBS)

clean:
	del proxy_server.exe 2>nul || rm -f proxy_server
