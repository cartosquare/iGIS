// 路由配置
var server = require('./server');

var mappingHandle = require('./mapping_handle');
var styleHandle = require('./style_handle');


var cluster = require('cluster');
if (cluster.isMaster) {
    var numCPUs = require('os').cpus().length - 1;
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('listening', function (worker, address) {
        console.log('Server is listening: pid=' + worker.process.pid + ', address=' + address.address + ":" + address.port);
    });

    cluster.on('exit', function (worker, code, signal) {
        console.error('Server exit: pid=' + worker.process.pid + ' restart ...');
        cluster.fork();
    });
} else {
    server.startServer();
}

//server.startServer();
