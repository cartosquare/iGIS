
var options = require('./config').options;

// map binding
var gmap = require('node-gmap');

var fs = require('fs');

var shortid = require('shortid');

var redis = require("redis");
client = redis.createClient({
    host: options.redis.host,
    port: options.redis.port
});

client.on("error", function (err) {
    console.log("Error " + err);
});

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

// mapping template
var globalLod = fs.readFileSync(options.mapDir + "/map/lod.json");
var vtDefs = {};
var defDirectory = options.mapDir + "/maps/vector-tile/";
for (var def = 0; def < options.vtConfig.length; ++def) {
    var confName = options.vtConfig[def];
    vtDefs[confName] = fs.readFileSync(defDirectory + confName + '.json', 'utf8');
}

var styleDefs = {};
var styleDirectory = options.mapDir + "/maps/";
for (var def = 0; def < options.styleConfig.length; ++def) {
    var confName = options.styleConfig[def];
    styleDefs[confName] = fs.readFileSync(styleDirectory + confName + '/tile.json', 'utf8');
}

function tileKey(mapName, z, x, y, retina) {
    return '/' + mapName + '/' + z + '/' + x + '/' + y + '/' + retina;
}

function vectorTileKey(mapName, z, x, y) {
    return '/' + mapName + '/' + z + '/' + x + '/' + y + '/.pb';
}

function findVectorTileDataSource(style) {
    vectorTiles = []
    var style = JSON.parse(style);
    var datasets = style.data_sources;
    for (var key in datasets) {
        if (datasets.hasOwnProperty(key)) {
            if (datasets[key].type == 'cloud_vector_tile') {
                vectorTiles.push(key);
            }
        }
    }
    return vectorTiles;
}

function tile(opts, cb) {
    gmap.tile(param, function (err, stream) {
        if (err) {
            cb('render tile fail: ' + err);
            return;
        } else {
            // TODO: change dataCenter here
            mapStore.writeFile(stream, { dataCenter: "proto_tile", collection: opts.collection }, opts.key, function (err, reply) {
                if (err) {
                    cb('save tile fail: ' + err);
                    return;
                } else {
                    cb(null, stream)
                }
            });
        }
    });
};

function renderVectorTiles(vectorTiles, z, x, y, cb) {
    var i = 0;
    renderVT(i);

    function renderVT(i) {
        if (i < vectorTiles.length) {
            var vtPath = vectorTileKey(vectorTiles[i], z, x, y);
            console.log('render vector tile: ' + vtPath);
            gmap.getFile(vtPath, function(err) {
                if (err) {
                    // 重新生成 vector tile
                    console.log('regenerate vector tile');
                    var param = {
                        'fromFile': false,
                        'mapDir': options.mapDir,
                        'lod': globalLod,
                        'style': vtDefs[vectorTiles[i]],
                        'renderType': 2,
                        'z': z,
                        'x': x,
                        'y': y,
                        'bufferSize': options.bufferSize,
                        'retinaFactor': 1,
                        'renderLabel': true,
                        'saveCloud': true,
                        'tileURL': vtPath
                    };
                    gmap.tile(param, function(err) {
                        if (err) {
                            cb(err);
                            return;
                        } else {
                            console.log('successful generate vector tile');
                            i = i + 1;
                            renderVT(i);
                        }
                    });
                } else {
                    i = i + 1;
                    renderVT(i);
                }
            });
        } else {
            cb(null);
        }
    }   
}

function getBaseMap(mapName, z, x, y, retina, cb) {
    // 首先尝试从缓存中直接取瓦片
    var key = tileKey(mapName, z, x, y, retina);
    gmap.getFile(key, function(err, stream) {
        if (err) {
            // 缓存中没有瓦片，需要生成

            // 首先生成Vector tile
            vectorTiles = findVectorTileDataSource(styleDefs[mapName]);
            renderVectorTiles(vectorTiles, z, x, y, function(err) {
                if (err) {
                    console.log(err);
                    cb(err);
                } else {
                    // 生成瓦片
                    console.log('generate raster tile...');
                    var param = {
                        'fromFile': false,
                        'mapDir': options.mapDir,
                        'lod': globalLod,
                        'style': styleDefs[mapName],
                        'renderType': 0,
                        'z': z,
                        'x': x,
                        'y': y,
                        'bufferSize': options.bufferSize,
                        'retinaFactor': retina,
                        'renderLabel': true,
                        'tileURL': key,
                        'saveCloud': true
                    };
                    gmap.tile(param, function(err, stream) {
                        if (err) {
                            cb(err);
                            return;
                        } else {
                            cb(null, stream)
                        }
                    });
                }
            });
        } else {
            cb(null, stream);
        }
    });
}

module.exports.getBaseMap = getBaseMap;
module.exports.vectorTileKey = vectorTileKey;

/*********************************************************/
// visualize
function config(style, cb) {
    var styleID = shortid.generate();
    client.set(styleID, style, function (err, reply) {
        var result = {}
        if (err) {
            result['err'] = 1;
        } else {
            result['err'] = 0;
            result['mapID'] = styleID;
        }
        cb(result);
    });
}

function getVis(styleID, z, x, y, retina, cb) {
    client.get(styleID, function (err, style) {
        if (err || !style) {
            cb('get style fail!');
        } else {
            //console.log(prefix + '-- get style success, render vector tiles');
            // 生成瓦片
            var param = {
                'fromFile': false,
                'mapDir': options.mapDir,
                'lod': globalLod,
                'style': style,
                'renderType': 0,
                'z': z,
                'x': x,
                'y': y,
                'bufferSize': options.bufferSize,
                'retinaFactor': retina,
                'renderLabel': true,
                'saveCloud': false
            };
            // 首先生成Vector tile
            vectorTiles = findVectorTileDataSource(style);
            renderVectorTiles(vectorTiles, z, x, y, function(err) {
                if (err) {
                    console.log(err);
                    cb(err);
                } else {
                    // 生成瓦片
                    gmap.tile(param, function (err, stream) {
                        if (err) {
                            cb('render tile fail: ' + err);
                            return;
                        } else {
                            //console.log(prefix + '-- tile success')
                            cb(null, stream);
                        }
                    });
                }
            });
        }
    });
}

module.exports.config = config;
module.exports.getVis = getVis;


/*************************************************************/
// 获取静态地图
function staticMap(opts, cb) {
    opts.mapDir = options.mapDir;
    opts.lod = globalLod;

    mapStore.getStyle(opts.mapID, function(err, style) {
        if (err || !style) {
            cb('get map style fail!');
            return;
        } else {
            opts.style = style;
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
        gmap.staticMap(opts, function (err, tiles) {
            if (!err) {
                console.log(tiles);

                batchRenderVT(vectorTiles, tiles, function (err) {
                    opts.getIndex = false;
                    gmap.staticMap(opts, function (err, stream) {
                        if (err) {
                            console.log('get static map fail!');
                            cb('get static map fail!')
                            return;
                        } else {
                            cb(null, stream);
                        }
                    });
                });
            } else {
                console.log('get static map index fail!');
                cb('get static map index fail!')
                return;
            }
        });
    });
}

function batchRenderVT(vectorTiles, indexArr, callback) {
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

            renderVectorTiles(vectorTiles, level, row, col, function () {
                i = i + 1;
                fuc(i);
            });
        } else {
            callback(null);
        }
    }
}

module.exports.staticMap = staticMap;