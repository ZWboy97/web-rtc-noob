'use strict'
// devices
var audioInput = document.getElementById("audio-input");
var audioOutput = document.getElementById("audio-output");
var videoDevices = document.getElementById("video-device");
// video
var videoPlayer = document.getElementById("video-player");
// filter selector
var filterSelect = document.getElementById('filter');
// snapshot function
var snapshotButton = document.getElementById('snapshot');
var pictureCanvas = document.getElementById('picture-canvas');
pictureCanvas.width = 320;
pictureCanvas.height = 240; // 指定宽高

// audio
var audioPlayer = document.getElementById('audio-player');


if (!navigator.mediaDevices ||
    !navigator.mediaDevices.enumerateDevices) {
    console.log('不支持获取音视频设备方法');
} else {
    // 对获取的音频和视频的参数约束
    var constants = {
        video: {
            width: {
                min: 300,
                max: 640
            },
            height: 500,
            frameRate: {
                min: 15,
                max: 30
            },
            facingMode: 'enviroment', //后置摄像头，前置为user
        },
        audio: {
            volume: 0.5,                 // 录音音量大小
            sampleRate: 16,                 //采样率
            echoCancellation: true,   //回音消除
            autoGainControl: true,    //自动增益
            noiseSuppression: true,   //噪音消除
            // channelCount: 1,       //声道
            // deviceID,          //指定音频设备
            // groupID
        }
    }
    // 请求音视频权限，成功之后，获取音视频流，并展示到video中
    navigator.mediaDevices.getUserMedia(constants)  // 获取音视频流，结果返回一个Promise
        .then((stream) => {
            videoPlayer.srcObject = stream; // 将流输入到video中进行播放
            audioPlayer.srcObject = stream; // 单独提取音频流
            return navigator.mediaDevices.enumerateDevices();   // 媒体设备管理，返回一个promise
        })
        .then((deviceInfos) => {
            deviceInfos.forEach((item, index) => {      // 获取可用设别列表
                var option = document.createElement('option');
                option.text = item.label;
                option.value = item.deviceId;
                if (item.kind === 'audioinput') {
                    audioInput.appendChild(option);
                } else if (item.kind === 'audiooutput') {
                    audioOutput.appendChild(option);

                } else if (item.kind === 'videoinput') {
                    videoDevices.appendChild(option);
                }
            })
        })
        .catch((err) => {
            console.log('err', err);
        })
}

// 添加事件监听
filterSelect.onchange = function () {
    videoPlayer.className = filterSelect.value;
}
// 为截图按钮添加事件监听
snapshotButton.onclick = function () {
    // 从播放器截取画面，并展示
    pictureCanvas.className = filterSelect.value;
    pictureCanvas.getContext('2d').drawImage(videoPlayer, 0, 0, pictureCanvas.width, pictureCanvas.height);
}