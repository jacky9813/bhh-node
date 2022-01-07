# Better HTTP Handler (BHH) for node.js

## Quickstart

```js
const BHH = require("bhh-node");

var server = new BHH();
server.maxRequestBodySize = 500; //Bytes

server.register_handler(
    "/test/{test_arg}",
    (request, response, argv)=>{
        console.log(`Received argument ${argv.test_arg}`)
        response.writeHead(
            200,
            {
                "Content-Type": "application/json"
            }
        );
        response.end(JSON.stringify({
            result: "success",
            args: argv
        }));
    }
);

server.register_handler(
    "/test",
    (request, response, argv) => {
        try{
            var data = JSON.parse(request.body);
        } catch(e){
            server.errorHandler(request, response, {error:400, message:e.message}, 400);
            return;
        }
        response.writeHead(
            200,
            {
                "Content-Type": "application/json"
            }
        )
        response.end(JSON.stringify({
            result: "success",
            data: data
        }));
    },
    "POST"
)

console.log("Listening on port 8080");
server.listen(8080);
```

# Reference

## new BHH()
Constructor of the BHH class. No argument is needed.
## BHH.listen()
The same as [http.Server.listen()](https://nodejs.org/api/http.html#serverlisten)
## BHH.register_handler(path, handler, method?, optional_trail_slash?)
| Argument | Type | Description |
| --- | --- | --- |
| `path` | string | URI format. Using the `{}` bracket means that the section is a variable. `{}` is suggested to be used between two slashes. |
| `handler` | function ([IncomingMessage](https://nodejs.org/api/http.html#class-httpincomingmessage), [ServerResponse](https://nodejs.org/api/http.html#class-httpserverresponse), Object) | The handler. `Object` in 3rd is the named variables sources from the URI. |
| `method` | string | Request method. Default: `GET` |
| `optional_trail_slash` | boolean | If the URI have optional `/` at the end. Default: `true` |

## Property defaultPages
| | |
| --- | --- |
| Type | `Array(string)` | 
| Default value | `["index.html", "index.htm"]` |

A list of filenames that can be served as static file when requesting a directory.
## Property errorHandler
| | |
| --- | --- |
| Type | function ([IncomingMessage](https://nodejs.org/api/http.html#class-httpincomingmessage), [ServerResponse](https://nodejs.org/api/http.html#class-httpserverresponse), Object, int) |
| Default value | `BHH.prototype._error` |

Normalized error handling function. 

Third argument is some basic information about the error.

Forth argument is the suggested HTTP status code to be sent.

When server built-in error is triggered (e.g. static file not found), this handler will be triggered like `server.errorHandler(request, response, {error: 404, message:"Not found"}, 404)`

## Property maxRequestBodySize
| | |
| --- | --- |
| Type | `number` |
| Default value | `1000` |

The maximum allowed size for request body.

## Property staticRoot
| | |
| --- | --- |
| Type | `string` |
| Default value | `""` |

Static file will be searched when no handler available for a path. `staticRoot` is a path that contains all static files.