// 配置参数
exports.options = {
    mapDBPath: '/Users/xuxiang/mapping/maps.db',
    version: '4.1.0',
    port: 3000,
    mapDir: '/Users/xuxiang/mapping',
    rawDEM: '/Users/xuxiang/mapping/rt/china.tif',
    styleDB: '/Users/xuxiang/mapping/styles.db',
    logLevel: 2,
    bufferSize: 32,
    sqlConn: 'PG:dbname=g-default host=rdsu39qy77f37y4q07vuo.pg.rds.aliyuncs.com port=3433 user=projx password=Warren576642',

    vtConfig: ['vt_base', 'tourism', 'physical', 'natural_earth', 'river'],
    styleConfig: ['shapefile', 'admin', 'adventure', 'agriculture', 'cool', 'dark', 'fresh', 'global_light', 'contrast', 'history', 'light', 'blue', 'midnight', 'night', 'vision', 'pencil', 'natural', 'pink', 'river', 'tourism', 'warm', 'chinese', 'history'],
    osmConn: {
        name: 'osm',
        url: 'PG:dbname=osm host=localhost port=5432 user=xuxiang',
        initialConnSize: 5,
        maxConnSize: 10
    },
    redis: {
        host: 'localhost',
        port: 6379
    },
    weed: {
        host: 'localhost',
        port: '9333'
    }
}
