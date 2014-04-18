var secrets = require('../config/secrets.js');
var User = require('../models/User.js');
var fs = require('fs');
var fitbit = require('fitbit');

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

              for(idx = 0; idx < user.tokens.length; idx++) {
                if(user.tokens[idx].kind === 'fitbit') {
                  accessToken = user.tokens[idx].accessToken;
                  accessSecret = user.tokens[idx].secret;
                  break;
                }
              }

              if(accessToken && accessSecret) {
                var client = new fitbit(secrets.fitbit.consumerKey, secrets.fitbit.consumerSecret, {
                    accessToken: accessToken,
                    accessTokenSecret: accessSecret,
                    unitMeasure: 'en_GB'
                  });
                client.getActivities(function (err, activities) {
                  var msgString = 'Progress Today: ' + activities.steps() + ' / ' + activities._attributes.goals.steps;
		    if(user.timelineItem) {
			mirrorClient.updateTimelineItem({"text":msgString, "id": user.timelineItem});
		    } else {
			mirrorClient.insertTimelineItem({"text": msgString}, function(err, data){console.log(data);user.timelineItem=data.id; user.save();});          }
	mirrorClient.listTimelineItems(50, function(err, list){
                    console.log(list);
                    for(var i = 0; i < list.items.length; i++) {
                      console.log("Timeline item: ", list.items[i].text);

                    }
                  });
                });

              }
            });
          }
        })
      }
    });
  }

  if(req.user) {

  }
}
