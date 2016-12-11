var config = {
    mapDBPath: '/Users/xuxiang/mapping/maps.db',
    version: '0.0.1',
    port: '3000',
    logLevel: 2,
    mapDir: '/Users/xuxiang/mapping',
    osmConn: {
        name: 'osm',
        url: 'PG:dbname=osm host=localhost port=5432 user=xuxiang',
        initialConnSize: 5,
        maxConnSize: 10
    },
    weed: {
        host: 'localhost',
        port: '8888'
    },
    // TODO: remove this
    vtConfig: ['vt_base', 'tourism', 'physical', 'natural_earth', 'river']
}

exports.config = config