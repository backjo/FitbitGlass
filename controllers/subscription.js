var secrets = require('../config/secrets.js');
var User = require('../models/User.js');
var fs = require('fs');

exports.index = function(req, res) {
  res.render('home', {
    title: 'Home'
  });
};

exports.activities = function(req, res) {
  console.log('body is');
  console.log(req.files);
    console.log(req.query);
  res.send(204);

  if(req.files.updates) {
    fs.readFile(req.files.updates.path, 'utf8', function (err, data) {
      if (err) {
        console.log('Error: ' + err);
        return;
      }

      data = JSON.parse(data);
      if(data[0]) {
        User.findOne({fitbit: data[0].ownerId}, function(err, user) {
          if(user) {
            user.getMirrorClient(function(mirrorClient) {
              mirrorClient.insertTimelineItem({"text": "Fitbit ping2"}, function(){});
              mirrorClient.listTimelineItems(50, function(err, list){
                            console.log(list);
                            for(var i = 0; i < list.items.length; i++) {
                                console.log("Timeline item: ", list.items[i].text);
                            }
                        });
            });
          }
        })
      }
    });
  }

  if(req.user) {

  }
}
