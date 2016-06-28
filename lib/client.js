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
	this.id=socket.id;
	this._rooms=[socket.id];
	/*侦听 socket 连接断开 销毁客户端*/
	socket.once('disconnect',_.bind(this.destroy,this));
}
/* _maxClients getter (only write) */
Object.defineProperty(Client,'maxClients',{
	set:function(max){
		max=(max>0)?max:0;
		_maxClients=_.parseInt(max);
	}
});
/* 获取当前服务器客户端列表 (only read) */
Object.defineProperty(Client,'clients',{
	get:function(){
		return _clients;
	}
});
/* 判断在线客户端数量是否超过限制 (only read) */
Object.defineProperty(Client,'isFull',{
	get:function(){
		return _clients.length>=_maxClients;
	}
});
/**
 * [根据 id 获取客户端]
 * @param  {[String]} 			id [客户端 id]
 * @return {[Client|undefined]}    [如果匹配到 id 则返回客户端 否则返回 undefined]
 */
Client.getClient=function(id){
	return _.find(_clients,['id',id]);
}
/**
 * [创建客户端]
 * @param  {[Socket]} socket 	[需要被管理的 socket]
 * @return {[Client|null]}      [如果满足条件返回一个新的客户端实例 否则返回 null]
 */
Client.createClient=function(socket){
	return (!this.isFull)?_.chain(_clients).push(new Client(socket)).last().value():null;
}
/* 获取该客户端连接状态 */
Object.defineProperty(Client.prototype,'connected',{
	get:function(){
		return this.socket.connected;
	}
});
/* 获取该客户端已经加入的房间列表 */
Object.defineProperty(Client.prototype,'rooms',{
	get:function(){
		if(!_.isEmpty(this.socket.rooms)){
			this._rooms=_.chain(this.socket.rooms).keys().map(_.bind(function(room){
				return (room!==this.id)?_.parseInt(room):room;
			},this)).value();
		}
		return this._rooms;
	}
});
/**
 * [加入房间] (The socket is automatically a member of a room identified with its session id) 
 * @param  {[int|String]}   room 		[申请加入的房间 id]
 * @param  {Function} 	fn     	[成功或失败回调处理]
 * @return {[Client]}          	[返回客户端自身]
 */	
Client.prototype.join=function(room,fn){
	var _self=this,
		_room=Room.getRoom(room),
		_event=Sundry.createEvent(Sundry.events.JOIN).assignData({room:room,from:_self.id});

	if(_room){
		/*房间存在*/
		room=_.parseInt(room);
		_event.assignData({room:room});

		if(_room.isFull){
			/*房间已经满员*/
			_event.setStatus(false).setDescribe(Sundry.describes.FULL);
			fn&&fn(_event);
			_self.socket.send(_event.info);
		}else if(_room.state!==0){
			/*房间状态不允许加入*/
			_event.setStatus(false).setDescribe(Sundry.describes.STATEFAIL).assignData({state:_room.state});
			fn&&fn(_event);
			_self.socket.send(_event.info);
		}else{
			/*执行加入房间动作*/
			_self.socket.join(room,function(err){
				if(err){
					/*加入房间失败*/
					_event.setStatus(false).setDescribe(Sundry.describes.FAIL);
					fn&&fn(_event);
					_self.socket.send(_event.info);
				}else{
					/*加入房间成功*/
					_.chain(_self._rooms).pull(room).push(room).value();
					_event.setStatus(true).setDescribe(Sundry.describes.SUCCESS).assignData({
						owner:_room.owner,
						index:_room.addClient(_self),
						clients:_room.clients
					});
					fn&&fn(_event);
					_self.socket.nsp.to(room).send(_event.info);
				}
			});
		}
	}else{
		/*房间不存在*/
		_event.setStatus(false).setDescribe(Sundry.describes.UNEXIST);
		fn&&fn(_event);
		_self.socket.send(_event.info);
	}
	return _self;
}
/**
 * [离开房间]
 * @param  {[int|String]}   room 	[申请离开的房间 id]
 * @param  {Function} 	fn     	[成功或失败回调处理]
 * @return {[Client]}          	[返回客户端自身]
 */
Client.prototype.leave=function(room,fn){
	var _self=this,
		_room=Room.getRoom(room),
		_event=Sundry.createEvent(Sundry.events.LEAVE).assignData({room:room,from:_self.id});

	if(_room){
		/*房间存在*/
		room=_.parseInt(room);
		_event.assignData({room:room});

		/*执行离开房间动作*/
		_self.socket.leave(room,function(err){
			if(err){
				/*离开房间失败*/
				_event.setStatus(false).setDescribe(Sundry.describes.FAIL).assignData({err:err});
				fn&&fn(_event);
				_self.socket.send(_event.info);
			}else{
				/*尝试从自己的已加入房间列表中删除该房间*/
				_.pull(_self._rooms,room);
				_event.setStatus(true).setDescribe(Sundry.describes.SUCCESS).assignData({
					owner:_room.owner,
					index:_room.removeClient(_self),
					clients:_room.clients
				});
				fn&&fn(_event);
				_self.socket.send(_event.info).to(room).send(_event.info);
			}
		});
	}else{
		/*房间不存在*/
		_event.setStatus(false).setDescribe(Sundry.describes.UNEXIST);
		fn&&fn(_event);
		_self.socket.send(_event.info);
	}
	return _self;
}
/**
 * [离开所有房间 （保留自己的私人房间）]
 * @return {[Client]} 	[返回客户端自身]
 */
Client.prototype.leaveAll=function(){
	var _self=this;

	if(_self.connected){
		/*当客户端还在连接中 离开所有的房间（除了自己的私人房间）*/
		_.chain(_self.rooms).clone().pull(_self.id).forEach(function(room){
			_self.leave(room);
		}).value();
	}else{
		/*当客户端已断开 通知所有房间中的所有成员 客户端断开 (Rooms are left automatically upon disconnection) */
		var _event=Sundry.createEvent(Sundry.events.DISCONNECT).setStatus(true).setDescribe(Sundry.describes.SUCCESS).assignData({
			from:_self.id
		});
		_.chain(_self.rooms).remove(function(room){
			return room!==_self.id;
		}).forEach(function(room){
			var _room=Room.getRoom(room);
			if(_room){
				_event.assignData({
					room:_room.id,
					owner:_room.owner,
					index:_room.removeClient(_self),
					clients:_room.clients
				});
			}else{
				_event.assignData({room:room});
			}
			/*通知房间里所有成员*/
			_self.socket.nsp.to(room).send(_event.info);
		}).value();
	}
	return _self;
}
/**
 * [断开连接]
 * @param  {[Boolean]} close 	[是否从底层断开连接]
 * @return {[Client]}       	[返回客户端自身]
 */
Client.prototype.disconnect=function(close){
	this.socket.disconnect(close);
	return this;
}
/**
 * [客户端销毁]
 * @return {[Client]} [返回客户端自身]
 */
Client.prototype.destroy=function(){
	if(this.connected){
		this.disconnect();
	}else{
		_.pull(_clients,this);
		this.leaveAll();
	}
	return this;
}
/* 模块输出 */
module.exports=Client;