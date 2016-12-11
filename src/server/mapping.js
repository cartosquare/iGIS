mapdb = require('./map_db.js')
mapdb.createTable();

var options = require('./config.js').config;

// map binding
var gmap = require('node-gmap');
var fs = require('fs')

// REST服务
var restify = require('restify');

// Init log
console.log("log level: " + options.logLevel);
gmap.initLog(options.logLevel);

// Font
console.log("Loading fonts from " + options.mapDir + "  ...");
gmap.registerFonts(options.mapDir + "/fonts");

// datasource pool
gmap.registerPool(options.osmConn.name, options.osmConn.url, options.osmConn.initialConnSize, options.osmConn.maxConnSize, "PG");

// seaweed storage
console.log("Resgist weed storage " + options.weed.host + ":" + options.weed.port + " ...")
gmap.registerStorage(options.weed.host, options.weed.port);

// vt and lod 
// TODO: move these to database
// and this should be created and modified by users
var globalLod = fs.readFileSync(options.mapDir + "/map/lod.json");
var vtDefs = {};
var defDirectory = options.mapDir + "/maps/vector-tile/";
for (var def = 0; def < options.vtConfig.length; ++def) {
    var confName = options.vtConfig[def];
    vtDefs[confName] = fs.readFileSync(defDirectory + confName + '.json', 'utf8');
}

// 版本信息
exports.info = function(req, res, next) {
    var result = {
        version: options.version,
    };

    res.send(result);
    return next();
}

// operations on maps
function createMap(req, res, next) {
    // pass in:
    // map name, def, desc
    var params = req.params;
    
    res.setHeader("Content-Type", "text/plain");
    mapdb.insert(params.name, params.def, params.desc, function(err) {
        if (err) {
            res.end('{\"error\": 1}');
        } else {
            res.end('{\"error\": 0}');
        }
    })

    return next();

}

function deleteMap(req, res, next) {
    // pass in:
    // map id
    var params = req.params;
    
    res.setHeader("Content-Type", "text/plain");
    mapdb.delete(params.id, function(err) {
        if (err) {
            res.end('{\"error\": 1}');
        } else {
            res.end('{\"error\": 0}');
        }
    })

    return next();
}

function updateMap(req, res, next) {
    // pass in:
    // map id, map name, def, desc
    var params = req.params;
    
    res.setHeader("Content-Type", "text/plain");
    mapdb.update(params.id, params.name, params.def, params.desc, function(err) {
        if (err) {
            res.end('{\"error\": 1}');
        } else {
            res.end('{\"error\": 0}');
        }
    })

    return next();
}

function listMap(req, res, next) {
    // pass in:
    // map id, map name, def, desc
    var params = req.params;
    var page = params.page ? parseInt(params.page) : 0;

    var items_per_page = 5;
    var start_item = page * items_per_page;
    var end_item = start_item + items_per_page - 1;

    var result = {
        'items': [],
        'hasNext': true,
        'page': page
    }

    mapdb.queryAll(function (err, rows) {
        if (err) {
            console.log(err)
        } else {
            if (end_item >= (rows.length - 1)) {
                // end_item is the last item
                end_item = rows.length - 1
                result['hasNext'] = false;
            }

            for (i = start_item; i <= end_item; ++i) {
                result.items.push(rows[i])
            }
        }

        res.setHeader("Content-Type", "text/plain");
        res.end(JSON.stringify(result));
        return next();
    });
}

function mapDef(req, res, next) {
    var params = req.params;

    res.setHeader("Content-Type", "text/plain");
    mapdb.getDef(params.id, function(err, row) {
        if(err || !row) {
            console.log(err);
            res.end('{}');
        } else {
            res.end(row.def);
        }
        return next();
    })
}

function mapThumb(req, res, next) {
    var params = req.params;

    res.setHeader('Content-Type', 'image/png');
    mapdb.getThumb(params.id, function(err, row) {
        if(err) {
            console.log(err);
            res.end('{}');
        } else {
            res.end(row.thumb);
        }
        return next();
    })
}

