'use strict'

import LocalMediaHandler from './localMeidaHandler.js';
import PeerConnectHander from './peerConnectHandler.js';

var localVideo = document.getElementById('localvideo');
var remoteVideo = document.getElementById('remotevideo');
var btnConnectSig = document.getElementById('connectserver');
var btnLeave = document.getElementById('leave');
var consoleLog = document.getElementById('console');
var roomidInput = document.getElementById('input-roomid');

var localStream;
var roomid;

var localMediaHandler = new LocalMediaHandler();
var peerConnectHandler = new PeerConnectHander();

// 将日志输出到页面
function consoleMessage(message) {
    consoleLog.value = consoleLog.value + message + '\n';
}

// 采集本地摄像头音视频
function getLocalMedia() {
    return new Promise((resolve, reject) => {
        localMediaHandler.getLocalMedia()
            .then((stream) => {
                localVideo.srcObject = stream;
                localStream = stream;
                resolve();
            })
            .catch((err) => {
                console.log('获取音视频失败');
                alert('获取本地音视频流失败');
                reject();
            });
    })

}

// 关闭本地摄像头媒体采集
function closeLocalMedia() {
    localMediaHandler.closeLocalMedia()
        .then(() => {
            consoleMessage('关闭了本地媒体流');
            localStream = null;
        });
}

function startP2PConnection() {
    roomid = roomidInput.value;
    peerConnectHandler.onMediaJoined = (message, socketid) => {
        btnConnectSig.disabled = true;
        btnLeave.disabled = false;
        consoleMessage(`系统消息:${message}`);
    }
    peerConnectHandler.onMediaOtherJoined = (socketid) => {
        consoleMessage('第二个用户加入直播间');
    }
    peerConnectHandler.onMediaFull = (message) => {
        consoleMessage(`房间人数已满，稍后加入，message=${message}`);
        alert('房间人数已满');
    }
    peerConnectHandler.onMediaLeaved = (socketid) => {
        consoleMessage(`系统消息:离开直播间成功,id=${socketid}`);
    }
    peerConnectHandler.onMediaOtherLeaved = (socketid) => {
        consoleMessage(`系统消息:对方离开直播间,id=${socketid}`);
    }
    peerConnectHandler.onMediaMessage = (message) => {
        consoleMessage(`媒体协商消息`);
        //consoleMessage(`来自对方的媒体协商消息: ${JSON.stringify(message)}`);
    }
    peerConnectHandler.onTrack = (e) => {
        consoleMessage(`收到媒体流：e=${e}`)
        if (e.streams[0]) {
            remoteVideo.srcObject = e.streams[0];
        }
    }
    peerConnectHandler.initConnect(roomid, localStream);
}


getLocalMedia();    // 首次打开自动预览本地画面

btnConnectSig.onclick = (e) => {
    if (!localStream) {
        getLocalMedia().then(() => {
            startP2PConnection();
        });
    } else {
        startP2PConnection();
    }

}

btnLeave.onclick = () => {
    btnLeave.disabled = true;
    btnConnectSig.disabled = false;
    peerConnectHandler.leaveAndDisconnect();
    closeLocalMedia();
}