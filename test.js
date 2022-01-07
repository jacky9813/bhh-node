const bhh = require("./index.js");

const PORT = 8080;
var server = new bhh();


server.register_handler(
    "/",
    (req, res, argv) => {
        res.writeHead(200, {
            "Content-Type": "text/plain"
        });

        res.end("This is an index.")
    }
)

server.register_handler(
    "/test",
    (req, res, argv) => {
        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            result: "success"
        }));
    }
);

server.register_handler(
    "/test",
    (req, res, argv) => {
        console.log(req.body);
        try{
            req.setEncoding("utf8");
            var data = JSON.parse(req.body);
        } catch(e){
            server.errorHandler(req, res, {error: 400, message: "Invalid format"}, 400)
            return;
        }
        console.dir(data);
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify({result:"success",data:data}));
    },
    "POST"
);

server.register_handler(
    "/test/{input_1}",
    (req, res, argv)=>{
        console.dir(argv);
        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            result: "success",
            argv: argv
        }));
    }
);

server.register_handler(
    "/test/{arg1}/{arg2}",
    (req, res, argv) => {
        console.dir(argv);
        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            result: "success",
            argv: argv
        }));
    }
)

console.log(`Opening server on port ${PORT}`)
server.listen(PORT);