function mapTile(req, res, next) {
    var params = req.params;

    var mapID = req.params.id;

    var z = parseInt(params.z) || 0;
    var x = parseInt(params.x) || 0;
    var y = parseInt(params.y) || 0;

    var retina = '@1x';
    if (params.retina && params.retina == '@2x') {
        retina = params.retina;
    }
    var force = parseInt(params.force) || 0;
    var tilePath = _getTilePath(mapID, z, x, y, retina);
    var opts = {
        mapDir: options.mapDir,
        lod: globalLod,
        fromFile: false,
        renderType: 0,
        z: z,
        x: x,
        y: y,
        bufferSize: 32,
        tileURL: tilePath,
        saveCloud: false,
        retinaFactor: parseFloat(retina.slice(1, retina.length - 1)),
        renderLabel: true
    };

    mapdb.getDef(mapID, function(err, row) {
        if (err || !row) {
            return next(new restify.InternalServerError('get map style fail!'));
        } else {
            opts.style = row.def;
            renderTile(opts, function (err, stream) {
                if (err) {
                    return next(new restify.InternalServerError('render tile fail!'));
                } else {
                    res.setHeader('Content-Type', 'image/png');
                    res.end(stream);
                    return next();
                }
            });
        }
    });
}


function renderTile(opts, callback) {
    // get all vector tile names
    var vectorTiles = [];
    var rasterTiles = [];
    var style = JSON.parse(opts.style);
    var datasets = style.data_sources;
    for (var key in datasets) {
        if (datasets.hasOwnProperty(key)) {
            if (datasets[key].type == 'cloud_vector_tile') {
                vectorTiles.push(key);
            }
            if (datasets[key].type == 'dem_tile') {
                if (datasets[key].source == 'rt/dem_mercator_world') {
                    rasterTiles.push(datasets[key].source);
                }
            }
        }
    }

    //
    if (rasterTiles.length > 0) {
        var tileExtent = tileSize * zoomReses[opts.z];

        tilepath = options.mapDir + "/" + rasterTiles[0] + "/" +
        opts.z + "_" + opts.x + "_" + opts.y + ".tif";


        tileMinx = worldOriginalx + opts.x * tileExtent;
        tileMaxx = tileMinx + tileExtent;
        tileMaxy = worldOriginaly - opts.y * tileExtent;
        tileMiny = tileMaxy - tileExtent;

        command = "gdalwarp -s_srs EPSG:4326 -t_srs EPSG:3857 -te " + tileMinx + " " +
        tileMiny + " " + tileMaxx + " " + tileMaxy + " -ts 256 256 -overwrite -r near -multi -q " +
        options.rawDEM + " " + tilepath;

        console.log(command);
        exec(command, function(err, stdout, stderr) {
            //var optsClone = opts.clone
            var olddef = opts.style;
            var oldRenderType = opts.renderType;
            var oldTileURL = opts.tileURL;
            var oldSaveCloud = opts.saveCloud;
            _renderVTList(vectorTiles, opts, function() {
                opts.style = olddef;
                opts.saveCloud = oldSaveCloud;
                opts.tileURL = oldTileURL;
                opts.renderType = oldRenderType;

                console.log('callback');

                gmap.tile(opts, callback);
            });
        });
    } else {
        //var optsClone = opts.clone
        var olddef = opts.style;
        var oldRenderType = opts.renderType;
        var oldTileURL = opts.tileURL;
        var oldSaveCloud = opts.saveCloud;
        _renderVTList(vectorTiles, opts, function() {
            opts.style = olddef;
            opts.saveCloud = oldSaveCloud;
            opts.tileURL = oldTileURL;
            opts.renderType = oldRenderType;

            gmap.tile(opts, callback);
        });
    }


}

function _getVtPath(name, z, x, y) {
    return '/' + name + '/' + z + '/' + x + '/' + y + '/.pb';
}

function _getTilePath(name, z, x, y, retina) {
    return '/' + name + '/' + z + '/' + x + '/' + y + '/' + retina;
}

