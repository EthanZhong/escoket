;(function(global, lookup) {
	/*DEBUG LOG*/
	localStorage.debug = 'socket.io-client:socket';
	/* socket io 对象*/
	var _socket, _io;
	/*数组 slice 方法*/
	var _slice = Array.prototype.slice;
	/* Socket module */
	var Socket = {
		events: {
			ROOMINFO: 'roominfo',
			CLIENTINFO: 'clientinfo',
			PUBLISH: 'publish',
			DISCONNECT: 'disconnect',
			CREATECLIENT: 'createclient',
			CREATEROOM: 'createroom',
			JOIN: 'join',
			LEAVE: 'leave',
			LEAVEALL: 'leaveall',
			ROOMSTATE: 'roomstate'
		},
		describes: {
			PUBLISH: 'publish',
			SUCCESS: 'success',
			FAIL: 'fail',
			UNEXIST: 'unexist',
			FULL: 'full',
			STATEFAIL: 'statefail',
			LIMITED: 'limited'
		}
	};
	/*定义 Socket 属性*/
	Object.defineProperties(Socket, {
		socket: {
			get: function() {
				return _socket;
			}
		},
		io: {
			get: function() {
				return _.get(_socket, 'io');
			}
		},
		id: {
			get: function() {
				var _id = _.get(_socket, 'id');
				return (_id) ? '/#' + _id : _id;
			}
		},
		connected: {
			get: function() {
				return _.get(_socket, 'connected');
			}
		}
	});
	/*提取 socket 方法*/
	['connect', 'disconnect', 'send', 'emit', 'compress', 'listeners', 'on', 'once', 'off', 'hasListeners'].forEach(function(method) {
		Socket[method] = _pickMethod(method);
	});
	/*对数据 JSON 转换的变异 send emit 方法*/
	Socket.sd = function(type, data, fn) {
		if (_.isFunction(data)) {
			return this.send(type, data);
		} else {
			return this.send(type, transformData(data), fn);
		}
	}
	Socket.et = function(type, data, fn) {
		if (_.isFunction(data)) {
			return this.emit(type, data);
		} else {
			return this.emit(type, transformData(data), fn);
		}
	}
	/**
	 * 连接服务器
	 */
	Socket.lookup = function(uri, opts) {
		if (!_socket && _.isFunction(lookup)) {
			_socket = lookup(uri, opts);
		}
		return _socket;
	}
	/**
	 * 获取客户端信息
	 */
	Socket.clientInfo = function(client, fn) {
		return this.sd(this.events.CLIENTINFO, client, fn);
	}
	/**
	 * 获取房间信息
	 */
	Socket.roomInfo = function(room, fn) {
		return this.sd(this.events.ROOMINFO, room, fn);
	}
	/**
	 * 创建房间
	 */
	Socket.createRoom = function(autojoin, fn) {
		return this.sd(this.events.CREATEROOM, autojoin, fn);
	}
	/**
	 * 加入房间
	 */
	Socket.join = function(room, fn) {
		return this.sd(this.events.JOIN, room, fn);
	}
	/**
	 * 离开房间
	 */
	Socket.leave = function(room, fn) {
		return this.sd(this.events.LEAVE, room, fn);
	}
	/**
	 * 离开所有房间
	 */
	Socket.leaveAll = function() {
		return this.send(this.events.LEAVEALL);
	}
	/**
	 * 修改房间状态
	 */
	Socket.roomState = function(room, state, fn) {
		return this.sd(this.events.ROOMSTATE, {
			room: room,
			state: state
		}, fn);
	}
	/**
	 * 发布消息
	 */
	Socket.publish = function(room, msg) {
		return this.sd(this.events.PUBLISH, {
			room: room,
			msg: msg
		});
	}
	/*提取 socket 的方法*/
	function _pickMethod(method) {
		return function() {
			var fn = _.get(_socket, method);
			if (!_.isFunction(fn)) return _socket;
			return fn.apply(_socket, _slice.call(arguments));
		}
	}
	/*对发送的数据进行转换*/
	function transformData(data) {
		if (_.isObjectLike(data)) {
			try {
				data = JSON.stringify(data);
			} catch (err) {}
		}
		return data;
	}
	/*exports module*/
	return Socket;
})(window, window.io);