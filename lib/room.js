'use strict';
var _=require('lodash');
/* 服务器允许最大在线房间数量 系统默认以客户端ID创建的房间不在计数范围 (默认值 500) */
var _maxRooms=500;
/* 每个房间内允许容纳最大的客户端数量 (默认值 10) */
var _maxClients=10;
/* 每个被新建或刚被重置的房间 将启动延迟自毁（延迟时间：_timeOut ，单位：毫秒） 一旦有客户端加入到该房间 则停止延迟自毁 （当房间内所有的客户端都离开了该房间，该房间将立刻自毁）*/
var _timeOut=60000;
/* 所有活跃的房间列表 */
var _aliveRooms=[];
/* 所有已自毁的房间列表 作为对象池存储它们 一旦有创建房间的申请 则有机会把它们重置后当新的活跃房间使用 */
var _destroyedRooms=[];
/**
 * [房间类]
 * @param {[int]} roomid  [房间的 ID]
 * @param {[int]} ownerid [申请创建该房间的客户端 ID 该客户端将是这个房间的房主]
 */
function Room(roomid,ownerid){
	/* 房间的 ID */
	this.id=roomid;
	/* 设置房间的其它属性 */
	this.reset(ownerid);
}
/* _maxRooms getter (only write) */
Object.defineProperty(Room,'maxRooms',{
	set:function(max){
		max=(max>0)?max:0;
		_maxRooms=_.parseInt(max);
	}
});
/* _maxClients getter (only write) */
Object.defineProperty(Room,'maxClients',{
	set:function(max){
		max=(max>0)?max:0;
		_maxClients=_.parseInt(max);
	}
});
/* _timeOut getter (only write) */
Object.defineProperty(Room,'timeOut',{
	set:function(val){
		val=(val>0)?val:0;
		_timeOut=_.parseInt(val);
	}
});
/* 判断当前服务器上活跃的房间总数是否超过限制 */
Object.defineProperty(Room,'isFull',{
	get:function(){
		return _aliveRooms.length>=_maxRooms;
	}
});
/**
 * [根据房间 ID 获取活跃的房间]
 * @param  {[int]} 				id 	[房间 ID]
 * @return {[Room|undefined]}    	[返回获取到的房间 否则返回 undefined]
 */
Room.getRoom=function(id){
	return _.find(_aliveRooms,['id',id]);
}
/**
 * [创建房间]
 * @param  {[int]} 			ownerid 		[申请创建房间的客户端 ID]
 * @return {[Room|undefined}]}         		[如果满足创建条件返回创建出来的房间 否则返回 undefined]
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
/* 判定该房间内客户端数量是否达到限制 */
Object.defineProperty(Room.prototype,'isFull',{
	get:function(){
		return this.clients.length>=_maxClients;
	}
});
/**
 * [设置或重置房间属性]
 * @param  {[String]} 	ownerid 	[申请创建房间的客户端 ID]
 * @return {[Room]}         		[返回该房间]
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
 * [添加客户端到房间]
 * @param {[String]} 	clientid 	[被添加的客户端 ID]
 * @return {[int]} 					[放回该客户端在房间内的位置索引]
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
 * [从房间中删除客户端]
 * @param  {[String]} clientid 	[被删除的客户端 ID]
 * @return {[int]}             	[返回该客户端本应在房间的位置索引 如果该客户端不存在房间里 返回-1]
 */
Room.prototype.removeClient=function(clientid) {
	var _index=_.indexOf(this.clients, clientid);
	_.pull(this.clients,clientid);
	if(_.size(this.clients)===0){
		/* 如果此时房间内没有客户端存在 则房间自毁 */
		this.destroy();
	}
	return _index;
}
/**
 * [房间自毁 如果房间内还有客户端 则终止自毁行为]
 * @return {[Room]} [返回房间本身]
 */
Room.prototype.destroy=function(){
	if(_.size(this.clients)===0){
		_.pull(_aliveRooms,this);
		if(!_.includes(_destroyedRooms,this)){
			_destroyedRooms.push(this);
		}
	}
	return this;
}
/* 模块输出 */
module.exports=Room;