'use strict';
var Servic=require('socket.io');
var Room=require('./lib/room');
var Client=require('./lib/client');

// Room.maxRooms=500;
// Room.maxClients=4;
// Room.timeOut=1000;

/*var client=Client.createClient({id:'ethan'});
client.join('ethan');*/

//_.range(4);
//_.padStart(55555,4,'0');
//_.times(5,_.constant(false));

var io=Servic(5555);
io.on('connection',function(socket){
	console.log('someone coming');
});