// render vt
function _renderVTList(vectorTiles, opts, callback) {
    // generate all vector tile
    //console.log('render vt list: ' + vectorTiles);

    var i = 0;
    renderVT(i);

    function renderVT(i) {
        if (i < vectorTiles.length) {
            //console.log('process vt: ' + vectorTiles[i]);

            var vtPath = _getVtPath(vectorTiles[i], opts.z, opts.x, opts.y);

            gmap.getFile(vtPath, function(err) {
                // console.log('get ' + vtPath + ' result: ' + err);

               if (err) {
                   // empty, need regenerate
                   opts.style = vtDefs[vectorTiles[i]];
                   opts.renderType = 2;
                   opts.saveCloud = true;
                   opts.tileURL = vtPath;

                   // console.log('generate vector tile ' + vtPath);
                   gmap.tile(opts, function(err) {
                        if (err) {
                            console.log('error in generate vt: ' + vtPath + ': ' + err);
                        }
                        // process next tile
                        i = i + 1;
                        renderVT(i);
                   });
               } else {
                   // process next tile
                   i = i + 1;
                   renderVT(i);
               }
            });
        } else {
            callback(null);
        }
    }
}

function _batchRenderVT(opts, vectorTiles, indexArr, callback) {
    var level = indexArr[0];
    var xmin = indexArr[1];
    var xmax = indexArr[2];
    var ymin = indexArr[3];
    var ymax = indexArr[4];

    var totalCount = (xmax - xmin + 1) * (ymax - ymin + 1);

    var i = 0;
    fuc(i);
    function fuc(i) {
        if (i < totalCount) {
            var length = ymax - ymin + 1;
            var row = xmin + Math.floor(i / length);
            var col = ymin + i % length;

            opts.z = level;
            opts.x = row;
            opts.y = col;
            _renderVTList(vectorTiles, opts, function() {
               i = i + 1;
                fuc(i);
            });
        } else {
            callback(null);
        }
    }
}

// 获取静态地图
function staticMap(req, res, next) {
    var params = req.params;

    var opts = {
        mapDir: options.mapDir,
        lod: globalLod,
        width: parseInt(params.width) || 256,
        height: parseInt(params.height) || 256,
        retinaFactor: 1.0,
        cx: parseFloat(params.cx) || 0,
        cy: parseFloat(params.cy) || 0,
        res: parseFloat(params.res) || 156543.033928,

        padding:  parseInt(params.padding) || 0,
        rotate: parseFloat(params.rotation) || 0.0
    };

    if (opts.width <= 0 || opts.height <= 0 || opts.padding < 0 || opts.resolution < 0) {
        return next(new restify.InvalidArgumentError('Check parameters'));
    }

    mapdb.getDef(params.id, function(err, row) {
        if (err || !row) {
            return next(new restify.InternalServerError('get map style fail!'));
        } else {
            opts.style = row.def;
        }

        // get all vector tile names
        var vectorTiles = [];
        var style = JSON.parse(opts.style);
        var datasets = style.data_sources;
        for (var key in datasets) {
            if (datasets.hasOwnProperty(key)) {
                if (datasets[key].type == 'cloud_vector_tile') {
                    vectorTiles.push(key);
                }
            }
        }

        opts.getIndex = true;
        var oldStyle = opts.style;
        gmap.staticMap(opts, function (err, tiles) {
            if (!err) {
                console.log(tiles);

                _batchRenderVT(opts, vectorTiles, tiles, function (err) {
                    opts.getIndex = false;
                    opts.style = oldStyle;
                    gmap.staticMap(opts, function (err, stream) {
                        if (err) {
                            console.log('get static map fail!');
                            return next(new restify.InternalServerError('data thumb fail!'));
                        } else {
                            res.writeHead(200, { 'Content-Type': 'image/png' });
                            res.end(stream);
                            return next();
                        }
                    });
                });
            } else {
                console.log('get static map index fail!');
                return next(new restify.InternalServerError('data thumb fail!'));
            }
        });
    });
}

exports.createMap = createMap;
exports.deleteMap = deleteMap;
exports.updateMap = updateMap;
exports.listMap = listMap;
exports.mapDef = mapDef;
exports.mapThumb = mapThumb;
exports.mapTile = mapTile;
exports.staticMap = staticMap;