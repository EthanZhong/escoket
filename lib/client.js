'use strict';
var _=require('lodash'),
	Room=require('./room'),
	Sundry=require('./sundry');

/* 服务器允许最大在线客户端数量 (默认值 5000) */
var _maxClients=5000;
/* 所有在线客户端列表 */
var _clients=[];
/**
 * [客户端类]
 * @param {[Socket]} socket [被管理的 socket （为每一个新接入的 socket 创建一个客户端用来管理）]
 */
function Client(socket){
	this.socket=socket;
	this._rooms=[socket.id];
}
/* _maxClients getter (only write) */
Object.defineProperty(Client,'maxClients',{
	set:function(max){
		max=(max>0)?max:0;
		_maxClients=_.parseInt(max);
	}
});
/* 判断在线客户端数量是否超过限制 */
Object.defineProperty(Client,'isFull',{
	get:function(){
		return _clients.length>=_maxClients;
	}
});
/**
 * [创建客户端]
 * @param  {[Socket]} socket 			[被管理的 socket]
 * @return {[Client|undefined]}        	[如果满足条件返回一个新的客户端实例 否则返回 undefined]
 */
Client.createClient=function(socket){
	var client;
	if(_clients.length<_maxClients){
		client=new Client(socket);
		_clients.push(client);
	}
	return client;
}
/* 获取客户端的 ID （和被管理的 socket.id 相同） */
Object.defineProperty(Client.prototype,'id',{
	get:function(){
		return this.socket.id;
	}
});
/* 获取该客户端已经加入的房间列表 */
Object.defineProperty(Client.prototype,'rooms',{
	get:function(){
		if(_.size(this.socket.rooms)){
			this._rooms=_.clone(this.socket.rooms);
		}
		return this._rooms;
	}
});
/**
 * [加入房间]
 * @param  {[String]}   roomid 	[房间 ID]
 * @param  {Function} 	fn     	[成功或失败回调处理]
 * @return {[Client]}          	[返回客户端自身]
 */	
Client.prototype.join=function(roomid,fn){
	var _event=Sundry.createEvent(Sundry.events.ROOMEVENT).assignData({
		roomid:roomid,
		fromid:this.id
	});
	if(roomid==this.id){
		/* socket 已经自动加入了该房间 (The socket is automatically a member of a room identified with its session id)  */
		_event.describe=Sundry.describes.SELFROOM;
		_event.assignData({
			test:'test'
		});
		_.isFunction(fn)&&fn();
	}else{
		var room=Room.createRoom(roomid);
		if(_.isUndefined(room)){
			/* room not exist */

		}else{

		}
	}
	return this;
}
/* 模块输出 */
module.exports=Client;