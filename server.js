'use strict'

var http = require('http');
var https = require('https');
var fs = require('fs');		// node的文件操作
var express = require('express');	// nodejs的一个后端框架
var serveIndex = require('serve-index');	// 对特定的目录作为web服务器的根目录

var socketIO = require('socket.io');	// socket服务器

var log4js = require('log4js');			// 日志

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
// 监听客户端socket连接
io.sockets.on('connection', (socket) => {
	console.log(`new connection,socket.id=${socket.id}`)
	// ++++++++++++++++++++++聊天直播间socket服务+++++++++++++++++++++
	// 聊天直播间用户加入
	socket.on('join', (user, room) => {
		socket.join(room);
		var myRoom = io.sockets.adapter.rooms[room];
		var userNumber = Object.keys(myRoom.sockets).length;
		console.log(`new user join,join room ${room},room size=${userNumber}, user id = ${socket.id}`);
		socket.emit('joined', room, userNumber, `连接成功`);	// 回复本用户
		socket.to(room).emit('system', room, `用户${user}进入直播间`);	// 给除自己以外的房间所有用户发消息
	});
	// 聊天直播间用户发送消息
	socket.on('message', (user, room, data) => {
		console.log(`message receive,user=${user}, room=${room},data=${data}`);
		socket.emit('message', user, room, data);	// 回复本用户
		socket.to(room).emit('message', user, room, data);	// 给除自己以外的房间所有用户发消息
	});
	// 聊天直播间用户离开
	socket.on('leave', (user, room, data) => {
		console.log(`user leave, user=${user},room=${room},data=${data}`);
		socket.leave(room);
		socket.emit('leaved', user, room, `退出直播间成功`);	// 回复本用户
		socket.to(room).emit('system', room, `用户${user}退出直播间`);	// 给除自己以外的房间所有用户发消息
	});
	// +++++++++++++++++++++ web-rtc音视频信令服务 +++++++++++++++++++++
	// 加入直播间
	socket.on('media-join', (roomid) => {
		console.log(`media-join:roomid=${roomid}`);
		socket.join(roomid);
		var liveRoom = io.sockets.adapter.rooms[roomid];
		var clientCount = Object.keys(liveRoom.sockets).length;
		if (clientCount === 1) {	// 第一个用户
			socket.emit('media-joined', `连接成功,第一个用户`, socket.id);
		} else if (clientCount === 2) {
			socket.emit('media-joined', `连接成功，第二个用户`, socket.id);
			socket.to(roomid).emit('media-other-joined', socket.id);	// 告诉另一个人
		} else {
			socket.leave(roomid);	// 从直播间踢出（socket连接还不断）
			socket.emit('media-full', `满员了`);
		}
	});
	socket.on('media-leave', (roomid) => {
		console.log(`media-leave: roomid=${roomid}`);
		socket.emit('media-leaved', socket.id);
		socket.to(roomid).emit('media-other-leaved', socket.id);
		socket.leave(roomid);
	});
	socket.on('media-message', (roomid, message) => {
		socket.to(roomid).emit('media-message', message);
	});


});
// socket连接断开处理
io.sockets.on('leave', (socket) => {
	console.log(`socket leave! socketid=${socket.id}`);
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

