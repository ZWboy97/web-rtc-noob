/**
 * 用户处理负载的媒体协商以及信令过程
 */

class PeerConnectHandler {


    constructor() {
        this.socket;
        this.state;
        this.peerConnection;
        this.roomid;
        this.localStream;
        // 给外部提供回调
        this.onMediaJoined;
        this.onMediaOtherJoined;
        this.onMediaFull;
        this.onMediaLeaved;
        this.onMediaOtherLeaved;
        this.onMediaMessage;
        this.onTrack;
    }

    initConnect = (roomid, localStream) => {
        this.socket = io.connect();
        this.state = 'init';
        this.roomid = roomid;
        this.localStream = localStream;
        this.registeSocketHanler();
        this.socket.emit('media-join', this.roomid);
    }

    registeSocketHanler = () => {
        var socket = this.socket;
        // 第一个进入直播间，并创建连接
        socket.on('media-joined', (message, socketid) => {
            this.state = 'joined';
            this.createPeerConnection();
            if (this.onMediaJoined) {
                this.onMediaJoined(message, socketid);
            }
        });
        // 第二个进入直播间
        socket.on('media-other-joined', (socketid) => {
            if (this.state === 'joined_unbind') {    // 之前对方先退出了
                this.createPeerConnection();
            }
            this.state = 'joined_conn';
            // 由先加入的一方发起媒体协商过程,即发送offer
            this.sendNegotiationOffer();
            if (this.onMediaOtherJoined) {
                this.onMediaOtherJoined(socketid);
            }
        });
        // 满员了
        socket.on('media-full', (message) => {
            this.state = 'leaved';
            socket.disconnect();    // 断开socket连接
            if (this.onMediaFull) {
                this.onMediaFull(message);
            }
        });
        // 主动离开直播间响应成功
        socket.on('media-leaved', (socketid) => {
            this.state = 'leaved';
            socket.disconnect();
            if (this.onMediaLeaved) {
                this.onMediaLeaved(socketid);
            }
        });
        // 直播间对方离开了直播间
        socket.on('media-other-leaved', (socketid) => {
            this.state = 'joined_unbind';
            this.closePeerConnection();
            if (this.onMediaOtherLeaved) {
                this.onMediaOtherLeaved(socketid);
            }
        });
        // 收发媒体协商消息
        socket.on('media-message', (message) => {
            if (!message || !this.peerConnection) {
                return;
            }
            if (message.type && message.type === 'offer') {
                // 作为callee，接收对方的offer，将其作为远端SDP
                this.peerConnection.setRemoteDescription(new RTCSessionDescription(message));
                // 作为callee，接收到offer之后，回复answer SDP
                this.peerConnection.createAnswer()
                    .then((desc) => {
                        // createAnswer生成的desc作为本地的SDP
                        this.peerConnection.setLocalDescription(desc);   // 操作会触发搜集candidate，即onicecandidate监听
                        // 拿到自己的SDP之后，需要将其发送给对方
                        if (socket) {
                            socket.emit('media-message', this.roomid, desc);
                        }
                    })
                    .catch((error) => {
                        console.log('create answer error:', error)
                    });
            } else if (message.type === 'answer') {
                // 作为caller，收到callee的answer，将其作为remoteSDP
                this.peerConnection.setRemoteDescription(new RTCSessionDescription(message));
            } else if (message.type === 'candidate') {
                // 收到对方发来的candidate（在对方的onicecandidate中发送）
                var candidate = new RTCIceCandidate({
                    sdpMLineIndex: message.label,
                    candidate: message.candidate
                });
                // 加入到iceCandidate中，选择最优的候选
                this.peerConnection.addIceCandidate(candidate);
            } else {
                console.log('error message type');
            }
            if (this.onMediaMessage) {
                this.onMediaMessage(message);
            }
        });
    }


    // 进行媒体协商
    sendNegotiationOffer = () => {
        // 只有在双方的socket通信链路已经连接的时候
        if (this.state === 'joined_conn') {
            if (this.peerConnection) {
                var options = {
                    offerToReceiveVideo: 1,
                    offerToReceiveAudio: 1,
                }
                this.peerConnection.createOffer(options)
                    .then((desc) => {
                        // 获得本地的SDP
                        this.peerConnection.setLocalDescription(desc);
                        // 并将desc发给对方
                        if (this.socket) {
                            this.socket.emit('media-message', this.roomid, desc);
                        }
                    })
                    .catch((error) => {
                        console.log('fail to get offer:', error);
                    })
            }
        }
    }

    // 创建PeerConnection,并将媒体流加入其中
    createPeerConnection = () => {
        if (!this.peerConnection) {
            var pcConfig = {
                'iceServers': [{
                    'urls': 'turn:stu.zwboy.cn:3478',
                    'credential': '123456',
                    'username': 'ljc'
                }]
            };
            this.peerConnection = new RTCPeerConnection(pcConfig);
            // onicecandidate方法在setLocalDescription方法之后调用
            this.peerConnection.onicecandidate = (e) => {
                if (e.candidate) {
                    // 将candidate发送到对方，对方加入到icecandidate中进行选择
                    this.socket.emit('media-message', this.roomid, {
                        type: 'candidate',
                        label: e.candidate.sdpMLineIndex,
                        id: e.candidate.sdpMid,
                        candidate: e.candidate.candidate
                    });
                }
            }
            // 监听远程媒体流track，接收到对方数据流的时候会触发调用
            this.peerConnection.ontrack = (e) => {
                if (this.onTrack) {
                    this.onTrack(e)
                }
            }
        }

        // 将本地的媒体流添加到连接的track中
        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => {
                this.peerConnection.addTrack(track, this.localStream);
            })
        }
    }

    // 销毁peerconnection
    closePeerConnection = () => {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
    }

    leaveAndDisconnect = () => {
        if (this.socket) {
            this.socket.emit('media-leave', this.roomid);
        }
        this.closePeerConnection();
    }

    updateLocalStream = (stream) => {
        console.log('update local stream');
        console.log('sender', this.peerConnection.getSenders())
        this.peerConnection.getSenders().forEach((sender) => {
            this.peerConnection.removeTrack(sender);
        })
        this.localStream = stream;
        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => {
                this.peerConnection.addTrack(track, this.localStream);
            })
        }
    }

}


export default PeerConnectHandler;