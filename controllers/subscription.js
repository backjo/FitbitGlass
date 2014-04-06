var secrets = require('../config/secrets.js');
var mirrorClient = require('mirror-api-client')({
  clientId: secrets.google.clientID,
  clientSecret: secrets.google.clientSecret,
  redirectUri: 'http://localhost:3000/auth/google/callback',
  scope: ''
});

exports.index = function(req, res) {
  res.render('home', {
    title: 'Home'
  });
};

exports.activities = function(req, res) {
  res.send(204);
  if(req.user) {
    req.user.getAccessToken(function(token) {
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
