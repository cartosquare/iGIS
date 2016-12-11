
$('#btn-open').bind('click', function() {
  var historySize = editor.historySize();
  if (historySize.undo || historySize.redo) {
    $('#confirm-modal #message').text('有未保存的数据，确认丢弃现有的数据吗？');
    $('#confirm-modal #btn-ok').one('click', function() {
      $('#btn-save i').attr('class', 'fa fa-cloud-upload');
      $("#btn-save").removeAttr('disabled');

      $('#list-modal').fadeIn();
      $('#list-modal #btn-refresh').click();

      $('#confirm-modal').hide();
    });

    $('#confirm-modal').show();
  } else {
    $('#list-modal').fadeIn();
    $('#list-modal #btn-refresh').click();
  }
});

$('#btn-delete').bind('click', function() {
  $('#confirm-modal #message').text('删除地图不可恢复，一定要删除吗？');
		$('#confirm-modal #btn-ok').one('click', function() {
			$('#input-query').val('');
			deleteMap();

			$('#confirm-modal').hide();
		});

		$('#confirm-modal').show();
		$('#confirm-modal #btn-ok').focus();
});

$('#btn-setting').bind('click', function () {
  $('#createmap-modal .title').text('地图配置');

  var mapname = $('#list-modal #'+ mappingUid + ' .list-item-name').text();
  var mapdesc = $('#list-modal #'+ mappingUid + ' .list-item-desc').text();

  $('#createmap-modal #name').val(mapname);
  $('#createmap-modal #desc').val(mapdesc);

  $('#createmap-modal').fadeIn();
  $('#createmap-modal #btn-ok').unbind();
  $('#createmap-modal #btn-ok').bind('click', function () {
    $.ajax({
      url: 'http://localhost:3000/updateMap/' + mappingUid,
      type: 'POST',
      data: {
        id: mappingUid,
        name: $('#createmap-modal #name').val(),
        desc: $('#createmap-modal #desc').val()
      },
      error: function (xhr, textStatus, errorThrown) {
        showError(textStatus, true);
      },
      success: function (data, textStatus) {
        $('#app-tab #info-success').fadeIn(1500, function () {
          $('#app-tab #info-success').fadeOut(1500);
        });

        $('#createmap-modal').fadeOut();
      }
    })
  });

});

$('#list-modal #btn-add').bind('click', function () {
  $('#createmap-modal .title').text('创建地图');
  $('#createmap-modal #name').val('');
  $('#createmap-modal #desc').val('');

  $('#createmap-modal').fadeIn();

  $('#createmap-modal #btn-ok').unbind()
  $('#createmap-modal #btn-ok').bind('click', createmap);
});

$('#btn-save').bind('click', function() {
  //$('#btn-save i').attr('class', 'fa fa-refresh fa-spin');
  $("#btn-save").attr('disabled', '');

  var text = editor.getValue();
  var obj = JSON.parse(text);
  var defObj = toRenderObj(obj);

  /*
  for (var i in defObj['data_sources']) {
    var ds = defObj['data_sources'][i];

    if (ds.type == 'vector_tile') {
      ds.source = ds.source.substring(ds.source.indexOf('vt/') + 3);
      ds.type = 'cloud_vector_tile';
      local.resources.vts.push(ds.source);
    }
  }
  */
  defObj.init = {
    center: map.getCenter(),
    res: map.getResolution(),
    rotate: map.getRotate()
  };

  //var size = map.getSize();
  var mapname = $('#' + mappingUid + ' .list-item-name').text();
  var mapdesc = $('#' + mappingUid + ' .list-item-desc').text();

  $.ajax({
    url: 'http://localhost:3000/updateMap/' + mappingUid,
    type: 'POST',
    data: {
      id: mappingUid,
      name: mapname,
      desc: mapdesc,
      def: JSON.stringify(defObj)
    },

    error: function(xhr, textStatus, errorThrown) {
      console.error("Error: " + textStatus + " / " + JSON.stringify(errorThrown));
      //$('#btn-save i').attr('class', 'fa fa-cloud-upload');
      $("#btn-save").removeAttr('disabled');
      showError(textStatus, true);
    },
    success: function(data, textStatus) {
      //$('#btn-save i').attr('class', 'fa fa-cloud-upload');
      $("#btn-save").removeAttr('disabled');

      $('#app-tab #info-success').fadeIn(1500, function() {
        $('#app-tab #info-success').fadeOut(1500);
      });
    
      editor.clearHistory();

      versionID = versionID + 1;
      refreshRender()
    }
  })
});


var map;

$('#print-modal #img-preview').bind('load', function() {
  $('#print-modal #loading').hide();
});

$('#print-modal #img-preview').bind('error', function() {
  $('#print-modal #loading').hide();
});

$('#print-modal #input-width').bind('change', function() {
  refreshPrint();
});

$('#print-modal #input-height').bind('change', function() {
  refreshPrint();
});

$('#print-modal #select-dpi').bind('change', function() {
  refreshPrint();
});

$('#btn-print').bind('click', function() {
  if ($('#btn-print').attr('disabled')) {
    return;
  }

  refreshPrint();

  $('#print-modal').fadeIn();
});

$('#btn-zoom-in').bind('click', function() {
  if (map) {
    map.zoomIn();
  }
});

$('#btn-zoom-out').bind('click', function() {
  if (map) {
    map.zoomOut();
  }
});

// default open map list
$('#btn-open').click();

G.ready(function() {

  map = new G.Map('map-container', {
    hideLogo: true,
    recordStatus: false,
    canvasAnimRedraw: true
  });

  map.addListener("zoom", function() {
    $('#map-info #res').text(map.getResolution());
  });

  map.addListener("zoomEnd", function() {
    $('#map-info #res').text(map.getResolution());
  });

  $('#btn-print').removeAttr('disabled');
});

$('#splash').hide();
$('#app-tab').fadeIn();
$('#app-content').fadeIn();