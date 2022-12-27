const http = require('http');
const fs = require('fs');

// ********************************* minecraft/server-admin *********************************

const secret_variables = {};

class ServerVariables{
    constructor(filename='./test_variables.json'){
        const data = fs.readFileSync(filename, 'utf-8');
        this.#variables = JSON.parse(data);
    }
    /**
     * Returns the value of variable that has been configured in a dedicated server configuration JSON file.
     * @param {string} name 
     */
    get(name){
        if (name in this.#variables)
            return this.#variables[name]
    }
    /**
     * A list of available, configured server variables. 
     */
    get names(){
        return Object.keys(this.#variables);
    }
    #variables;
}

class SecretString{
    /**
     * @param {string} value 
     */
    constructor(value){
        secret_variables[this] = value;
    }
}

class ServerSecrets{
    constructor(filename='./test_secrets.json'){
        const data = JSON.parse(fs.readFileSync(filename, 'utf-8'));
        /**
         * @property A list of available, configured server secrets.
         */
        this.#names = Object.keys(data);
        for (const name of this.#names){
            const secret = new SecretString(data[name]);
            this.#index[name] = secret;
            secret_variables[secret] = data[name];
        }
    }
    /**
     * Returns a SecretString that is a placeholder for a secret configured in a JSON file. In certain objects, like an HttpHeader, this Secret is resolved at the time of execution but is not made available to the script environment.
     * @param {string} name 
     * @returns {SecretString} SecretString
     */
    get(name){
        if (name in this.#index){
            return this.#index[name] ;
        }
    }
    /**
     * A list of available, configured server secrets.
     * @returns {string[]}
     */
    get names(){
        return this.#names
    }
    #index={};
    #names=[];
}

const HttpRequestMethod = {
    /**
     * Represents the method for an HTTP HEAD request. HEAD requests are similar to a GET request, but are commonly used to retrieve just the HTTP response headers from the specified URI, and not the body contents.
     */
    DELETE: "DELETE",
    /**
     * Represents the method for an HTTP PUT request. POST requests are commonly used to create a new resource that is a subordinate of the specified URI.
     */
    GET: "GET",
    /**
     * Represents the method for an HTTP PUT request. GET requests are commonly used to retrieve information about a resource at the specified URI.
     */
    HEAD: "HEAD",
    /**
     * Represents the method for an HTTP PUT request. GET requests are commonly used to retrieve information about a resource at the specified URI.
     */
    POST: "POST",
    /**
     * Represents the method for an HTTP PUT request. PUT requests are commonly used to update a single resource that already exists in a resource collection.
     */
    PUT: "PUT"
}

// ********************************* minecraft/server-net *********************************

class HttpHeader{
    /**
     * @param {string} key 
     * @param {string | SecretString} value 
     */
    constructor(key, value){
        this.key = key;
        this.value = value;
    }
    key;
    value;
}

class HttpRequest{
    /**
     * @param {string} uri
     * @param {HttpHeader[]} headers
     */
    constructor(uri, headers=[]){
        this.uri = uri;
        this.headers = headers;
        this.method = 'GET';
    }
    /**
     * @param {string} key 
     * @param {string} value 
     */
    addHeader(key, value){
        this.headers.push(new HttpHeader(key, value));
    }
    /**
     * @param {string} body 
     */
    setBody(body){
        this.body = body;
    }
    /**
     * 
     * @param {HttpHeader[]} headers 
     */
    setHeaders(headers){
        this.headers = headers;
    }
    /**
     * @param {string} HttpRequestMethod 
     */
    setMethod(HttpRequestMethod){
        this.method = HttpRequestMethod;
    }
    /**
     * @param {number} timeout 
     */
    setTimeout(timeout){
        this.timeout=timeout;
    }
}

class HttpResponse{
    /**
     * @param {HttpRequest} request 
     * @param {HttpHeader[]} headers 
     * @param {string} body 
     * @param {Number} status 
     */
    constructor(request, headers, body, status){
        this.body = body;
        this.headers = headers;
        this.request = request;
        this.status = status;
    }
}

class HttpClient{
    constructor(){
    }
    /**
     * @param {string} uri  - URL to make an HTTP Request to.
     * @returns {Promise<HttpResponse>}
     */
    get(uri){
        return new Promise(acc=>{
            http.get(uri, res=>{
                this.#make_response(new HttpRequest(uri), res).then(http_response=>{
                    acc(http_response);
                })
            })
        });
    }
    /**
     * @param {HttpRequest} config - Contains an HTTP Request object with configuration data on the HTTP request.
     * @returns {Promise<HttpResponse>}
     */
    request(config){
        const headers = {};
        for (const header of config.headers){
            if (header.value instanceof SecretString){
                headers[header.key] = secret_variables[header.value]
            }
            else{
                headers[header.key] = header.value;
            }
        }
        
        const options = {
            headers : headers,
            method : config.method
        };
        if (config.timeout){
            options.timeout = config.timeout*1000;
        }
        return new Promise(acc=>{
            const req = http.request(config.uri, options, res=>{
                acc(this.#make_response(config, res));
            })
            if (config.body)
                req.write(config.body);
            req.end();
        })
    }
    /**
     * @param {HttpRequest} req 
     * @param {http.IncomingMessage} res 
     */
    #make_response(req, res){
        const header_list = []
        for (const head_name in res.headers){
            header_list.push(new HttpHeader(head_name, res.headers[head_name]))
        }
        return new Promise(acc=>{
            let req_body = '';
            res.on('data', data=>{
                req_body+=data;
            })
            res.on('end', ()=>{
                acc(new HttpResponse(req, header_list, req_body, res.statusCode));
            })
        })
    }
}

