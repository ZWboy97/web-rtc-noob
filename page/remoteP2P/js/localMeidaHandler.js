/**
 * 用于采集本地的音视频流
 */
class LocalMediaHandler {

    constructor() {
        this.localStream;
    }

    getLocalMedia = (constants = null) => {

        if (!navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia) {
            console.log('sorry,your brower is not support function getUserMedia');
            alert('sorry,your brower is not support function getUserMedia');
        }
        var _constants = constants ? constants : {
            video: true,
            audio: true
        };
        return navigator.mediaDevices.getUserMedia(_constants)
            .then((stream) => {
                this.localStream = stream;
                return new Promise((resolve, reject) => {
                    resolve(stream);
                });
            })
            .catch((err) => {
                console.log('获取音视频失败', err);
                alert('获取本地音视频流失败');
            });
    }

    closeLocalMedia = () => {
        return new Promise((resolve, reject) => {
            try {
                if (this.localStream && this.localStream.getTracks()) {
                    this.localStream.getTracks().forEach((track) => {
                        track.stop();
                    });
                    this.localStream = null;
                    console.log('关闭了本地媒体流');
                    resolve();
                }
            } catch{
                reject();
            }
        });
    }
}

export default LocalMediaHandler;