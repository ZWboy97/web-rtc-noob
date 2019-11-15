// 本地的一对一直播模拟，理清楚媒体协商的流程

'use strict'

var localVideo = document.getElementById('localvideo');
var remoteVideo = document.getElementById('remotevideo');
var btnStart = document.getElementById('start');
var btnCall = document.getElementById('call');
var btnHangUp = document.getElementById('hangup');

var localStream;
var pc1;
var pc2;



btnStart.onclick = () => {
    // 从摄像头采集画面，并预览展示在localvideo上
    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {
        console.log('the getUserMedia is not supported')
        return;
    }

    var constraints = {
        video: true,
        audio: false
    }

    navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
            localVideo.srcObject = stream;
            localStream = stream;   // 全局locaStream，用于之后的发送
        })
        .catch((err) => {
            console.log('error:', err);
        });

}

btnCall.onclick = () => {
    // 模拟创建两个PeerConnection
    pc1 = new RTCPeerConnection();
    // 查看候选
    pc1.onicecandidate = (e) => {
        // 收到来自stun和turn的候选
        // 将候选传递给pc2, 实际的网络中是通过信令服务器传递的
        pc2.addIceCandidate(e.candidate);
        console.log('pc1 candidate:', e.candidate);
    }

    pc2 = new RTCPeerConnection();
    pc2.onicecandidate = (e) => {
        pc1.addIceCandidate(e.candidate);
        console.log('pc2 candidate:', e.candidate);
    }

    // 展示接收到的媒体流，进行渲染展示
    pc2.ontrack = (e) => {
        console.log('pc2 ontrack', e.streams);
        remoteVideo.srcObject = e.streams[0];
    }

    // 将之前获取的流，添加到连接中，进行发送
    localStream.getTracks().forEach(track => {
        console.log('pc1 add track', track);
        pc1.addTrack(track, localStream);
    });


    // 两端进行媒体协商
    var offerOptions = {
        offerToReceiveAudio: 0,
        offerToReceiveVideo: 1,
        iceRestart: false
    }
    pc1.createOffer(offerOptions)
        .then((desc) => {
            console.log('pc1设置localdesc:', desc);
            pc1.setLocalDescription(desc);
            // 实际上还需要通过信令服务器传递到pc2
            console.log('pc2设置remotedesc');
            pc2.setRemoteDescription(desc);
            console.log('pc2 create answer');
            pc2.createAnswer()
                .then((desc) => {
                    console.log('pc2 set local desc:', desc);
                    pc2.setLocalDescription(desc);
                    // 通过信令服务器发送到pc1
                    console.log('pc1 set remote desc:', desc);
                    pc1.setRemoteDescription(desc);
                }).catch(err => {
                    console.log('create answer error:', err);
                });
        }).catch((err) => {
            console.log('create offer error:', err);
        });
}

btnHangUp.onclick = () => {
    pc1.close();
    pc2.close();
    pc1 = null;
    pc2 = null;
}