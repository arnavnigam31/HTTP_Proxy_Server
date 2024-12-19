CC=g++
CFLAGS=-g -Wall -pthread
TARGET=proxy

all: $(TARGET)

$(TARGET): Proxy_server_cache.o proxy_parse.o
	$(CC) $(CFLAGS) -o $(TARGET) Proxy_server_cache.o proxy_parse.o

Proxy_server_cache.o: Proxy_server_cache.c
	$(CC) $(CFLAGS) -c Proxy_server_cache.c -o Proxy_server_cache.o

proxy_parse.o: proxy_parse.c proxy_parse.h
	$(CC) $(CFLAGS) -c proxy_parse.c -o proxy_parse.o

clean:
	rm -f $(TARGET) *.o

tar:
	tar -cvzf ass1.tgz Proxy_server_cache.c README Makefile proxy_parse.c proxy_parse.h
