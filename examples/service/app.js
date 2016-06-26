'use strict';

var es=require('esocket');

/*最大在线客户端数*/
es.maxclients=2000;
/*最大活跃房间数*/
es.maxrooms=500;
/*每个房间允许加入最大客户端数*/
es.roomclients=4;
/*新创建的房间 多久没有客户端加入自毁 (单位毫秒)*/
es.roomtimeout=6000;
/*启动服务器*/
es.server(5555);