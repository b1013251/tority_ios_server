//ミドルウェア・ライブラリ読み込み
var express        = require('express');
var http           = require('http');
var util           = require('util');
var json           = require('json');
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');
var fs             = require('fs');

//設定ファイル読み込み
var settings   = require('./settings.js');

//http サーバ設定
var app             = express();
var httpServer      = require('./http.js');
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/tmp')   );
app.use(bodyParser());
app.use(methodOverride());

//http ルーティング
app.post('/upload'   , httpServer.upload);          //メッセージ投稿
app.post('/pass'     , httpServer.get_token);       //Token送信
app.post('/session'  , httpServer.check_session);   //SessionID送信
app.get ('/user_info', httpServer.user_info);       //User情報取得


//http サーバリスン
app.listen(settings.PORT , '0.0.0.0');

//websocketサーバ
var websocket = require('./websocket.js');
websocket.init();

//mariaDB初期化
var mariadb = require('./mariadb.js');
mariadb.init();
