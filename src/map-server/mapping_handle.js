
var server = require('./server');
var restify = require('restify');
var gmap = require('./gmap');

// baseMap handle
server.addHandle('/basemap/:name/:z/:x/:y', 'get', function(req, res, next) {
    var params = req.params;
    var mapName = params.name;
    var z = parseInt(params.z) || 0;
    var x = parseInt(params.x) || 0;
    var y = parseInt(params.y) || 0;
    var retina = parseInt(params.retina) || 1;
    gmap.getBaseMap(mapName, z, x, y, retina, function(err, stream) {
        if (err) {
            return next(new restify.InternalServerError('get basemap fail: ' + err));
        } else {
            res.writeHead(200, {'Content-Type': 'image/png'});
            res.end(stream);
        }
        next();
    });
});

// visualization handle
server.addHandle('/config', 'post', function(req, res, next) {
    var params = req.params;
    var def = params.def;
    gmap.config(def, function(data) {
        if (data.err) {
            return next(new restify.InternalServerError('config fail: ' + err));
        } else {
            //res.writeHead(200, {'Content-Type': 'plain/json'});
            res.json(data);
        }
        next();
    });
});

server.addHandle('/vis/:mapID/:z/:x/:y', 'get',  function(req, res, next) {
    var params = req.params;
    var mapID = params.mapID;
    var z = parseInt(params.z) || 0;
    var x = parseInt(params.x) || 0;
    var y = parseInt(params.y) || 0;
    var retina = parseInt(params.retina) || 1;
    gmap.getVis(mapID, z, x, y, retina, function(err, stream) {
        if (err) {
            return next(new restify.InternalServerError('get vis fail: ' + err));
        } else {
            res.writeHead(200, {'Content-Type': 'image/png'});
            res.end(stream);
        }
        next();
    });
});

server.addHandle('/staticMap/:mapID', 'get', function(req, res, next) {
    var params = req.params;
    var opts = {
        mapID: params.mapID,
        width: parseInt(params.width) || 256,
        height: parseInt(params.height) || 256,
        retinaFactor: parseInt(params.retinaFactor) || 256,
        cx: parseFloat(params.cx) || 0,
        cy: parseFloat(params.cy) || 0,
        res: parseFloat(params.res) || 156543.033928,

        padding:  parseInt(params.padding) || 0,
        rotate: parseFloat(params.rotation) || 0.0
    };
    console.log(opts);

    if (opts.width <= 0 || opts.height <= 0 || opts.padding < 0 || opts.resolution < 0) {
        return next(new restify.InvalidArgumentError('Check parameters'));
    }

    gmap.staticMap(opts, function(err, stream) {
        if (err) {
            return next(new restify.InternalServerError('get staticMap fail: ' + err));
        } else {
            res.writeHead(200, {'Content-Type': 'image/png'});
            res.end(stream);
        }
        next();
    });
    
});