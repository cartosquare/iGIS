// REST服务
var restify = require('restify');

var options = require('./config').options;

var server = restify.createServer();

server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());

function startServer(port, callback) {
    server.listen(port ? port : options.port, callback);
};

function stopServer(callback) {
    server.close(callback);
};

function addHandle(url, method, callback) {
    if (method == 'get') {
        server.get(url, callback);
    } else if (method == 'post') {
        server.post(url, callback);
    } else {
        console.log('Unknown method: ' + method + ', use get method default');
        server.get(url, callback);
    }
}

module.exports.addHandle = addHandle;
module.exports.startServer = startServer;
module.exports.stopServer = stopServer;