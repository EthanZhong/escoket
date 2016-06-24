'use strict';
var Service=require('socket.io');
var Room=require('./room');
var Client=require('./client');

Room.maxRooms=500;
Room.maxClients=4;
Room.timeOut=1000;


//_.range(4);
//_.padStart(55555,4,'0');
//_.times(5,_.constant(false));

var io=Service(5555);
io.on('connection',function(socket){
	var clien=Client.createClient(socket);
	setTimeout(function(){
		io.to(socket.id).send({id:socket.id});
	},500)
	socket.on('disconnect',function(){
		//console.log(socket.rooms)
	});
});