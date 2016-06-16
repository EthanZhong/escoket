'use strict';
/* require all dependencies module */
var _=require('lodash');
/* the max room amount on service at the same time (default 500) */
var _maxRooms=500;
/* the max client amount in one room (default 10) */
var _maxClients=10;
/* the new room be allowed free time (millisecond) */
var _timeOut=60000;
/* the alive rooms */
var _aliveRooms=[];
/* have destroyed rooms */
var _destroyedRooms=[];
/**
 * [Room Class]
 * @param {[int]} roomid  [the room id]
 * @param {[int]} ownerid [the owner id]
 */
function Room(roomid,ownerid){
	/* the room id */
	this.id=roomid;
	/* set other properties*/
	this.reset(ownerid);
}
/* max rooms getter (only write) */
Object.defineProperty(Room,'maxRooms',{
	set:function(max){
		max=(max>0)?max:0;
		_maxRooms=_.parseInt(max);
	}
});
/* max clients in room getter (only write) */
Object.defineProperty(Room,'maxClients',{
	set:function(max){
		max=(max>0)?max:0;
		_maxClients=_.parseInt(max);
	}
});
/* timeout getter (only write) */
Object.defineProperty(Room,'timeOut',{
	set:function(val){
		val=(val>0)?val:0;
		_timeOut=_.parseInt(val);
	}
});
/* determine the room amount is more than limit */
Object.defineProperty(Room,'isFull',{
	get:function(){
		return _aliveRooms.length>=_maxRooms;
	}
});
/**
 * [get the alive room by id]
 * @param  {[int]} 				id 	[the room id]
 * @return {[Room|undefined]}    	[return the matched room else undefined]
 */
Room.getRoomById=function(id){
	return _.find(_aliveRooms,['id',id]);
}
/**
 * [create a new room]
 * @param  {[int]} 			ownerid 		[the clinet'id that who create this room]
 * @return {[Room|undefined}]}         		[If meet the conditions return the created room else undefined]
 */
Room.createRoom=function(ownerid){
	var _room,_sortIndex;
	if(_aliveRooms.length<_maxRooms){
		if(_.size(_destroyedRooms)){
			_room=_destroyedRooms.shift().reset(ownerid);
		}else if(_.size(_aliveRooms)){
			_room=new Room(_.last(_aliveRooms).id+1,ownerid);
		}else{
			_room=new Room(1,ownerid);
		}
		_sortIndex=_.sortedIndexBy(_aliveRooms,_room,'id');
		_aliveRooms.splice(_sortIndex,0,_room);
	}
	return _room;
}
/* determine the client amount is more than limit */
Object.defineProperty(Room.prototype,'isFull',{
	get:function(){
		return this.clients.length>=_maxClients;
	}
});
/**
 * [set or reset the room properties]
 * @param  {[String]} 	ownerid 	[the room owner id]
 * @return {[Room]}         		[room]
 */
Room.prototype.reset=function(ownerid){
	/* the owner id */
	this.ownerid=ownerid;
	/* sign the room status */
	this.state=0;
	/* storage all the ids in the room */
	this.clients=[];
	/* room create time */
	this._createTime=_.now();
	/* destroy self*/
	this._timerid=_.delay(_.bind(this.destroy,this),_timeOut);
	/*return self*/
	return this;
}
/**
 * [add client to room]
 * @param {[String]} 	clientid 	[the client id]
 * @return {[int]} 					[return the index]
 */
Room.prototype.addClient=function(clientid){
	if(!_.isUndefined(this._timerid)){
		clearTimeout(this._timerid);
		delete this._timerid;
	}
	if(!_.includes(this.clients,clientid)){
		this.clients.push(clientid);
	}
	return _.indexOf(this.clients, clientid);
}
/**
 * [remove client from room]
 * @param  {[String]} clientid 	[the client id]
 * @return {[int]}             	[if the room include client return the index else -1]
 */
Room.prototype.removeClient=function(clientid) {
	var _index=_.indexOf(this.clients, clientid);
	_.pull(this.clients,clientid);
	if(_.size(this.clients)===0){
		/*if there is no one in the room ,destroy the room */
		this.destroy();
	}
	return _index;
}
/**
 * [destroy room ,remove it from the alive rooms and move it to destroyed rooms]
 */
Room.prototype.destroy=function(){
	if(_.size(this.clients)===0){
		_.pull(_aliveRooms,this);
		if(!_.includes(_destroyedRooms,this)){
			_destroyedRooms.push(this);
		}
	}
}
/* Module exports */
module.exports=Room;