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

              var fitbitToken = user.getFitbitToken(),
                  accessToken = fitbitToken.accessToken,
                  accessSecret = fitbitToken.secret;


              if(accessToken && accessSecret) {
                var client = new fitbit(secrets.fitbit.consumerKey, secrets.fitbit.consumerSecret, {
                    accessToken: accessToken,
                    accessTokenSecret: accessSecret,
                    unitMeasure: 'en_GB'
                });
                client.getActivities(function (err, activities) {
                  var msgString = 'Steps Today: ' + activities.steps() + ' / ' + activities._attributes.goals.steps;
		              if(user.timelineItem) {
			                 mirrorClient.updateTimelineItem({"text":msgString, "id": user.timelineItem});
		              } else {
                    mirrorClient.insertTimelineItem({"text": msgString}, function(err, data){
                      console.log(data);
                      user.timelineItem=data.id;
                      user.save();
                    });
                  }
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
