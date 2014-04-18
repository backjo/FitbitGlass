/**
 * GET /
 * Home page.
 */
var fitbit = require('fitbit');
var secrets = require('../config/secrets')
exports.index = function(req, res) {
  var accessToken;
  var accessSecret;
  var idx = 0;
  if(req.user) {
    for(idx = 0; idx < req.user.tokens.length; idx++) {
      if(req.user.tokens[idx].kind === 'fitbit') {
        console.log(req.user.tokens[idx]);
        accessToken = req.user.tokens[idx].accessToken;
        accessSecret = req.user.tokens[idx].secret;
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
     if (err) {
       console.log(err);
       return;
     }
     console.log(activities);
     res.render('home', {
       title: 'Home',
       steps: activities.steps(),
       goal: activities._attributes.goals.steps
     });
   });
    }


  } else {
    res.render('home', {
      title: 'Home',
      steps: 0
    });
  }
};
