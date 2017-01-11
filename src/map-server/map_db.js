var mapConfig = require('./config').options;
var sqlite3 = require('sqlite3');
var fs = require('fs');

mapDB = new sqlite3.Database(mapConfig.mapDir + '/maps.db');

exports.createTable = function() {
    mapDB.run(
        "CREATE TABLE IF NOT EXISTS maps(\
        id INTEGER PRIMARY KEY,\
        name VARCHAR(50),\
        def TEXT,\
        desc TEXT,\
        thumb BLOB,\
        last_modified datetime default (datetime('now', 'localtime')))"
    )
}

exports.dropTable = function() {
    mapDB.run("DROP TABLE maps")
}

exports.insert = function (name, def, desc, callback) {
    mapDB.run("INSERT INTO maps VALUES (NULL, ?, ?, ?, NULL, datetime('now', 'localtime'))", name, def, desc, callback);
}

exports.delete = function (id, callback) {
    // TODO: check whether this record is exist
    mapDB.run("DELETE FROM maps WHERE id = ?", id, callback);
}

exports.printAll = function () {
    mapDB.each("SELECT * FROM maps", function (err, row) {
        console.log(row);
    });
}

exports.queryAll = function(callback) {
    mapDB.all("SELECT id, name, desc, last_modified FROM maps order by last_modified desc", callback) 
}

exports.update = function (id, name, def, desc, callback) {
    // sometimes def is not absent
    if(def) {
        mapDB.run("UPDATE maps SET name = ?, def = ?, desc = ?, last_modified = datetime('now', 'localtime') WHERE id = ?", name, def, desc, id, callback);
    } else {
        mapDB.run("UPDATE maps SET name = ?, desc = ?, last_modified = datetime('now', 'localtime') WHERE id = ?", name, desc, id, callback);
    }
}

exports.getDef = function(id, callback) {
    mapDB.get("SELECT def FROM maps WHERE ID = ?", id, callback);
}

exports.getThumb = function(id, callback) {
    mapDB.get("SELECT thumb FROM maps WHERE ID = ?", id, callback);
}

exports.closeDB = function () {
    mapDB.close()
}

// insert from file
exports.insertFile = function(name, defFile, desc) {
    var def = fs.readFileSync(defFile, 'utf8');
    exports.insert(name, def, desc)
}