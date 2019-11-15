# web-rtc-noob
> 此仓库为入门学习webrtc技术之路的各种demo实现，覆盖web-rtc技术的多个常用方法和场景。
## 实现的功能或者涉及的工作
- 使用nodejs搭建http，https服务器
- 使用socket.io搭建聊天服务器，也是未来web-rtc直播中的信令服务器
- web-rtc的本地设备管理
- web-rtc采集、录制本地的音视频
- web-rtc实现本地的音视频通信
- coturn服务器的搭建
- web-rtc实现一对一P2P直播

## 使用方法
- 下载代码
```js
git clone https://github.com/ZWboy97/web-rtc-noob.git
```
- 进入目录
```
cd web-rtc-noob
```

- 安装依赖
```
npm install
```

- 启动信令服务器
```
node server.js
```

## 使用
- index.html
  - web-rtc设备管理
  - 音视频采集、录制
  - 聊天服务器
  
- localp2p.html
  - 界面内的音视频通信
  - 用于熟悉web-rtc媒体协商流程
 
- remotep2p.html
  - 真正的远程p2p聊天
  - 使用coturn作为stun以及turn服务器

