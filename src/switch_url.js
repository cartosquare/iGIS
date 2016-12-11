
var ipc = require('electron').ipcRenderer;

function getMapList() {
    $.ajax({
        url: 'http://localhost:3000/listMap',
        type: 'POST',
        data: {
            page: 0
        },
        error: function (xhr, textStatus, errorThrown) {
            getMapList();
        },
        success: function (data, textStatus) {
            ipc.send('open-dashboard');
        }
    });
}
// 当mapping服务完全启动时，切换到dashboard页面
setTimeout(function() {
    getMapList();
}, 10000);

