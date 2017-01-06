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
	var editorObj = mappingDefObj;
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