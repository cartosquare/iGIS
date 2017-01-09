mapdb = require('./map_db.js')
mapdb.createTable();

var options = require('./config.js').options;
var fs = require('fs')

// REST服务
var restify = require('restify');

// vt and lod 
// TODO: move these to database
// and this should be created and modified by users
// var globalLod = fs.readFileSync(options.mapDir + "/map/lod.json");
// var vtDefs = {};
// var defDirectory = options.mapDir + "/maps/vector-tile/";
// for (var def = 0; def < options.vtConfig.length; ++def) {
//     var confName = options.vtConfig[def];
//     vtDefs[confName] = fs.readFileSync(defDirectory + confName + '.json', 'utf8');
// }

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

exports.createMap = createMap;
exports.deleteMap = deleteMap;
exports.updateMap = updateMap;
exports.listMap = listMap;
exports.mapDef = mapDef;
exports.mapThumb = mapThumb;