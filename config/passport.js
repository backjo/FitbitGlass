var _ = require('underscore');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FitbitStrategy = require('passport-fitbit').Strategy
var User = require('../models/User');
var secrets = require('./secrets');
var fitbit = require('fitbit');

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

var subscribe = function(user) {

  var fitbitToken = user.getFitbitToken(),
      accessToken = fitbitToken.accessToken,
      accessSecret = fitbitToken.secret,
      client = null;
      console.log("Subscribe function");
      console.log(fitbitToken);

      client = new fitbit(secrets.fitbit.consumerKey, secrets.fitbit.consumerSecret, {
        accessToken: accessToken,
        accessTokenSecret: accessSecret,
        unitMeasure: 'en_GB'
      })

      client._oauth.post('https://api.fitbit.com/1/user/-/activities/api\
Subscriptions/' + user.fitbit + '-activity.json',client.accessToken, client.accessTokenSecret,null,null,function (err, data, res) {
                                        console.log(data);
                                });
}


/**
 * Sign in using Email and Password.
 */

passport.use(new LocalStrategy({ usernameField: 'email' }, function(email, password, done) {
  User.findOne({ email: email }, function(err, user) {
    if (!user) return done(null, false, { message: 'Email ' + email + ' not found'});
    user.comparePassword(password, function(err, isMatch) {
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Invalid email or password.' });
      }
    });
  });
}));

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id or email.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */
/**
 * Sign in with Google.
 */

passport.use(new GoogleStrategy(secrets.google, function(req, accessToken, refreshToken, profile, done) {
  if (req.user) {
    User.findOne({ $or: [{ google: profile.id }, { email: profile.email }] }, function(err, existingUser) {
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Google account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, function(err, user) {
          user.google = profile.id;
          user.tokens.push({ kind: 'google', accessToken: accessToken, refreshToken: refreshToken, expiry: Date.now()});
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.gender = user.profile.gender || profile._json.gender;
          user.profile.picture = user.profile.picture || profile._json.picture;
          user.save(function(err) {
            req.flash('info', { msg: 'Google account has been linked.' });
            user.getAccessToken(function(token) {
              console.log('token is:' + token);
            })
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ google: profile.id }, function(err, existingUser) {
      if (existingUser) return done(null, existingUser);
      User.findOne({ email: profile._json.email }, function(err, existingEmailUser) {
        if (existingEmailUser) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Google manually from Account Settings.' });
          done(err);
        } else {
          var user = new User();
          user.email = profile._json.email;
          user.google = profile.id;
          user.tokens.push({ kind: 'google', accessToken: accessToken, refreshToken: refreshToken, expiry: Date.now()});
          user.profile.name = profile.displayName;
          user.profile.gender = profile._json.gender;
          user.profile.picture = profile._json.picture;
          user.save(function(err) {
            user.getMirrorClient(function(mirrorClient) {
              mirrorClient.insertTimelineItem({"text": "Welcome to Fitbit for Glass"}, function(){});
            });
            done(err, user);
          });
        }
      });
    });
  }
}));

passport.use(new FitbitStrategy( secrets.fitbit, function(req, accessToken, secret, profile, done) {

  if (req.user) {
    User.findOne({ $or: [{ fitbit: profile.id }, { email: profile.email }] }, function(err, existingUser) {
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Fitbit account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, function(err, user) {
          user.fitbit = profile.id;
          user.tokens = _.reject(user.tokens, function(token) { return token.kind === 'fitbit'; });
          user.tokens.push({ kind: 'fitbit', accessToken: accessToken, secret: secret });
          user.save(function(err) {
            subscribe(user);
            req.flash('info', { msg: 'Fitbit account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ fitbit: profile.id }, function(err, existingUser) {
      if (existingUser) {
        existingUser.tokens = _.reject(existingUser.tokens, function(token) { return token.kind === 'fitbit'; });
        existingUser.tokens.push({ kind: 'fitbit', accessToken: accessToken, secret: secret });
        existingUser.save(function(err) {
        });
        return done(err, existingUser);

      }
      User.findOne({ email: profile._json.email }, function(err, existingEmailUser) {
        if (existingEmailUser) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Google manually from Account Settings.' });
          done(err);
        } else {
          var user = new User();
          user.email = profile._json.email;
          user.fitbit = profile.id;
          user.tokens.push({ kind: 'fitbit', accessToken: accessToken, secret: secret });
          user.save(function(err) {
            subscribe(user);
            done(err, user);
          });
        }
      });
    });
  }
}));
/**
 * Login Required middleware.
 */

exports.isAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};

/**
 * Authorization Required middleware.
 */

exports.isAuthorized = function(req, res, next) {
  var provider = req.path.split('/').slice(-1)[0];
  if (_.findWhere(req.user.tokens, { kind: provider })) next();
  else res.redirect('/auth/' + provider);
};
