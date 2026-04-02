
# Proxy Server with Caching

## Overview
This project implements a multithreaded HTTP proxy server in C. It forwards client HTTP GET requests to the corresponding remote server, caches the responses using an LRU (Least Recently Used) strategy, and serves cached responses when possible. It supports concurrent clients using POSIX threads.

---

## Workflow Summary

1. **Start server on port** (default 8080 or passed as argument).
2. **Accept client connections** and spawn a new thread per connection.
3. **Parse the incoming HTTP GET request**.
4. **If request is in cache**, serve from cache.
5. **If not cached**, forward the request to the remote server.
6. **Cache the response**, send it to the client.
7. Clean up and close the connection.

---

## File Breakdown

### 1. `proxy_parse.c` and `proxy_parse.h`
These handle parsing of raw HTTP request strings into structured `ParsedRequest` objects.

#### Key Functions
- `ParsedRequest_create()`: Allocates and initializes a new `ParsedRequest` struct.
- `ParsedRequest_parse()`: Parses a raw HTTP GET request string into fields like method, host, port, path, version, and headers.
- `ParsedRequest_unparse()`: Reconstructs the full HTTP request line and headers.
- `ParsedRequest_unparse_headers()`: Outputs only headers.
- `ParsedHeader_set/get/remove()`: Manage headers.
- `ParsedRequest_destroy()`: Frees memory for the request.

### 2. `Proxy_server_cache.c`
This file contains the main proxy server logic.

---

## Function Details

### Main Proxy Functions

#### `main(int argc, char *argv[])`
- Parses port number.
- Creates socket, binds, and listens.
- Spawns threads using `pthread_create()`.

#### `thread_fn(void *socketNew)`
- Handles a client connection.
- Parses request and checks cache.
- If in cache, returns cached response.
- Else, calls `handle_request()`.

#### `handle_request(int clientSocketId, struct ParsedRequest *request, char *tempReq)`
- Builds full HTTP request.
- Adds headers.
- Connects to remote server.
- Sends request and forwards response.
- Caches the response.

#### `connectRemoteServer(char *host_addr, int port_num)`
- Resolves DNS with `gethostbyname()`.
- Connects to remote server.

### LRU Cache Functions

#### Struct: `struct cache_element`
- Contains data, URL, timestamp, and next pointer.

#### `find(char *url)`
- Searches cache for URL.
- Updates timestamp on hit.

#### `add_cache_element(char *data, int size, char *url)`
- Adds a response to cache.
- Evicts old entries if needed.

#### `remove_cache_element()`
- Finds and removes the least recently used element.

---

## Synchronization
- `sem_t semaphore`: Limits max threads.
- `pthread_mutex_t lock`: Synchronizes cache access.

---

## Error Handling
- `sendErrorMessage(socket, code)`: Sends HTTP error messages.
- Uses `WSAGetLastError()` on Windows for socket errors.

---

## Notes
- Only supports HTTP GET.
- Works for HTTP/1.0 and HTTP/1.1.
- No HTTPS or POST support.

---

## Example Request Flow

```
Client ----HTTP GET---> Proxy Server
      <---CACHE?--Yes-- Return cached response
                    No --> Forward to Remote Server
                         <-- Response -- Save to Cache
                               \--> Forward to Client
```

---

## Conclusion
This proxy server is a great learning project for HTTP, sockets, multithreading, and caching in C. It’s clean, expandable, and mimics real proxy behavior.
=======
# HTTP_Proxy_Server

## How to Run

```bash
$ git clone https://github.com/arnavnigam31/HTTP_Proxy_Server.git
$ make all
$ ./proxy <port no.>
```
`Open http://localhost:port/https://www.cs.princeton.edu/`

![image](https://github.com/user-attachments/assets/ee8a7492-19ed-4102-a9fe-4902b7a7075f)
>>>>>>> 833f91f (frontend)
