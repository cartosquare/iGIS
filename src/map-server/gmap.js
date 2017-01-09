
var options = require('./config').options;

// map binding
var gmap = require('node-gmap');

var fs = require('fs');

// map store
var mapStore = require('./map_store');

var shortid = require('shortid');

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
gmap.registerStorage(options.weed.host, '3000');

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
    var vtile = new gmap.Map();
    vtile.init(opts, function (err) {
        if (err) {
            cb('init tile fail: ' + err);
            return;
        } else {
            vtile.tile(opts, function (err, stream) {
                if (err) {
                    cb('render tile fail: ' + err);
                    return;
                } else {
                    // TODO: change dataCenter here
                    console.log('write file: ' + opts.key);
                    console.log('file length: ' + stream.length);
                    console.log('collection: ' + opts.collection);
                    mapStore.writeFile(stream, { dataCenter: "dc1", collection: opts.collection }, opts.key, function (err, reply) {
                        if (err) {
                            cb('save tile fail: ' + err);
                            return;
                        } else {
                            cb(null, stream)
                        }
                    });
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
            mapStore.hasFile(vtPath, function(err, find) {
                if (err || !find) {
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
                        'collection': vectorTiles[i],
                        'key': vtPath
                    };
                    tile(param, function(err) {
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
    console.log(key);
    mapStore.getFile(key, function(err, response, body) {
        if (err) {
            // 缓存中没有瓦片，需要生成

            // 首先生成Vector tile
            vectorTiles = findVectorTileDataSource(styleDefs[mapName]);
            console.log(vectorTiles);
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
                        'saveCloud': false,
                        'collection': mapName,
                        'key': key
                    };
                    tile(param, function(err, stream) {
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
            cb(null, body);
        }
    });
}

module.exports.getBaseMap = getBaseMap;
module.exports.vectorTileKey = vectorTileKey;
module.exports.mapStore = mapStore;

/*********************************************************/
// visualize
function config(style, cb) {
    var styleID = shortid.generate();
    mapStore.putStyle(styleID, style, function(err) {
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
    var prefix = z + '_' + x + '_' + y;
    console.log(prefix + '-- get style: ' + styleID);
    mapStore.getStyle(styleID, function (err, style) {
        if (err || !style) {
            cb('get style fail!');
        } else {
            console.log(prefix + '-- get style success, render vector tiles');
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
            console.log(vectorTiles);
            renderVectorTiles(vectorTiles, z, x, y, function(err) {
                if (err) {
                    console.log(err);
                    cb(err);
                } else {
                    // 生成瓦片
                    console.log(prefix + '-- generate raster tile...');
                    var vtile = new gmap.Map();
                    vtile.init(param, function (err) {
                        if (err) {
                            cb('init tile fail: ' + err);
                            return;
                        } else {
                            console.log(prefix + '-- generate success');
                            vtile.tile(param, function (err, stream) {
                                if (err) {
                                    cb('render tile fail: ' + err);
                                    return;
                                } else {
                                    console.log(prefix + '-- tile success')
                                    cb(null, stream);
                                }
                            });
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