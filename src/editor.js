
var colorFields = [
	'background_color',
	'marker_color',
	'label_background_color',
	'label_text_color',
	'label_text_outline_color',
	'line_color',
	'outline_color',
	'outline_opacity',
	'fill_color'
];

var colorArrayFields = [];
//var colorArrayFields = ['ramp_color'];

function colorHex(r, g, b) {
	function hex(x) {
		return ('0' + parseInt(x).toString(16)).slice(-2);
	}
	return '#' + hex(r) + hex(g) + hex(b);
};

function colorRgb(hex) {
	function num(h, start, end) {
		if (!h.substring) {
			return;
		}

		var n = parseInt(h.substring(start, end), 16);
		if (end - start === 2) {
			return n;
		} else {
			return (256 - (16 - n) * (16 - n));
		}
	}

	if (hex.length < 5) {
		return [num(hex, 1, 2), num(hex, 2, 3), num(hex, 3, 4)];
	} else {
		return [num(hex, 1, 3), num(hex, 3, 5), num(hex, 5, 7)];
	}
};

function colorsToEditor(obj) {
	if (!isObject(obj)) {
		return obj;
	}

	var newObj = $.extend({}, obj);

	for (var key in newObj) {
		if (colorFields.indexOf(key) >= 0) {
			var rgb = newObj[key];
			newObj[key] = colorHex(rgb[0] || 0, rgb[1] || 0, rgb[2] || 0);
		} else if (colorArrayFields.indexOf(key) >= 0) {
			for (var i in newObj[key]) {
				var rgb = newObj[key][i];
				newObj[key][i] = colorHex(rgb[0] || 0, rgb[1] || 0, rgb[2] || 0);
			}
		} else {
			if (isArray(newObj[key])) {
				for (var i in newObj[key]) {
					newObj[key][i] = colorsToEditor(newObj[key][i]);
				}
			} else {
				newObj[key] = colorsToEditor(newObj[key]);
			}
		}
	}

	return newObj;
};

function colorsToRender(obj) {
	if (!isObject(obj)) {
		return obj;
	}

	var newObj = $.extend({}, obj);

	for (var key in newObj) {
		if (colorFields.indexOf(key) >= 0) {
			var hex = newObj[key];
			newObj[key] = colorRgb(hex);
		} else if (colorArrayFields.indexOf(key) >= 0) {
			for (var i in newObj[key]) {
				var hex = newObj[key][i];
				newObj[key][i] = colorRgb(hex);
			}
		} else {
			if (isArray(newObj[key])) {
				for (var i in newObj[key]) {
					newObj[key][i] = colorsToRender(newObj[key][i]);
				}
			} else {
				newObj[key] = colorsToRender(newObj[key]);
			}
		}
	}

	return newObj;
};

function toEditorObj(renderObj) {
	return colorsToEditor(renderObj);
};


function toRenderObj(editorObj) {
	return colorsToRender(editorObj);
};

function notifyEditorStatus() {
	var historySize = editor.historySize();
	var dirty = historySize.undo || historySize.redo;
	
	// ipc.send('editor-status', {
	// 	dirty: dirty
	// });
};
CodeMirror.commands.autocomplete = function(cm) {
  cm.showHint({hint: CodeMirror.hint.anyword});
}

var editor = CodeMirror(document.getElementById("config-editor"), {
	mode: {
		name: "javascript",
		json: true
	},
	theme: 'monokai',
	lineNumbers: true,
	styleActiveLine: true,
	extraKeys: {"Alt-Space": "autocomplete"}
});

Inlet(editor, {
	slider: false
});
$('.inlet_slider').hide(); // 禁用数值slider

var editorTimer;
editor.on('change', function(e) {
	var historySize = editor.historySize();

	if (historySize.undo) {
		$('#btn-undo').css('visibility', 'visible');
	} else {
		$('#btn-undo').css('visibility', 'hidden');
	}

	if (historySize.redo) {
		$('#btn-redo').css('visibility', 'visible');
	} else {
		$('#btn-redo').css('visibility', 'hidden');
	}
	/*
	notifyEditorStatus();

	if (editorTimer) {
		clearTimeout(editorTimer);
	}

	editorTimer = setTimeout(function() {
		var editorText = editor.getValue();
		var editorObj = JSON.parse(editorText);

		mappingDefObj = toRenderObj(editorObj);
		mappingDef = JSON.stringify(mappingDefObj);

		refreshRender();
	}, 1000);
	*/
});

var foldFunc = CodeMirror.newFoldFunction(CodeMirror.braceRangeFinder);
editor.on("gutterClick", foldFunc);

function refreshEditor() {
	var editorObj = toEditorObj(mappingDefObj);
	var text = JSON.stringify(editorObj, null, 2) + '\n'; // 多加一个空行，确保滚动后能看到所有文本

	editor.setValue(text);
	editor.clearHistory();

	notifyEditorStatus();

	$('#btn-redo').css('visibility', 'hidden');
	$('#btn-undo').css('visibility', 'hidden');
};

function clearSelectAndScroll() {
	for (var i in editor._$marks) {
		editor._$marks[i].clear();
	}
	editor._$marks = [];

	editor.scrollIntoView(0);

	editor._$index = 0;
};

function selectAndScroll(str) {
	if (!str) {
		clearSelectAndScroll();
		return;
	}

	var strLen = str.length;
	var index = editor._$index || 0;

	var text = editor.getValue();
	var rows = text.split('\n').length;

	var start = text.indexOf(str, index);
	if (start < 0) {
		clearSelectAndScroll();
		start = text.indexOf(str, 0);
	}
	if (start < 0) {
		clearSelectAndScroll();
		return;
	}
	var end = start + strLen;

	var textSub = text.substring(0, start);
	var rows = textSub.split('\n');
	var lastRow = rows.pop();
	var preLen = rows.length;
	var lastLen = lastRow ? lastRow.length : 0;

	var mark = editor.markText({
		line: preLen,
		ch: lastLen
	}, {
		line: preLen,
		ch: lastLen + strLen
	}, {
		className: 'CodeMirror-selected'
	});
	editor._$marks = editor._$marks || [];
	editor._$marks.push(mark);

	var scrollInfo = editor.getScrollInfo();
	var currentLine = scrollInfo.top / scrollInfo.height * editor.lineCount();

	editor.scrollIntoView(preLen < currentLine ? preLen : preLen + 3);

	editor._$index = end + 1;
};

$('#input-query').bind('keyup', function(e) {
	var query = $('#input-query').val();
	if (query != editor._$query) {
		clearSelectAndScroll();
		editor._$query = query;
	}

	var keyCode = e.keyCode;
	if (keyCode == 27) { // Esc
		$('#input-query').val('');
		clearSelectAndScroll();
	} else {
		selectAndScroll(query);
	}
});

$('#btn-redo').bind('click', function() {
	editor.redo();
});

$('#btn-undo').bind('click', function() {
	editor.undo();
});

$('#btn-refresh').bind('click', function() {
	var historySize = editor.historySize();
	if (historySize.undo || historySize.redo) {
		$('#confirm-modal #message').text('有未保存的数据，确认丢弃现有的数据吗？');
		$('#confirm-modal #btn-ok').one('click', function() {
			$('#input-query').val('');
			refreshMapping();

			$('#confirm-modal').hide();
		});

		$('#confirm-modal').show();
		$('#confirm-modal #btn-ok').focus();
	} else {
		$('#input-query').val('');
		refreshMapping();
	}
});

$('#btn-help').bind('click', function() {
	$('#config-help').slideToggle();
});