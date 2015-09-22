//ミドルウェア・ライブラリ読み込み
var formidable = require('formidable');
var twitter = require('twitter');
var async   = require('async');

var settings   = require('./settings.js');
var mariadb    = require('./mariadb.js');


/*------------------------------------------------
  画像・動画のアップロードを受け入れる
-------------------------------------------------*/
exports.upload = function (req , res ) {
  console.log("receive post")
  var form   = new formidable.IncomingForm();
  var files  = [];
  var fields = [];

  form.uploadDir = settings.PATH;
  var message;
  form
      .on('field', function(field, value) {
        //titleだったらここで処理できる

        if(field == "title") {
          console.log("title: " + value)
        }

        if(field == "message") {
          console.log("message: " + value)
          message = value;
        }

        fields.push([field, value]);

      })
      .on('file', function(field, file) {
        console.log(field, file);
        files.push([field, file]);
      })
      .on('end', function() {
        //データベースに追加
        var jsonData = {
          latitude : 0 ,
          longitude : 0 ,
          altitude : 0 ,
          message : message
        };
        mariadb.insert_maria(jsonData);

        console.log('-> upload done');
        res.writeHead(200, {'content-type': 'text/plain'});
        res.write('data received');
        res.end();
      });
    form.parse(req);


};

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
   var exist = null;

   mariadb.init();
   async.waterfall([
     function(callback) {
        mariadb.check_user(tweet.screen_name , callback);
     },
     function(arg, callback) {
       console.log(arg);
       if(arg == false) {
        var cookie_str = get_rand();
        mariadb.add_user(tweet.screen_name , cookie_str);
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
  console.log("user_cookie: " + cookie);
  var user_info_json ;

  mariadb.init();
  async.waterfall([
   function(callback) {
      mariadb.get_user_info(cookie , callback);
   },
   function(user_info , callback) {
      user_info_json = user_info ;
      console.log(user_info);
      callback(null, "");
   },
   function(arg, callback) {
     res.json(user_info_json);
     callback(null, "done");
   }
 ]);
}
