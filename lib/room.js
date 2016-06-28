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
 * @param {[int]} 			id  	[房间id]
 * @param {[client|int]} 	client 	[申请创建该房间的 客户端 or 客户端id]
 */
function Room(id,client){
	this.id=_.parseInt(id);
	this._reset(client);
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
/* 获取当前活跃的房间列表 */
Object.defineProperty(Room,'rooms',{
	get:function(){
		return _aliveRooms;
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
	return _.find(_aliveRooms,['id',_.parseInt(id)]);
}
/**
 * [创建房间]
 * @param  {[client|String]} 			client 		[申请创建该房间的 客户端 or 客户端id]
 * @return {[Room|null}]}         					[如果满足创建条件返回创建出来的房间 否则返回 null]
 */
Room.createRoom=function(client){
	var _room=null;
	/*房间数量达到限制 尝试一次清理动作*/
	if(this.isFull){
		var _now=_.now();
		_.forEachRight(_aliveRooms,function(item,index){
			if(!_.size(item.clients)&&(_now-item._createTime)>_timeOut){
				item._destroy();
			}
		});
	}
	/*房间数量未超限 创建房间*/
	if(!this.isFull){
		var _sortIndex;
		var _id=(_.has(client,'id'))?client['id']:client;
		if(_.size(_destroyedRooms)){
			_room=_destroyedRooms.shift()._reset(_id);
		}else if(_.size(_aliveRooms)){
			_room=new Room(_.last(_aliveRooms).id+1,_id);
		}else{
			_room=new Room(1,_id);
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
 * @param {[client|String]} 	client 	[申请创建该房间的 客户端 or 客户端id]
 * @return {[Room]}         			[返回该房间]
 */
Room.prototype._reset=function(client){
	/* 房主 */
	this.owner=(_.has(client,'id'))?client['id']:client;
	/* 房间状态  只有当 (!room.isFull&&room.state==0) 时房间才允许客户端加入 */
	this.state=0;
	/* 所有在该房间中的客户端id */
	this.clients=[];
	/* 房间被激活的时间 */
	this._createTime=_.now();
	/* 启动延迟自毁 */
	this._timerid=_.delay(_.bind(this._destroy,this),_timeOut);

	return this;
}
/**
 * [房间自毁 如果房间内还有客户端 则终止自毁行为]
 * @return {[Room]} [返回房间本身]
 */
Room.prototype._destroy=function(){
	if(!_.size(this.clients)){
		_.pull(_aliveRooms,this);
		_destroyedRooms.push(this);
	}
	return this;
}
/**
 * [添加客户端到房间]
 * @param {[client|String]} 	client 		[客户端 或 客户端的id]
 * @return {[int]} 							[返回该客户端在房间内的位置索引]
 */
Room.prototype.addClient=function(client){
	if(!_.isUndefined(this._timerid)){
		clearTimeout(this._timerid);
		delete this._timerid;
	}

	var _id=(_.has(client,'id'))?client['id']:client;
	if(!_.includes(this.clients,_id)){
		this.clients.push(_id);
	}
	return _.indexOf(this.clients, _id);
}
/**
 * [从房间中删除客户端]
 * @param  {[client|String]} client 	[客户端 或 客户端的id]
 * @return {[int]}             			[返回该客户端被删除前在房间内的位置索引 如果该客户端不存在房间里 返回-1]
 */
Room.prototype.removeClient=function(client) {
	var _id=(_.has(client,'id'))?client['id']:client;
	var _index=_.indexOf(this.clients,_id);
	_.pull(this.clients,_id);
	if(_.size(this.clients)===0){
		/* 如果此时房间内没有客户端存在 则房间自毁 */
		this._destroy();
	}
	return _index;
}
/* 模块输出 */
module.exports=Room;