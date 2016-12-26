import device;
import event.Emitter as Emitter;
import util.setProperty as setProperty;

var nativeSendEvent = NATIVE && NATIVE.plugins && bind(NATIVE.plugins, 'sendEvent') || function () {};
var nativeRegisterHandler = NATIVE && NATIVE.events.registerHandler && bind(NATIVE.events, 'registerHandler') || function () {};


var LocalNotify = Class(Emitter, function (supr) {
	var _activeCB = [];
	var _getCB = {};
	var _pending = [];
	var _onNotify;

	var deliverPending = function() {
		if (_onNotify) {
			for (var ii = 0; ii < _pending.length; ++ii) {
				_onNotify(_pending[ii]);
			}
			_pending.length = 0;
		}
	}

	var UnpackInfo = function(info) {
		try {
			info.date = new Date(info.utc * 1000);
			info.userDefined = JSON.parse(info.userDefined);
		} catch (e) {
		}
	}

	this.init = function() {
		supr(this, 'init', arguments);

		nativeRegisterHandler("LocalNotifyList", function(evt) {
			for (var ii = 0; ii < evt.list.length; ++ii) {
				UnpackInfo(evt.list[ii]);
			}

			for (var ii = 0; ii < _activeCB.length; ++ii) {
				_activeCB[ii](evt.list);
			}
			_activeCB.length = 0;
		});

		nativeRegisterHandler("LocalNotifyGet", function(evt) {
			var info = evt.info;

			UnpackInfo(info);

			var cbs = _getCB[info.name];
			if (cbs) {
				for (var ii = 0; ii < cbs.length; ++ii) {
					cbs[ii](evt.error ? null : info);
				}
				cbs.length = 0;
			}
		});

		nativeRegisterHandler("LocalNotify", function(evt) {
			var info = evt.info;

			UnpackInfo(info);

			if (_onNotify) {
				logger.log("{localNotify} Delivering event", info.name);

				_onNotify(info);
			} else {
				logger.log("{localNotify} Pending event", info.name);

				_pending.push(info);
			}
		});

		setProperty(this, "onNotify", {
			set: function(f) {
				// If a callback is being set,
				if (typeof f === "function") {
					_onNotify = f;

					setTimeout(deliverPending, 0);
				} else {
					_onNotify = null;
				}
			},
			get: function() {
				return _onNotify;
			}
		});

		// Tell the plugin we are ready to handle events
		nativeSendEvent("LocalNotifyPlugin", "Ready", "{}");
	};

	// requests permission
	this.requestNotificationPermission = function () {
		nativeSendEvent("LocalNotifyPlugin", "requestNotificationPermission", "{}");
	};

	this.list = function(next) {
		if (_activeCB.length === 0) {
			nativeSendEvent("LocalNotifyPlugin", "List", "{}");
		}
		_activeCB.push(next);
	}

	this.get = function(name, next) {
		nativeSendEvent("LocalNotifyPlugin", "Get", JSON.stringify({
			name: name
		}));

		if (_getCB[name]) {
			_getCB[name].push(next);
		} else {
			_getCB[name] = [next];
		}
	}

	this.clear = function() {
		nativeSendEvent("LocalNotifyPlugin", "Clear", "{}");
	}

	this.remove = function(name) {
		nativeSendEvent("LocalNotifyPlugin", "Remove", JSON.stringify({
			name: name
		}));
	}

	this.isIos = function () {
	    if (device.isIPhone || device.isIPad) {
	      return true;
	    }
    };

	this.calculateTime = function (obj) {
		var time = 0;

		if (obj.seconds) {
			time += obj.seconds;
		}
		if (obj.minutes) {
			time += obj.minutes * 60;
		}
		if (obj.hours) {
			time += obj.hours * 60 * 60;
		}
		if (obj.days) {
			time += obj.days * 60 * 60 * 24;
		}
		return time;
	}

	this.getDiscreteTime = function (time) {
		// as ios only support repeat notification in
		// either after a each minute or each hour or
		// day or week or month, so for ios we need to change it to
		// this format
		// on other hand android takes repeat interval in miliseconds

		if (time >= 2592000) {
			time = "month"
		} else if(time >= 60480) {
			time = "week";
		} else if (time >= 86400) {
			time = "day";
		} else if (time >= 3600) {
			time = "hour";
		} else if(time > 0)  {
			time = "minute";
		}
		return time;
	}

	this.add = function(opts) {
		// Inject date
		var date = opts.date;
		if (!date) {
			date = new Date();
		}
		var time = date.getTime() / 1000;
		if (opts.delay) {
			opts.utc = time + this.calculateTime(opts.delay);
		}

		if(opts.repeat) {
			time  = this.calculateTime(opts.repeat);
			opts.repeat = this.isIos() ?
				this.getDiscreteTime(time) : time;
		}

		if (typeof opts.userDefined === "object") {
			opts.userDefined = JSON.stringify(opts.userDefined);
		} else {
			opts.userDefined = '{"value":"' + opts.userDefined + '"}';
		}

		nativeSendEvent("LocalNotifyPlugin", "Add", JSON.stringify(opts));
	}
});

exports = new LocalNotify();

