var express = require('express');
var server = express();
var favicon = require('serve-favicon');

server.set('port', (process.env.PORT || 5000));
server.use(express.static(__dirname + '/public'));
 
server.use(favicon(__dirname + '/public/favicon.ico'));

server.listen(server.get('port'), function() {
    console.log('server listening on port ' + server.get('port'));
});




