//libraries
var express        = require('express');
var http           = require('http');
var util           = require('util');
var json           = require('json');
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');
var fs             = require('fs');

//my file
var settings   = require('./settings.js');


//http server init
var app        = express();
var httpServer      = require('./http.js');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser());
app.use(methodOverride());
//http routing
app.post('/upload' , httpServer.upload);
//http server listen
app.listen(settings.PORT , '0.0.0.0');


//websocket
var websocket = require('./websocket.js');
websocket.init();


//mariaDB
var mariadb = require('./mariadb.js');
mariadb.init();
