'use strict'

var recordButton = document.getElementById('btn-record');
var playButton = document.getElementById('btn-play');
var downloadButton = document.getElementById('btn-download');
var buffer;
var mediaRecorder;

var recordPlayer = document.getElementById("record-player");


function startRecord() {
    buffer = [];
    var options = {
        mimeType: 'video/webm;codecs=vp8',
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log('not support this type');
        return;
    }
    try {
        mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e) {
        console.log('err:', e);
    }
    mediaRecorder.ondataavailable = (e) => {
        if (e && e.data && e.data.size > 0) {
            buffer.push(e.data);
        }
    }
    mediaRecorder.start(10);
}


function stopRecord() {
    mediaRecorder.stop();
}

recordButton.onclick = () => {
    if (recordButton.textContent === '录制') {
        startRecord();
        recordButton.textContent = '停止录制';
        playButton.disabled = true;
        downloadButton.disabled = true;
    } else {
        stopRecord();
        recordButton.textContent = '录制';
        playButton.disabled = false;
        downloadButton.disabled = false;
    }
}

playButton.onclick = () => {
    var blob = new Blob(buffer, { type: 'video/webm' });
    recordPlayer.src = window.URL.createObjectURL(blob);
    recordPlayer.srcObject = null;
    recordPlayer.controls = true;
    recordPlayer.play();
}