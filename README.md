# gametestEmulator
Test bedrock scripting API classes and functions on nodejs before using them on your addon project. Get the hang of it and easily find bugs.

## What is it?
gametestEmulator is a collection of classes, functions and constants that have the same behaviour and signature as modules form official [bedrock scripting API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/). These classes can be imported, and run with [NodeJS](https://nodejs.org/en/), making it very easy to test and debug parts of your code directly from node. This is thought especially for those who are learning about server-net and server-admin modules and for people who, in general, don't know much about bedrock-scripting for servers.

Having the same signature as official scripting, once you have fixed your server mechanics (connection between your local server and mc-server) you can easily copy and paste your code to your addon project (changing the `import` statement ofcourse), and it will work without any change.
Furthermore, if you learned http request handling with bedrock-scripting, and you want to code more outsite bedrock (some nodejs app maybe) without learning form scratch how to use a new http-module, you can still use it!

Finally this library doesn't use any external class or module. You don't need to install anything more than just this very code.
## Supported modules
For now only some of scripting modules are supported, mainly those related to server-scripting (which is probably the only case this tool would be useful).
For now `server-admin` and `server-net` have been completely implemented, for `server` only System was implemented, and in the future we will implement some of the most important events
* minecraft/server-admin
* minecraft/server-net
* minecraft/server
    * System

## Examples
So, you are starting to code a bedrock->server service, and before adding all other stuff related to game you want to make sure that both your scripting code and server-code are compatible. Or you may even have just written it, but something is wrong with server connection... (this example was taken from microsoft [docs](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-net/httprequest))

Here's the code for the server, which we run by `node server.js` (supposing it is saved in a file called `server.js`).
```js
const {createServer} = require('http')

let score = 0;
const node_server = createServer((req, res)=>{
    if (req.url=='/updateScore'){
        req.on('data', data=>{
            score = JSON.parse(data).score;
            res.writeHead(200, { 'content-type': 'text/plain' });
        })
    }
})
node_server.listen(3000);
```
And here the code for the client, which we run by `node client.js` (assuming that it's saved on a file called  `client.js`)
```js
const {http, HttpRequest, HttpHeader, HttpRequestMethod} = require('./simulatedGametest');

const req = new HttpRequest("http://localhost:3000/updateScore");
req.body = JSON.stringify({
    score: 22,
});
req.method = HttpRequestMethod.POST;
req.headers = [
    new HttpHeader("Content-Type", "application/json"),
    new HttpHeader("auth", "my-auth-token"),
];

const response = await http.request(req);
```
Once we have checked that everything works fine both on server and client side, we can paste the client's code inside our addon code (***changing*** just the very *first line*)
```js
import { http, HttpRequest, HttpHeader, HttpRequestMethod } from "@minecraft/server-net";

const req = new HttpRequest("http://localhost:3000/updateScore");
req.body = JSON.stringify({
    score: 22,
});
req.method = HttpRequestMethod.POST;
req.headers = [
    new HttpHeader("Content-Type", "application/json"),
    new HttpHeader("auth", "my-auth-token"),
];

const response = await http.request(req);
```
We now have easily learned how to use minecraft-net. If we are getting errors in our scripting we now know that it's not related to the "internet-part" of our code (it might be a problem with the manifest or some other code related to game).
