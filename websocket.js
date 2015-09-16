// libraries
var http = require('http');
var socketIO   = require('socket.io')

//my file
var settings   = require('./settings.js');
var locationHelper = require('./location_helper.js');
var mariadb = require('./mariadb.js');


var init = function(){
  var websocketServer = http.createServer();
  var user = [];
  io = socketIO.listen(websocketServer);

  io.sockets.on("connection" , function(socket) {
    console.log("connected");
    console.log(socket.id);
    user[socket.id] = {
      latitude  : 0 ,
      longitude : 0
    }

    socket.on("disconnect" , function() {
      console.log("disconnected");
      delete user[socket.id];
    });

    //デバッグ用にwebsocketで投稿できるようにしているー＞本番環境では通常のhttp要求
    socket.on("message_server" , function(data) {
      console.log("message received");
      console.log(data.message);
      console.log(data.latitude);
      console.log(data.longitude);
      console.log(data.media);
      socket.emit("message" , data);
      socket.broadcast.emit("message" , data );
    })

    //位置情報を受け取る
    socket.on("location_server" , function(location) {
      console.log("location changed");
      user[socket.id].latitude  = location.latitude;
      user[socket.id].longitude = location.longitude;
  	console.log("latitude :" + location.latitude);
  	console.log("longitude:" + location.longitude);
      //全データから検索し，emitする
      mariadb.read_maria(socket.id , location);
    });
  });

  //サーバ起動
  websocketServer.listen(settings.WEBSOCKET_PORT , '0.0.0.0');
}


exports.init = init;
