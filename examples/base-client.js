/**
 * Example form https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-net/httprequest
 */

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