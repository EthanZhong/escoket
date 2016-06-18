'use strict';
var _=require('lodash');
/* 事件类型集合 */
exports.events={
	ROOMEVENT:'roomevent'
};
/* 事件描述集合 */
exports.describes={
	SELFROOM:'selfroom'
};
/**
 * [创建一个事件实例]
 * @param  {[String]} type 	[事件类型名称]
 * @return {[Event]}      	[返回事件实例]
 */
exports.createEvent=function(type){
	return new Event(type);
}
/* 往 exports.events 中添加新的属性 */
exports.addEvents=_.wrap(exports.events,add);
/* 往 exports.describes 中添加新的属性 */
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
	this.status=true;
	this.describe=null;
	this.data={};
}
/**
 * [覆盖或者扩展新的数据]
 * @param  {[Object]} data 	[新的数据]
 * @return {[Event]}      	[事件实例本身]
 */
Event.prototype.assignData=function(data){
	_.assign(this.data,data);
	return this;
}
/**
 * [事件信息执行 JSON.stringify]
 * @return {[String]} 	[事件信息字符串]
 */
Event.prototype.stringify=function(){
	return JSON.stringify(_.assign({},this));
}