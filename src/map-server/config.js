// 配置参数
exports.options = {
    mapDir: '/Users/xuxiang/mapping',
    version: '0.1.0',
    port: 3000,
    logLevel: 2,
    bufferSize: 32,

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
        port: '8888'
    }
}

//
/*
./weed server -dir="data" -filer=true -filer.redis.server="localhost:6379" -volume.max=1000 
*/
