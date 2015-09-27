//ミドルウェア・ライブラリ読み込み
var formidable = require('formidable');
var twitter = require('twitter');
var async   = require('async');

var settings   = require('./settings.js');
var mariadb    = require('./mariadb.js');

/*------------------------------------------------
  汎用関数群
-------------------------------------------------*/
function checkSession(cookie, func_callback) {
  console.log("user_cookie: " + cookie);
  var user_info_json ;

  mariadb.init();
  async.waterfall([
   function(callback) {
      mariadb.get_user_info(cookie , callback);
   },
   function(user_info , callback) {
      user_info_json = user_info ;
      console.log("user:" + user_info);
      callback(null, "");
   },
   function(callback) {
     func_callback(null, user_info_json);
   }
  ]);
 }

/*------------------------------------------------
  画像・動画のアップロードを受け入れる
-------------------------------------------------*/
exports.upload = function (req , res ) {
  console.log("post received");
  //セッション関係変数
  var cookie = req.headers.cookie.split("=")[1];
  var session = null;

  //フォーム関係変数
  var form   = new formidable.IncomingForm();
  var files  = [];
  var fields = [];

  form.uploadDir = settings.PATH;

 //セッションチェック //
  mariadb.init();
  async.waterfall([
   function(callback) {
      checkSession(cookie, callback);
   },
   function(user_info , callback) {
     if(user_info == null) {
       console.log("error: session is not established");
       res.send("error: session is not established");
     } else {
       session = user_info;
       callback(null, "done");
     }
   },
   function(callback) {
     var message;
     var latitude  = 0;
     var longitude = 0;
     var altitude  = 0;
     var file_path;
     form
         .on('field', function(field, value) {
           if(field == "message") {
             console.log("message: " + value)
             message = value;
           }

           if(field == "latitude") {
             console.log("latitude: " + value)
             latitude = value;
           }

           if(field == "longitude") {
             console.log("longitude: " + value)
             longitude = value;
           }
           fields.push([field, value]);
         })
         .on('file', function(field, file) {
           console.log("field",field);
           console.log("file" , file);
           files.push([field, file]);
           file_path = file.path;
         })
         .on('end', function() {
           //データベースに追加
           var jsonData = {
             latitude : latitude ,
             longitude : longitude ,
             altitude : altitude ,
             message : message ,
             file_path : file_path
           };
           mariadb.insert_maria(jsonData);

           console.log('-> upload done');
           res.writeHead(200, {'content-type': 'text/plain'});
           res.write('data received');
           res.end();
         });
         form.parse(req);
   }
  ]);
 }

/*------------------------------------------------
  Twitterの内容から取得してデータベースに保存
-------------------------------------------------*/
function get_rand() {
  var alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTLVWXYZ0123456789";
  var randString = "";
  for(var i = 0 ; i < 20 ; i ++) {
    randString += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return randString;
}

function set_cookie(req,res,str) {
  res.cookie('Session-Cookie', str , {maxAge:60000, httpOnly:false});
  res.send("ok");
}

exports.get_token = function(req, res){
 console.log("received");
 console.log(req.body.authToken);
 console.log(req.body.authTokenSecret);

 var client = new twitter({
   consumer_key        : "sshdXxA0xlIb5Npj9z9RUffhC",
   consumer_secret     : "EQWWHDGt2jWps3W5ng8uGqNViajCVCDVlLn7PTvU6nNoTP3kJe",
   access_token_key    : req.body.authToken,
   access_token_secret : req.body.authTokenSecret,
 });
 var params = {};
 client.get('account/settings', params , function(error , tweet , response) {
   //if(error != null) return;

   console.log(tweet);

   var exist = null;

   mariadb.init();
   async.waterfall([
     function(callback) {
        mariadb.check_user(tweet.screen_name , callback);
     },
     function(is_exist, callback) {
       console.log("user existed? : " + is_exist);
       if(is_exist == false) {
        var cookie_str = get_rand();
        mariadb.add_user(tweet.screen_name , cookie_str);
        set_cookie(req,res,cookie_str);
        callback(null,"second");
      } else  {
         var cookie_str = get_rand();
         mariadb.update_user(tweet.screen_name , cookie_str);
         set_cookie(req,res,cookie_str);
         callback(null,"second");
      }
    }
   ]);
 });
}


/*------------------------------------------------
  クッキーでセッションIDを受け取りデータベース参照
-------------------------------------------------*/
function send_session(req,res,existStr) {
    res.send(existStr);
}

exports.check_session = function(req,res){
  var cookie = req.headers.cookie.split("=")[1];
  console.log("cookie: " + cookie);
  var exist = false;
  var existStr = "NG";

  mariadb.init();
  async.waterfall([
   function(callback) {
      mariadb.check_session(cookie , callback);
   },
   function(ext , callback) {
      exist = ext
      callback(null, "");
   },
   function(arg, callback) {
     if(exist) {
       existStr = "OK"
     }
     callback(null, "");
   },
   function(arg, callback) {
     send_session(req,res,existStr);
     callback(null, "done");
   }
 ]);
};

/*------------------------------------------------
  マイページ用のデータを渡す
-------------------------------------------------*/
exports.user_info = function(req , res) {
  var cookie = req.headers.cookie.split("=")[1];
  mariadb.init();
  async.waterfall([
   function(callback) {
      checkSession(cookie, callback);
   },
   function(user_info , callback) {
     if(user_info != null) {
       res.send(user_info);
     } else {
       res.send("nothing");
     }
   }
 ]);
}


/*------------------------------------------------
  　投稿を受付ける
-------------------------------------------------*/
