'use strict'

var localVideo = document.getElementById('localvideo');
var remoteVideo = document.getElementById('remoteVideo');
var btnConnectSig = document.getElementById('connectserver');
var btnLeave = document.getElementById('leave');
var consoleLog = document.getElementById('console');
var roomidInput = document.getElementById('input-roomid');

var localStream;

var roomid;

var socket;

var peerConnection;

var state = 'init';

// 将日志输出到页面
function consoleMessage(message) {
    consoleLog.value = consoleLog.value + message + '\n';
}

// 采集local音视频
function getLocalMedia() {
    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {
        console.log('not support getUserMedia');
    }
    var constants = {
        video: true,
        audio: false
    }
    navigator.mediaDevices.getUserMedia(constants)
        .then((stream) => {
            localVideo.srcObject = stream;
            localStream = stream;
        })
        .catch((err) => {
            console.log('获取音视频失败');
            alert('获取本地音视频流失败');
        });
}

// 创建PeerConnection
function createPeerConnection() {
    // step1：首先创建一个PeerConnection
    consoleMessage('create RTCPeerConnection!');
    if (!peerConnection) {
        var pcConfig = {
            'iceServers': [{
                'urls': 'turn:stu.zwboy.cn:3478',
                'credential': '123456',
                'username': 'ljc'
            }]
        }
        peerConnection = new RTCPeerConnection(pcConfig);
        // 为peerconnection设置双向的监听
        peerConnection.onicecandidate = (e) => {
            if (e.candidate) {
                // 将他发送到对方
            }
        }
        // 监听远程媒体流track，并在页面上展示
        peerConnection.ontrack = (e) => {
            console.log('ontrack');
            remoteVideo.srcObject = e.streams[0];
        }
    }
    // 将本地的媒体流添加到连接的track中
    if (localStream) {
        localStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track);
        })
    }
}


// 销毁peerconnection
function closePeerConnection() {
    if (peerConnection) {
        consoleMessage('关闭了peerConnection');
        peerConnection.close();
        peerConnection = null;
    }
}

// 关闭本地媒体采集
function closeLocalMedia() {
    if (localStream && localStream.getTracks()) {
        localStream.getTracks().forEach((track) => {
            track.stop();
        });
        localStream = null;
        consoleMessage('关闭了本地媒体流');
    }
}

getLocalMedia();    // 首次打开自动预览本地画面

btnConnectSig.onclick = (e) => {

    // step 1： 获取本地的音视频流并预览展示
    if (!localStream) {
        getLocalMedia();
    }

    // step 2：连接信令服务器
    roomid = roomidInput.value;
    socket = io.connect();              // connect sig socket service
    // 注册一些监听
    // 进入直播间成功
    socket.on('media-joined', (message, socketid) => {
        btnConnectSig.disabled = true;
        btnLeave.disabled = false;
        consoleMessage(`系统消息:${message}`);

        state = 'joined';
        consoleMessage(`state:${state}`);
        createPeerConnection();
    });
    // 第二个用户进入直播间
    socket.on('media-other-joined', (socketid) => {
        consoleMessage(`系统消息:第二个用户进入直播间，id=${socketid}`);

        if (state === 'joined_unbind') {    // 之前对方先退出了
            createPeerConnection();
        }
        state = 'joined_conn';
        consoleMessage(`state:${state}`);
        // 然后进行媒体协商

    });
    // 满员了
    socket.on('media-full', (message) => {
        consoleMessage(`系统消息:${message}`);
        alert('房间满了')
        state = 'leaved';
        consoleMessage(`state:${state}`);
        socket.disconnect();
    });
    // 离开直播间
    socket.on('media-leaved', (socketid) => {
        consoleMessage(`系统消息:离开直播间成功,id=${socketid}`);
        state = 'leaved';
        consoleMessage(`state:${state}`);
        socket.disconnect();
        btnConnectSig.disabled = false;
        btnLeave.disabled = true;
    });
    // 对方离开直播间
    socket.on('media-other-leaved', (socketid) => {
        consoleMessage(`系统消息:对方离开直播间，id=${socketid}`);
        state = 'joined_unbind';
        consoleMessage(`state:${state}`);
        closePeerConnection();
    });
    // 媒体协商message
    socket.on('media-message', (roomid, message) => {
        consoleMessage(`媒体协商消息：${roomid}, ${message}`);
        // 媒体协商消息
    });
    // send message
    socket.emit('media-join', roomid);
}

btnLeave.onclick = () => {
    if (socket) {
        socket.emit('media-leave', roomid);
    }
    btnLeave.disabled = true;
    btnConnectSig.disabled = false;
    // 销毁连接
    closePeerConnection();
    // 关闭媒体流
    closeLocalMedia();
}

