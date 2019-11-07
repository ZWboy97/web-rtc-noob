'use strict'

var userName = document.getElementById('username');
var roomID = document.getElementById('room');
var connectBtn = document.getElementById('connect-btn');
var messageOutput = document.getElementById('message-output');
var messageInput = document.getElementById('message-input');
var sendBtn = document.getElementById('send');
var disconnectBtn = document.getElementById('disconnect-btn');

var socket;
var room;
var user;

connectBtn.onclick = () => {
    room = roomID.value;
    user = userName.value;
    // connect
    socket = io.connect();
    // receive message
    socket.on('joined', (room, size) => {
        connectBtn.disabled = true;
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageOutput.value = messageOutput.value
            + `系统消息：加入房间${room}成功，当前在线${size}人\r`;
    });
    socket.on('leaved', (user, room, data) => {
        connectBtn.disabled = false;
        messageInput.disabled = true;
        sendBtn.disabled = true;
        messageOutput.value = messageOutput.value
            + `系统消息：退出房间${room}成功\r`;

    });
    socket.on('message', (user, room, data) => {
        messageOutput.value = messageOutput.value + `来自room${room}的${user}:${data}\r`;
    });
    socket.on('system', (room, data) => {
        messageOutput.value = messageOutput.value + `来自room${room}的系统消息:${data}\r`;
    });
    // send
    socket.emit('join', user, room);
}

sendBtn.onclick = () => {
    room = roomID.value;
    user = userName.value;
    var data = messageInput.value;
    socket.emit('message', user, room, data);
    messageInput.value = "";
}

disconnectBtn.onclick = () => {
    room = roomID.value;
    user = userName.value;
    socket.emit('leave', user, room, "");
}