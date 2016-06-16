'use strict';

var Room=require('./lib/room');
var Client=require('./lib/client');

Room.maxRooms=500;
Room.maxClients=4;
Room.timeOut=1000;

var room=Room.createRoom('ethan');
room.addClient('ethan')
room.addClient('2')
room.addClient('3')

//_.range(4);
//_.padStart(55555,4,'0');
//_.times(5,_.constant(false));