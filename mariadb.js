var mysql   = require("mysql");
var locationHelper = require('./location_helper.js');
var async   = require('async');

var connection;

//初期化
function init() {
  connection = mysql.createConnection({
    host     : 'localhost' ,
    user     : 'node' ,
    password : 'secret' ,
    database : 'node'
  });

  connection.connect(function(err) {
    if (err) {
      console.log('error connecting: ' + err.stack);
      return;
    }
  });
}

//バブルを取得
function read_maria(id , location) {
  var count = 0;
  var query = connection.query('select * from Post');
  query
  .on('error', function(err){
    console.log(err);
  })
  .on('fields', function(fields) {
  })
  .on('result', function(row) {
    connection.pause();
    if (
      locationHelper.is_in_a_range(
        row.latitude , row.longitude ,
        location.latitude , location.longitude , location.range
      )
    ) {
      console.log(row);
      io.to(id).emit("message_bubbles" , row );
      count++;
    }

    connection.resume();

  })
  .on('end', function() {
    console.log("finished.");
    console.log(count + "points");
  });
}

//投稿機能
function insert_maria(jsonData) {
  var query = 'insert into Post set ?';
  var realQuery = connection.query(query , jsonData , function(err, result) {
    if(err != null) {
       console.log("Error");
    }
  });
}

function check_user(screen_name , callback) {
  var query = 'select * from User where twitter_id = ?';
  var realQuery = connection.query(query , screen_name);
  var exist = false;

  realQuery
    .on('error' , function(err) {
      console.log(err);
      exist = false;
    })
    .on('result' , function(rows) {
      if(rows != null) {
        console.log(rows);
        exist = true;
      }
    })
    .on('end' , function() {
      console.log('check finish');
      console.log(exist);
      callback(null , exist);
    });
}

function add_user(screen_name , cookie_str) {
  jsonData = {
    twitter_id : screen_name,
    cookie     : cookie_str
  };

  var query = 'insert into User set ?';
  var realQuery = connection.query(query , jsonData , function(err, result) {
    if(err != null) {
       console.log("Error");
    }
  });
}

function check_session(cookie , callback) {
  var query = 'select * from User where cookie = ?';
  var realQuery = connection.query(query , cookie);
  var exist = false;

  realQuery
    .on('error' , function(err) {
      console.log(err);
      exist = false;
    })
    .on('result' , function(rows) {
      if(rows != null) {
        console.log(rows);
        exist = true;
      }
    })
    .on('end' , function() {
      console.log('check session finish');
      console.log(exist);
      callback(null , exist);
    });
}

function get_user_info(cookie , callback) {
  var query = 'select * from User where cookie = ?';
  var realQuery = connection.query(query , cookie);

  var user_json;

  realQuery
    .on('error' , function(err) {
      console.log(err);
    })
    .on('result' , function(rows) {
      if(rows != null) {
        user_json = rows;
        console.log(rows);
      }
    })
    .on('end' , function() {
      console.log('user session finish');
      if(user_json == null) {
        console.log('error')
      }
      callback(null, user_json);
    });
}


exports.init         = init;
exports.read_maria   = read_maria;
exports.insert_maria = insert_maria;

exports.check_user = check_user;
exports.add_user   = add_user;

exports.check_session = check_session;

exports.get_user_info = get_user_info
