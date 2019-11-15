'use strict'
var desktopPlayer = document.getElementById("desktop-player");

/**
 * 用于采集计算机桌面，可以用于桌面共享
 */
if (!navigator.mediaDevices ||
    !navigator.mediaDevices.enumerateDevices) {
    console.log('不支持获取音视频设备方法');
} else {
    var constants = {
        video: true,
        audio: true
    }
    navigator.mediaDevices.getDisplayMedia(constants)  // 获取电脑屏幕或者应用屏幕 
        .then((stream) => {
            desktopPlayer.srcObject = stream; // 将流输入到video中进行播放
        })
        .catch((err) => {
            console.log('err', err);
        })
}