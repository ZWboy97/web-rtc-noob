'use strict'

var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require('express');
var serveIndex = require('serve-index');

var socketIO = require('socket.io');

var log4js = require('log4js');

var app = express();
app.use(serveIndex('.'));
app.use(express.static('.'));

log4js.configure({
	appenders: {
		file: {
			type: 'file',
			filename: 'app.log',
			layout: {
				type: 'pattern',
				pattern: '%r %p - %m',
			}
		}
	},
	categories: {
		default: {
			appenders: ['file'],
			level: 'debug'
		}
	}
});
var logger = log4js.getLogger();



// http server
var http_server = http.createServer(app);
http_server.listen(80, '0.0.0.0');

// https server
var options = {
	key: fs.readFileSync('./cert/stu.zwboy.cn.key'),
	cert: fs.readFileSync('./cert/stu.zwboy.cn.pem')
}
var https_server = https.createServer(options, app);
var io = socketIO.listen(https_server);
io.sockets.on('connection', (socket) => {
	socket.on('join', (room) => {
		socket.join(room);
		var myRoom = io.sockets.adapter.rooms[room];
		var userNumber = Object.keys(myRoom.sockets).length;
		logger.log(`new user join room,room=${room},room size = ${userNumber}, user id = ${socket.id}`);
		socket.emit('joined', room, socket.id, userNumber);	// 回复本用户
		// socket.to(room).emit('joined', room, socket.id);	// 给除自己以外的房间所有用户发消息
		// io.in(room).emit('joined', room, socket.id);		// 给所有房间中的人发送消息，包括自己
		// socket.broadcast.emit('joined', room, socket.id);	// 给全站广播消息
	})
})
io.sockets.on('leave', (socket) => {
	socket.on('leave', (room) => {
		socket.join(room);
		var myRoom = io.sockets.adapter.rooms[room];
		var userNumber = Object.keys(myRoom.sockets).length;
		logger.log(`user left room,room=${room},room size = ${userNumber}, user id = ${socket.id}`);
		socket.emit('left', room, socket.id, userNumber);	// 回复本用户
		// socket.to(room).emit('left', room, socket.id);	// 给除自己以外的房间所有用户发消息
		// io.in(room).emit('left', room, socket.id);		// 给所有房间中的人发送消息，包括自己
		// socket.broadcast.emit('left', room, socket.id);	// 给全站广播消息
	})
})
https_server.listen(443, '0.0.0.0');
logger.log('server start');

