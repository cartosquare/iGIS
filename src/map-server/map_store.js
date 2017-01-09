var options = require('./config').options;
var fs = require('fs');

var redis = require("redis");
client = redis.createClient({
    host: options.redis.host,
    port: options.redis.port
});

client.on("error", function (err) {
    console.log("Error " + err);
});

// https://github.com/cruzrr/node-weedfs
var weedClient = require("node-weedfs");

var weedfs = new weedClient({
    server: options.weed.host,
    port: options.weed.port
});

function hasFile(key, cb) {
    client.get(key, function (err, fileId) {
        if (err) {
            // error occurs
            cb(err);
        } else {
            if (fileId) {
                weedfs.find(fileId, function (public, servers) {
                    if (public && public[0]) {
                        // find!
                        cb(null, true);
                    } else {
                        // not find
                        cb(null, false);
                    }
                });
            } else {
                // not find
                cb(null, false);
            }
        }
    });
}

function writeFile(stream, opts, key, cb) {
    weedfs.write(stream, opts, function (err, fileInfo) {
        if (err) {
            console.log('write fail: ' + err);

            cb(err);

            return;
        }

        if (fileInfo && fileInfo.error) {
            console.log('fileinfo error: ' + fileInfo.error);

            cb(fileInfo.error);
            return;
        }

        // save fileInfo to redis
        console.log('file id: ' + fileInfo.fid)
        client.set(key, fileInfo.fid, cb);
    });
}

function getFile(key, cb) {
    client.get(key, function (err, fileId) {
        if (err) {
            cb(err);
        } else {
            if (!fileId) {
                cb('file not exists');
            } else {
                weedfs.read(fileId, cb);
            }
        }
    });
}

function deleteFile(key, cb) {
    client.get(key, function (err, fileId) {
        if (err) {
            cb(err);
        } else {
            weedfs.remove(fileId, cb);
            // TODO: should delete the key in redis as well...
        }
    });
}

function putStyle(styleID, style, cb) {
    client.set(styleID, style, function (err, reply) {
        if (err) {
            console.log('Warning: cache style in redis fail: ' + err);
            cb(err);
        }
        cb(null);
    });
}

function getStyle(styleID, cb) {
    client.get(styleID, function (err, style) {
        if (err) {
            cb(err);
        } else {
            // style could be null!
            cb(null, style);
        }
    });
}


module.exports.writeFile = writeFile;
module.exports.getFile = getFile;
module.exports.deleteFile = deleteFile;
module.exports.hasFile = hasFile;
module.exports.getStyle = getStyle;
module.exports.putStyle = putStyle;


// tests

/*
var globalLod = fs.readFileSync(options.mapDir + "/map/lod.json");
writeFile(globalLod, { dataCenter: "dc1", collection: "map1" }, '0_0_0', function (err, reply) {
    if (err) {
        console.log(err);
    } else {
        console.log(reply);

        hasFile('0_0_0', function (err, find) {
            if (err) {
                console.log('error');
            } else {
                console.log('found: ' + find);
                getFile('0_0_0', function (err, response, body) {
                    if (err) {
                        console.log(err);
                    } else {
                        var filedata = body;
                        console.log(filedata.toString());


                        deleteFile('0_0_0', function (err, resp, body) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log("removed file.")
                            }
                        });
                    }
                });
            }
            return;
        });
    }
});
*/