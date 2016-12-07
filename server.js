var express = require('express');
var server = express();
var favicon = require('serve-favicon');

server.use(express.static(__dirname + '/public'));
 
server.use(favicon(__dirname + '/public/favicon.ico'));



var port = 3000;
server.listen(port, function() {
    console.log('server listening on port ' + port);
});