
// REST服务
var restify = require('restify');
var options = require('./config.js').options;
var style = require('./map_style')
var server = require('./server');


// operations on maps
server.addHandle('/createMap', 'post', style.createMap);
server.addHandle('/deleteMap/:id', 'post', style.deleteMap);
server.addHandle('/updateMap/:id', 'post', style.updateMap);
server.addHandle('/listMap', 'post', style.listMap);

server.addHandle('/mapDef/:id', 'get', style.mapDef);
server.addHandle('/mapthumb/:id', 'get', style.mapThumb);