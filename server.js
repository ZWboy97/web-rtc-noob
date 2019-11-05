'use strict'

var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require('express');
var serveIndex = require('serve-index');

var app = express();
app.use(serveIndex('.'));
app.use(express.static('.'));



// http server
var http_server = http.createServer(app);
http_server.listen(80, '0.0.0.0');

// https server
var options = {
	key 	: fs.readFileSync('./cert/stu.zwboy.cn.key'),
	cert	: fs.readFileSync('./cert/stu.zwboy.cn.pem')
}
var https_server = https.createServer(options, app);
https_server.listen(443,'0.0.0.0');