// ********************************* minecraft/server *********************************
class System{
    constructor(){
        this.#currentTick=Math.floor(Math.random() * 10000);;
        this.currentTick=this.#currentTick;
        setInterval(async()=>{
            for (const id in this.#schedule_list){
                if (this.#schedule_list[id].time==this.#currentTick){
                    this.#schedule_list[id].callback();
                    if (this.#schedule_list[id].interval){
                        this.#schedule_list[id].time = this.#currentTick+this.#schedule_list[id].interval;
                    }
                    else{
                        delete this.#schedule_list[id]
                    }                    
                }
            }            
    
            this.#currentTick+=1;
            this.currentTick=this.#currentTick;
        }, 20);
    }
    /**
     * @property Represents the current world tick of the server.
     */
    currentTick = 0;
    /**
     * Cancels the execution of a function run that was previously scheduled via the run function.
     * @param {number} runId 
     */
    clearRun(runId){
        if (runId in this.#schedule_list){
            if (!this.#schedule_list[runId].interval)
                delete this.#schedule_list[runId];
        }
    }
    /**
     * Cancels the execution of a scheduled function run that was previously scheduled via the runSchedule function.
     * @param {number} runScheduleId
     */
    clearRunSchedule(runScheduleId){
        if (runScheduleId in this.#schedule_list){
            if (this.#schedule_list[runId].interval)
                delete this.#schedule_list[runScheduleId];
        }
    }
    /**
     * Runs a specified function at a future time. This is frequently used to implement delayed behaviors and game loops.
     * @param {()=>{}} callback  - Function callback to run when the tickDelay time criteria is met.
     */
    run(callback, tickDelay=1){
        const id = Math.floor(Math.random() * 1000000);
        this.#schedule_list[id]={callback: callback, time: this.#currentTick+tickDelay};
        return id
    }
    /**
     * @param {()=>{}} callback - Function callback to run on the specified schedule.
     * @param {number} tickInterval - The number of ticks to run this function within - run this function every *tickInterval* ticks.
     * @returns {number} An opaque identifier that can be used with the clearRunSchedule function to cancel the execution of this scheduled run
     */
    runSchedule(callback, tickInterval=1){
        if (tickInterval<1){
            throw "tickInterval can't be smaller than 1";
        }
        const id = Math.floor(Math.random() * 1000000);
        this.#schedule_list[id] = {callback: callback, time: this.#currentTick+tickInterval, interval:tickInterval};
        return id;
    }
    #currentTick = 0;
    #schedule_list = {};
}


const secrets = new ServerSecrets();
const variables = new ServerVariables();
const my_http = new HttpClient();
const mySystem = new System();

module.exports = {
    HttpResponse: HttpResponse,
    http: my_http,
    HttpResponse: HttpResponse,
    HttpRequest : HttpRequest,
    HttpHeader: HttpHeader,
    HttpRequestMethod: HttpRequestMethod,
    System : mySystem,
    secrets: secrets,
    variables: variables
} 