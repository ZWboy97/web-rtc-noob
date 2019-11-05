'use strict'
var videoPlayer = document.getElementById("video-player");
var audioInput = document.getElementById("audio-input");
var audioOutput = document.getElementById("audio-output");
var videoDevices = document.getElementById("video-device");


if (!navigator.mediaDevices ||
    !navigator.mediaDevices.enumerateDevices) {
    console.log('不支持获取音视频设备方法');
} else {
    // // 向浏览器请求音视频权限
    // // 适配不同浏览器的getUserMedia
    // navigator.getUserMedia = navigator.getUserMedia ||
    //     navigator.webkitGetUserMedia ||
    //     navigator.mozGetUserMedia ||
    //     navigator.msGetUserMedia;
    // if (navigator.getUserMedia) {
    //     console.log('支持getUserMedia方法')
    // } else {
    //     console.log('不支持getUserMedia方法')
    // }



    // 约束限制，获取音频和视频
    var constants = {
        video: true,    // 音视频都获取
        audio: true
    }
    // 获取音视频流，并展示到video中
    navigator.mediaDevices.getUserMedia(constants)  // 获取音视频流，结果返回一个Promise
        .then((stream) => {
            videoPlayer.srcObject = stream;
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