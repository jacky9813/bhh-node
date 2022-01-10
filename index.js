const http = require("http");
const systempath = require("path");
const fs = require("fs");
const mime = require("mime-types");

class DuplicateError extends Error{}

const path_get_variable = /{([A-Za-z0-9_]*)}/g

class BHH{
    constructor(){
        this.defaultPages = [
            "index.html",
            "index.htm"
        ];
        this._handlers = {};
        this.staticRoot = "";
        this.maxRequestBodySize = 1000;
        this.errorHandler = this._error;
        this._server = http.createServer(async (req, res) => {
            var matchFound = false;
            var path_list = Object.keys(this._handlers);
            var handle_start = new Date();
            for(var i=0; i<path_list.length; i++){
            // Object.keys(this._handlers).forEach((path)=>{
                var path = path_list[i];
                var handler_obj = this._handlers[path];
                var match = handler_obj.regexp.exec(req.url);
                if (match) {
                    matchFound = true;
                    var argv = {};
                    handler_obj.variables.forEach((var_name, i)=>{
                        argv[var_name] = decodeURIComponent(match[i+1]);
                    });

                    if (handler_obj.handler.hasOwnProperty(req.method.toUpperCase())){
                        await new Promise((resolve, reject)=>{
                            // Fetching request body
                            let reqBody = '';
                            req.on("data", chunk =>{
                                reqBody += chunk;
                                if(reqBody.length > this.maxRequestBodySize){
                                    this.errorHandler(req, res, {error: 413, message:"Payload Too Large"}, 413);
                                }
                            });
                            req.on("end", async ()=>{
                                req.body = reqBody;
                                try{
                                    resolve(await handler_obj.handler[req.method.toUpperCase()](req, res, argv));
                                } catch (e) {
                                    console.dir(e);
                                    if(res.headersSent){
                                        // This section should not be like this, still looking for another solution.
                                        this.errorHandler(req, res, {error: 500, message: "Internal server error"}, 500);
                                    } else {
                                        this.errorHandler(req, res, {error: 500, message: "Internal server error"}, 500);
                                    }
                                }
                            });
                        });
                    } else {
                        // Path found but no handler
                        this.errorHandler(req, res, {error: 405, message: `${req.method} is not allowed for ${req.url}`}, 405);
                    }
                }
            // });
            }

            if (!matchFound){
                // No matched path, checking static file.
                if (req.method.toUpperCase() == "GET"){
                    var filePath = systempath.join(this.staticRoot, req.url);
                    if(fs.existsSync(filePath)){
                        if (fs.lstatSync(filePath).isFile()){
                            res.writeHead(200, {
                                "Content-Type": mime.lookup(filePath),
                                "Content-Length": fs.statSync(filePath).size
                            });
                            res.end(fs.readFileSync(filePath));
                        } else if (fs.lstatSync(filePath).isDirectory()){
                            // Is directory, checking default page
                            var indexFound = false;
                            for(var i=0; i<this.defaultPages.length;i++){
                                let p = systempath.join(filePath, this.defaultPages[i]);
                                if (fs.existsSync(p)){
                                    if (fs.lstatSync(p).isFile){
                                        res.writeHead(200, {
                                            "Content-Type": mime.lookup(p),
                                            "Content-Length": fs.statSync(p).size
                                        });
                                        res.end(fs.readFileSync(p));
                                        indexFound = true;
                                        break;
                                    }
                                }
                            }
                            if (!indexFound) {
                                this.errorHandler(req, res, {error: 404, message: "Not Found"}, 404);
                            }
                        }
                    } else {
                        // Nothing found
                        this.errorHandler(req, res, {error: 404, message: "Not Found"}, 404);
                    }
                }
            }
            var handle_end = new Date();
            console.log(`${handle_end.toISOString()} ${(handle_end.getTime() - handle_start.getTime())}ms ${req.socket.remoteAddress} ${req.method} ${req.url} - ${res.statusCode}`)
        });
    }

    listen(...args){
        // Pass listen argument to builtin http server
        this._server.listen.apply(this._server, args);
    }

    _error(req, res, error, statusCode=400){
        res.writeHead(statusCode, {"Content-Type": "application/json"});
        res.end(JSON.stringify(error));
    }

    register_handler(path, handler, method="GET", optional_trail_slash=true){
        method = method.toUpperCase();
        if(! this._handlers.hasOwnProperty(path)){
            var v = [];
            var match;

            // node seems not having the ability to return all matched group, looping through all matches
            while(match = path_get_variable.exec(path)){
                v.push(match[1]);
            }

            this._handlers[path] = {
                handler: {},
                regexp: new RegExp(`^${path.replace(/\{([^\/\}]*)\}/g, "([^/]*)")}${optional_trail_slash?"/?":""}$`),
                variables: v
            };
        }
        if (this._handlers[path].handler.hasOwnProperty(method)){
            throw new DuplicateError(`${method} for "${path}" has already existed.`);
        }
        this._handlers[path].handler[method] = handler;
    }


}

module.exports = BHH;