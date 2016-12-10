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

var shapeLayer, labelLayer;

function refreshMapping() {
  if (!mappingUid) {
    return;
  }

  $('#btn-refresh').addClass('fa-spin');

  $.ajax({
    url: 'http://localhost:3000/mapdef?name=' + mappingUid,
    type: 'GET',
    error: function(xhr, textStatus, errorThrown) {
      console.error("Error: " + textStatus + " / " + JSON.stringify(errorThrown));
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

      $('#btn-save i').attr('class', 'fa fa-cloud-upload');
      $("#btn-save").removeAttr('disabled');

      $('#list-modal').fadeOut();
    }, function(error) {
      $('#btn-refresh').removeClass('fa-spin');
      showError(error.message, true);
    }
  }); 
};

function refreshMappingList() {
  $('#list-modal #btn-refresh .fa').addClass('fa-spin');
  $('#list-modal #div-list ul').empty();

  $.ajax({
    url: 'http://localhost:3000/maplist?page=' + currentPage,
    type: 'GET',
    error: function(xhr, textStatus, errorThrown) {
      $('#list-modal #btn-refresh .fa').removeClass('fa-spin');
      console.error("Error: " + textStatus + " / " + JSON.stringify(errorThrown));
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
          var item = {
            'uid': i,
            'name': data.items[i],
            'description': data.items[i]
          }
          var thumbUrl = url.format({
            pathname: path.join(__dirname, 'app.png'),
            protocol: 'file:',
            slashes: true
          })

          var lines = [
            '<li class="list-item"><a id="' + item.name + '" href="javascript:;">',
            '<div class="list-item-thumb" style="background-size:contain; background-image:url(\'' + thumbUrl + '\')"></div>',
            '<div class="list-item-info">',
            '<div class="list-item-name">' + item.name + '</div>',
            '<div class="list-item-desc">' + (item.description ? item.description : '没有描述信息') + '</div>',
            '</div>',
            '</a></li>'
          ].join('');

          $('#list-modal #div-list ul').append($(lines));

          $('#list-modal #' + item.name).bind('click', function() {
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

  // if (labelLayer) {
  //   labelLayer.remove();
  // }

  shapeLayer = new G.Layer.Tile('http://localhost:' + port + '/basemap/' + mappingUid +  '/{z}/{x}/{y}' + '?data=' + versionID);
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
  var url = 'http://localhost:' + port + '/' + mappingUid //
    + '/render?token=' + storedUser['token'] //
    + '&lod=' + mappingLod //
    + '&def=' + mappingDef // 
    + '&cx=' + mapCenter[0] + '&cy=' + mapCenter[1] + '&res=' + mapRes //
    + '&width=' + w + '&height=' + h + '&retinaFactor=' + retinaFactor;

  $('#print-modal #img-preview').attr('src', url);
  $('#print-modal #btn-ok').attr('href', url);
}

function createmap() {
  var mapName = $('#createmap-modal #name').val()
  var mapDesc = $('#createmap-modal #desc').val()

  console.log(mapName)
  console.log(mapDesc)

  
  $('#createmap-modal').hide()
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

$('#list-modal #btn-add').bind('click', function() {
  $('#createmap-modal').fadeIn();
});