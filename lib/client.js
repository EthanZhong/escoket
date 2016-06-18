'use strict';
var _=require('lodash'),
	Room=require('./room'),
	Sundry=require('./sundry');

/* the max client amount on service at the same time (default 5000) */
var _maxClients=5000;
/* storage all the connected clients */
var _clients=[];

function Client(socket){
	this.socket=socket;
	this._rooms=[socket.id];
}
/* max clients on service getter (only write) */
Object.defineProperty(Client,'maxClients',{
	set:function(max){
		max=(max>0)?max:0;
		_maxClients=_.parseInt(max);
	}
});
/* determine the client amount is more than limit */
Object.defineProperty(Client,'isFull',{
	get:function(){
		return _clients.length>=_maxClients;
	}
});
/**
 * [creat client]
 * @param  {[Socket]} socket 			[description]
 * @return {[Client|undefined]}        	[If meet the conditions return the created client else undefined]
 */
Client.createClient=function(socket){
	var client;
	if(_clients.length<_maxClients){
		client=new Client(socket);
		_clients.push(client);
	}
	return client;
}
/* get the client's id same as socket'id */
Object.defineProperty(Client.prototype,'id',{
	get:function(){
		return this.socket.id;
	}
});
/* get the client's rooms that has joined */
Object.defineProperty(Client.prototype,'rooms',{
	get:function(){
		if(this.socket.rooms.length>0){
			this._rooms=_.clone(this.socket.rooms);
		}
		return this._rooms;
	}
});
Client.prototype.join=function(roomid,fn){
	if(roomid==this.id){
		/* the socket is automatically a member of a room identified with its session id */

		_.isFunction(fn)&&fn();
	}else{
		var room=Room.getRoomById(roomid);
		if(_.isUndefined(room)){
			/* room not exist */

		}else{

		}
	}
	return this;
}