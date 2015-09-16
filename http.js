var formidable = require('formidable');
var settings   = require('./settings.js');
var mariadb    = require('./mariadb.js');

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
