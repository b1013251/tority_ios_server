var mysql   = require("mysql");
var locationHelper = require('./location_helper.js');

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
  var query = connection.query('select * from Position');
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
  var query = 'insert into Position set ?';
  var realQuery = connection.query(query , jsonData , function(err, result) {
    if(err != null) {
       console.log("Error");
    }
  });
}

exports.init         = init;
exports.read_maria   = read_maria;
exports.insert_maria = insert_maria;
