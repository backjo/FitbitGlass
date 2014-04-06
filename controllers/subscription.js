var secrets = require('../config/secrets.js');
var User = require('../models/User.js');
var fs = require('fs');
var mirrorClient = require('mirror-api-client')({
  clientId: secrets.google.clientID,
  clientSecret: secrets.google.clientSecret,
  redirectUri: 'http://jonahback.com:3000/auth/google/callback',
  scope: ''
});

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

      console.log(data);
    });
  }

  if(req.user) {
    req.user.getAccessToken(function(token) {s
      mirrorClient.oauth2Client.credentials = {
          access_token:token,
          refresh_token:req.user.getRefreshToken()
      };
      mirrorClient.initWithCreds(function(err, cb) {
        mirrorClient.insertTimelineItem({"text": "Hackathon casualties"}, function(){});
        mirrorClient.listTimelineItems(50, function(err, list){
                      console.log(list);
                      for(var i = 0; i < list.items.length; i++) {
                          console.log("Timeline item: ", list.items[i].text);
                      }
                  });
      });

    });
  }
}
