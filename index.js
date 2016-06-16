'use strict';

var Room=require('./lib/room');
var Client=require('./lib/client');

Room.maxRooms=500;
Room.maxClients=4;

Room.createRoom('ethan');