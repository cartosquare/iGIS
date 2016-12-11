var port = 3000;

const path = require('path')
const url = require('url')

var mappingUid;
var mappingName;
var mappingLod;
var mappingDef;
var mappingDefObj;
var versionID = 0;
var currentPage = 0;

var shapeLayer;

function refreshMapping() {
  if (!mappingUid) {
    return;
  }

  $('#btn-refresh').addClass('fa-spin');
  
  $.ajax({
    url: 'http://localhost:3000/mapDef/' + mappingUid,
    type: 'GET',
    error: function(xhr, textStatus, errorThrown) {
      $('#btn-refresh').removeClass('fa-spin');
      showError('refresh fail', true);
    },
    success: function(data, textStatus) {
      $('#btn-refresh').removeClass('fa-spin');

      mappingDefObj = JSON.parse(data);
      if (mappingDefObj.init && mappingDefObj.init.center && mappingDefObj.init.res) {
        map.zoomRes(mappingDefObj.init.center, mappingDefObj.init.res);
      }
      delete mappingDefObj.init;

      refreshEditor();
      refreshRender();

      //$("#btn-save").removeAttr('disabled');
      $('#list-modal').fadeOut();
    }
  });
};

function refreshMappingList() {
  $('#list-modal #btn-refresh .fa').addClass('fa-spin');
  $('#list-modal #div-list ul').empty();

  $.ajax({
    url: 'http://localhost:3000/listMap',
    type: 'POST',
    data: {
      page: currentPage
    },
    error: function(xhr, textStatus, errorThrown) {
      $('#list-modal #btn-refresh .fa').removeClass('fa-spin');
      showError('refresh mapping list fail', true);
    },
    success: function(data, textStatus) {
      $('#list-modal #btn-refresh .fa').removeClass('fa-spin');

      var data = JSON.parse(data)
      var page = currentPage = data.page;

      // TODO: the disabled attribute is useless!
      if (data.hasNext) {
        $('#list-modal #btn-next').removeAttr('disabled');
      } else {
        $('#list-modal #btn-next').attr('disabled', '');
      }

      if (data.items.length == 0) {
        showInfo('没有符合条件的地图', true);
      } else {
        for(i = 0; i < data.items.length; ++i) {
          var item = data.items[i]

          var thumbUrl = url.format({
            pathname: path.join(__dirname, 'app.png'),
            protocol: 'file:',
            slashes: true
          })

          var lines = [
            '<li class="list-item"><a id="' + item.id + '" href="javascript:;">',
            '<div class="list-item-thumb" style="background-size:contain; background-image:url(\'' + thumbUrl + '\')"></div>',
            '<div class="list-item-info">',
            '<div class="list-item-name">' + item.name + '</div>',
            '<div class="list-item-desc">' + (item.desc ? item.desc : '没有描述信息') + '</div>',
            '<div class="list-item-time">' + (item.last_modified) + '</div>',
            '</div>',
            '</a></li>'
          ].join('');

          $('#list-modal #div-list ul').append($(lines));

          $('#list-modal #' + item.id).bind('click', function() {
            mappingUid = this.id;
            refreshMapping();
          });
        }
      }
    }
  })
};

function refreshRender() {
  if (shapeLayer) {
    shapeLayer.remove();
  }

  shapeLayer = new G.Layer.Tile('http://localhost:' + port + '/mapTile/' + mappingUid +  '/{z}/{x}/{y}' + '?data=' + versionID);
  shapeLayer.addTo(map);
};

function refreshPrint() {
  $('#print-modal #loading').show();

  var w = parseInt($('#print-modal #input-width').val());
  var h = parseInt($('#print-modal #input-height').val());
  var dpi = parseInt($('#print-modal #select-dpi').val());
  var retinaFactor = dpi / 72;

  var mapCenter = map.getCenter();
  var mapRes = map.getResolution();
  var url = 'http://localhost:' + port + '/staticMap/' + mappingUid //
    + '?cx=' + mapCenter[0] + '&cy=' + mapCenter[1] + '&res=' + mapRes //
    + '&width=' + w + '&height=' + h + '&retinaFactor=' + retinaFactor;

  $('#print-modal #img-preview').attr('src', url);
  $('#print-modal #btn-ok').attr('href', url);
}

function createmap() {
  var mapName = $('#createmap-modal #name').val();
  var mapDesc = $('#createmap-modal #desc').val();
  
  var mapdef = '{\
  "background_color": [100, 100, 100],\
  "data_sources": {\
    "admin": {\
      "source": "datasource/admin",\
      "type": "shapefile"\
    }\
  },\
 "layers": {\
    "world": {\
      "data_source": "admin",\
      "data_name": "world_country_polygon",\
      "rules": [\
        {\
          "res_max": 156544,\
          "res_min": 0,\
          "symbol_type": "fill",\
          "fill_color": [255, 0, 0],\
          "outline_color": [255, 255, 255]\
        }\
      ]\
    }\
 }\
}';
  
  $.ajax({
    url: 'http://localhost:3000/createMap',
    type: 'POST',
    data: {
      name: mapName,
      def: mapdef,
      desc: mapDesc
    },
    error: function(xhr, textStatus, errorThrown) {
      showError('create map fail', true);
    },
    success: function(data, textStatus) {
      data = JSON.parse(data);
      if (data.error) {
        showError('创建地图失败');
      } else {
        showInfo('创建地图成功');
        refreshMappingList();
      }
      $('#createmap-modal').hide()
    }
  });

  
}

function deleteMap() {
  $.ajax({
    url: 'http://localhost:3000/deleteMap/' + mappingUid,
    type: 'POST',
    error: function(xhr, textStatus, errorThrown) {
      showError('delete map fail', true);
    },
    success: function(data, textStatus) {
      data = JSON.parse(data);
      if (data.error) {
        showError('删除地图失败');
      } else {
        showInfo('删除地图成功');

        // show and refresh mapping list
        $('#list-modal').fadeIn();
        $('#list-modal #btn-refresh').click();
      }
    }
  });
}
$('#list-modal #btn-prev').bind('click', function() {
  currentPage -= 1;
  if (currentPage < 0) {
    currentPage = 0;
  }

  refreshMappingList();
});

$('#list-modal #btn-next').bind('click', function() {
  currentPage += 1;

  refreshMappingList();
});

$('#list-modal #btn-refresh').bind('click', function() {
  currentPage = 0;

  refreshMappingList();
});