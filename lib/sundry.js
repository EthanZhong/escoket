'use strict';
var _=require('lodash');
/* 事件类型集合 */
exports.events={
	ROOMINFO:'roominfo',
	CLIENTINFO:'clientinfo',
	PUBLISH:'publish',
	DISCONNECT:'disconnect',
	CREATECLIENT:'createclient',
	CREATEROOM:'createroom',
	JOIN:'join',
	LEAVE:'leave',
	LEAVEALL:'leaveall',
	ROOMSTATE:'roomstate'
};
/* 事件描述集合 */
exports.describes={
	PUBLISH:'publish',
	SUCCESS:'success',
	FAIL:'fail',
	UNEXIST:'unexist',
	FULL:'full',
	STATEFAIL:'statefail',
	LIMITED:'limited'
};
/**
 * [创建一个事件实例]
 * @param  {[String]} type 	[事件类型名称]
 * @return {[Event]}      	[返回事件实例]
 */
exports.createEvent=function(type){
	return new Event(type);
}
/* 往 exports.events 中添加新的事件类型 */
exports.addEvents=_.wrap(exports.events,add);
/* 往 exports.describes 中添加新的事件描述 */
exports.addDescribes=_.wrap(exports.describes,add);
/**
 * [往对象中添加不存在的新属性]
 * @param {[Object]} target [操作对象]
 * @param {[Object]} data   [需要被添加的新数据 eg:{SOMENEW1:'sometype1',SOMENEW2:'sometype2',...}]
 * @return Module.exports
 */
function add(target,data){
	_.forIn(data,function(value,key){
		if(!_.has(target,key)){
			target[key]=value;
		}
	});
	return exports;
}
/**
 * [Event Class]
 * @param {[String]} type [事件类型名称]
 */
function Event(type){
	this.type=type;
	this.status=false;
	this.describe=null;
	this.data={};
}
/*获取字符串形式的事件数据*/
Object.defineProperty(Event.prototype,'info',{
	get:function(){
		return JSON.stringify({
			type:this.type,
			status:this.status,
			describe:this.describe,
			data:this.data
		});
	}
});
/**
 * [设置 this.status 值]
 * @param {[Boolean]} status [status 值]
 * @return {[Event]}      	[事件实例本身]
 */
Event.prototype.setStatus=function(status){
	this.status=status;
	return this;
}
/**
 * [设置 this.describe 值]
 * @param {[String]} describe 	[describe 值]
 * @return {[Event]}      		[事件实例本身]
 */
Event.prototype.setDescribe=function(describe){
	this.describe=describe;
	return this;
}
/**
 * [删除 this.data 某个属性]
 * @param {[String]} 	key 	[要删除的属性 key]
 * @return {[Event]}      		[事件实例本身]
 */
Event.prototype.deleteData=function(key){
	delete this.data[key];
	return this;
}
/**
 * [对 this.data 进行覆盖或者扩展新的数据]
 * @param  {[Object]} data 	[新的数据]
 * @return {[Event]}      	[事件实例本身]
 */
Event.prototype.assignData=function(data){
	_.assign(this.data,data);
	return this;
}