'use strict';
var _=require('lodash'),
	Server=require('socket.io'),
	Room=require('./room'),
	Client=require('./client'),
	Sundry=require('./sundry');

var _io=null,
	_connHandlers=[];
/*对外开放访问 Room Client  Sundry*/
exports.Room=Room;
exports.Client=Client;
exports.Sundry=Sundry;
/*定义 exports 属性的 getter and setter */
Object.defineProperties(exports,{
	maxclients:{
		set:function(max){
			Client.maxClients=max;
		}
	},
	maxrooms:{
		set:function(max){
			Room.maxRooms=max;
		}
	},
	roomclients:{
		set:function(max){
			Room.maxClients=max;
		}
	},
	roomtimeout:{
		set:function(time){
			Room.timeOut=time;
		}
	},
	io:{
		get:function(){
			return _io;
		}
	},
	nsp:{
		get:function(){
			return _.get(this.io,'sockets');
		}
	},
	nsps:{
		get:function(){
			return _.get(this.io,'nsps');
		}
	}
});
/**
 * [启动服务 服务仅能启动一次]
 * @param {http.Server|Number|Object} srv [http server, port or options]
 * @param {Object} opts
 */
exports.server=function(srv,opts){
	if(!_io){
		_io=new Server(srv,opts);
		_io.on('connection',onConnection);
	}
	return this;
}
/**
 * [same as io.attach]
 */
exports.listen=exports.attach=function(srv,opts){
	if(_io){
		_io.attach(srv,opts);
	}
	return this;
}
/**
 * [从外部添加 connection 的处理侦听]
 * @param {Function} fn [处理函数]
 */
exports.addHandler=function(fn){
	if(!_.includes(_connHandlers,fn)&&_.isFunction(fn)){
		_connHandlers.push(fn);
	}
	return this;
}
/**
 * [从外部删除 connection 的处理侦听]
 * @param {Function} fn [处理函数]
 */
exports.removeHandler=function(fun){
	_.pull(_connHandlers,fn);
	return;
}
/**
 * [捕获每一个连接进来的 socket 并进行封装管理]
 */
function onConnection(socket){
	/*尝试创建一个接入客户端*/
	var client=Client.createClient(socket);
	var _event,_roomid,_room,_clientid,_client;
	if(client){
		/*捕获客户端消息*/
		socket.on('message',function(type,data,fn){
			if(!_.isFunction(fn))fn=null;
			if(_.isFunction(data)){

				fn=data;
				data=null;
			}else{
				try{data=JSON.parse(data);}catch(err){}
			}
			/*根据 type 类型执行对应服务端操作*/
			switch(type){
				case Sundry.events.CLIENTINFO:
					/*获取客户端信息*/
					_clientid=(_.has(data,'client'))?_.get(data,'client'):data;
					_client=Client.getClient(_clientid);
					_client=_client||client;
					_event=Sundry.createEvent(Sundry.events.CLIENTINFO).setStatus(true).setDescribe(Sundry.describes.SUCCESS).assignData({
						client:_client.id,
						rooms:_client.rooms,
						connected:_client.connected
					});
					fn&&fn(_event);
					socket.send(_event.info);
					break;
				case Sundry.events.ROOMINFO:
					/*房间信息*/
					_roomid=(_.has(data,'room'))?_.get(data,'room'):data;
					_room=Room.getRoom(_roomid);
					_event=Sundry.createEvent(Sundry.events.ROOMINFO);
					if(_room){
						_event.setStatus(true).setDescribe(Sundry.describes.SUCCESS).assignData({
							room:_room.id,
							owner:_room.owner,
							state:_room.state,
							full:_room.isFull,
							clients:_room.clients
						});
					}else{
						_event.setStatus(false).setDescribe(Sundry.describes.UNEXIST).assignData({
							room:_roomid
						});
					}
					fn&&fn(_event);
					socket.send(_event.info);
					break;
				case Sundry.events.CREATEROOM:
					/*创建房间*/
					_room=Room.createRoom(client);
					_event=Sundry.createEvent(Sundry.events.CREATEROOM);
					if(_room){
						/*创建房间成功*/
						_event.setStatus(true).setDescribe(Sundry.describes.SUCCESS).assignData({
							room:_room.id,
							amount:Room.rooms.length
						});
						/*是否自动加入到新创建的房间*/
						if(_.get(data,'autojoin')||'autojoin'===data){
							process.nextTick(function(){
								client.join(_room.id);
							});
						}
					}else{
						/*创建房间被限制*/
						_event.setStatus(false).setDescribe(Sundry.describes.LIMITED).assignData({
							amount:Room.rooms.length
						});
					}
					fn&&fn(_event);
					socket.send(_event.info);
					break;
				case Sundry.events.JOIN:
					/*加入房间*/
					client.join((_.has(data,'room'))?_.get(data,'room'):data,fn);
					break;
				case Sundry.events.LEAVE:
					/*离开房间*/
					client.leave((_.has(data,'room'))?_.get(data,'room'):data,fn);
					break;
				case Sundry.events.LEAVEALL:
					/*离开所有房间*/
					client.leaveAll();
					break;
				case Sundry.events.ROOMSTATE:
					/*改变房间状态*/
					_event=Sundry.createEvent(Sundry.events.ROOMSTATE);
					if(_.has(data,'room')&&_.has(data,'state')){
						_roomid=_.get(data,'room');
						_room=Room.getRoom(_roomid);
						if(_room){
							_room.state=_.get(data,'state');
							_event.setStatus(true).setDescribe(Sundry.describes.SUCCESS).assignData({
								room:_room.id,
								state:_room.state
							});
						}else{
							_event.setStatus(false).setDescribe(Sundry.describes.UNEXIST).assignData({
								room:_roomid,
								err:'room not exist'
							});
						}
					}else{
						_event.setStatus(false).setDescribe(Sundry.describes.FAIL).assignData({
							err:'parameters error or miss'
						});
					}
					fn&&fn(_event);
					socket.send(_event.info);
					break;
				case Sundry.events.PUBLISH:
					/*广播消息*/
					if(_.has(data,'room')&&_.has(data,'msg')){
						_roomid=_.get(data,'room');
						_event=Sundry.createEvent(Sundry.events.PUBLISH).setStatus(true).setDescribe(Sundry.describes.PUBLISH).assignData({
							from:client.id,
							room:_roomid,
							msg:_.get(data,'msg')
						});
						if(_.isInteger(_roomid)||_.isString(_roomid)){
							socket.to(_roomid).send(_event.info);
						}
					}
					break;
			}
		});
		/*客户端创建成功*/
		socket.send(Sundry.createEvent(Sundry.events.CREATECLIENT).setStatus(true).setDescribe(Sundry.describes.SUCCESS).assignData({
			amount:Client.clients.length
		}).info);
	}else{
		/*客户端创建被限制*/
		socket.send(Sundry.createEvent(Sundry.events.CREATECLIENT).setStatus(false).setDescribe(Sundry.describes.LIMITED).assignData({
			amount:Client.clients.length
		}).info);
		/*从底层断开客户端*/
		process.nextTick(function(close){
			socket.disconnect(close);
		},true);
	}
	/*调用所有 connection 的外部侦听处理*/
	_.invokeMap(_connHandlers,'call',null,socket);
}