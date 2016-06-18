'use strict';
var _=require('lodash');
/**/
exports.events={
	ROOMEVENT:'roomevent'
};
/* describes collection */
exports.describes={
	SELFROOM:'selfroom'
};
/* add new items to events  collection*/
exports.addEvents=_.wrap(exports.events,add);
/* add new items to describes  collection*/
exports.addDescribes=_.wrap(exports.describes,add);
/**
 * [add new items to target]
 * @param {[Object]} target [the target collection]
 * @param {[Object]} data   [the new items eg:{SOMENEW1:'sometype1',SOMENEW2:'sometype2',...}]
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