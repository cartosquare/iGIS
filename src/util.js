function isObject(obj) {
	return (Object.prototype.toString.call(obj) === '[object Object]');
};

function isArray(obj) {
	return (Object.prototype.toString.call(obj) === '[object Array]');
};

function showError(text, autoHide) {
	noty({
		text: text,
		type: 'error',
		layout: 'center',
		killer: true,
		template: '<div class="noty_message noty_message_error"><span class="noty_text"></span><div class="noty_close"></div></div>',
		callback: {
			afterShow: function() {
				if (autoHide) {
					var self = this;
					setTimeout(function() {
						self.close();
					}, 3000);
				}
			}
		}
	});
};

function showInfo(text, autoHide) {
	noty({
		text: text,
		type: 'information',
		layout: 'center',
		template: '<div class="noty_message noty_message_info"><span class="noty_text"></span><div class="noty_close"></div></div>',
		timeout: 2000,
		killer: true,
		callback: {
			afterShow: function() {
				if (autoHide) {
					var self = this;
					setTimeout(function() {
						self.close();
					}, 3000);
				}
			}
		}
	});
};

function showWarning(text, autoHide) {
	noty({
		text: text,
		type: 'warning',
		layout: 'center',
		template: '<div class="noty_message noty_message_warning"><span class="noty_text"></span><div class="noty_close"></div></div>',
		killer: true,
		callback: {
			afterShow: function() {
				if (autoHide) {
					var self = this;
					setTimeout(function() {
						self.close();
					}, 3000);
				}
			}
		}
	});
};

function setCookie(name, value, days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		var expires = "; expires=" + date.toGMTString();
	} else var expires = "";
	document.cookie = name + "=" + value + expires + "; path=/";
};

function getCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
};

function deleteCookie(key, path, domain) {
	document.cookie = encodeURIComponent(key) +
		"=; expires=Thu, 01 Jan 1970 00:00:00 GMT" +
		(domain ? "; domain=" + domain : "") +
		(path ? "; path=" + path : "");
};