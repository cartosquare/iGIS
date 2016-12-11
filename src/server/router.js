
// REST服务
var restify = require('restify');

// 制图功能
var mapping = require('./mapping.js');

var options = require('./config.js').config;

var server = restify.createServer();

exports.startServer = function(port, callback) {
    console.log('server listening on ' + options.port)
    server.listen(port ? port : options.port, callback);
};

exports.stopServer = function(callback) {
    server.close(callback);
};

server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());

// 返回服务的版本号
server.get('/info', mapping.info);

// operations on maps
server.post('/createMap', mapping.createMap);
server.post('/deleteMap/:id', mapping.deleteMap);
server.post('/updateMap/:id', mapping.updateMap);
server.post('/listMap', mapping.listMap);

server.get('/mapDef/:id', mapping.mapDef);
server.get('/mapthumb/:id', mapping.mapThumb);


// map tile
server.get('/mapTile/:id/:z/:x/:y', mapping.mapTile)

// static map
server.get('/staticMap/:id', mapping.staticMap)