var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var refresh = require('google-refresh-token');
var secrets = require('../config/secrets');
var mirrorClient = require('mirror-api-client')({
  clientId: secrets.google.clientID,
  clientSecret: secrets.google.clientSecret,
  redirectUri: 'http://jonahback.com:3000/auth/google/callback',
  scope: ''
});


var userSchema = new mongoose.Schema({
  email: { type: String, unique: true, lowercase: true },
  password: String,

  google: String,
  fitbit: String,
    timelineItem: String,
  tokens: Array,

  profile: {
    name: { type: String, default: '' },
    gender: { type: String, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    picture: { type: String, default: '' }
  },

  resetPasswordToken: String,
  resetPasswordExpires: Date
});

/**
 * Hash the password for security.
 * "Pre" is a Mongoose middleware that executes before each user.save() call.
 */

userSchema.pre('save', function(next) {
  var user = this;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(5, function(err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

/**
 * Validate user's password.
 * Used by Passport-Local Strategy for password validation.
 */

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

userSchema.methods.getMirrorClient = function(callback) {
  var self = this;
  this.getAccessToken(function(token) {
    mirrorClient.oauth2Client.credentials = {
        access_token:token,
        refresh_token:self.getRefreshToken()
    };
    mirrorClient.connect(function(err, client) {
	callback(mirrorClient);
    });
  });
}

userSchema.methods.getAccessToken = function(callback) {
  console.log('getAccessToken called');
  var googleToken = null;
  var idx = 0;
  for(idx = 0; idx < this.tokens.length; idx++) {
    if(this.tokens[idx].kind === 'google') {
      googleToken = this.tokens[idx];
      break;
    }
  }

  if(googleToken.expiry < new Date()) {
    var user = this;
    console.log('getting new token');
    refresh(googleToken.refreshToken, secrets.google.clientID, secrets.google.clientSecret, function(err, json, res) {
      if (err)
        console.log(err);
      user.tokens[idx].accessToken = json.accessToken
      user.tokens[idx].expiry = new Date(+new Date + parseInt(json.expiresIn, 10));
      callback(json.accessToken);
    })
  }
  else {
    callback(json.accessToken);
  }

}

userSchema.methods.getRefreshToken = function(callback) {
  var googleToken = null;
  var idx = 0;
  for(idx = 0; idx < this.tokens.length; idx++) {
    if(this.tokens[idx].kind === 'google') {
      googleToken = this.tokens[idx];
      return googleToken.refreshToken;
      break;
    }
  }
}

/**
 * Get URL to a user's gravatar.
 * Used in Navbar and Account Management page.
 */

userSchema.methods.gravatar = function(size, defaults) {
  if (!size) size = 200;
  if (!defaults) defaults = 'retro';

  if (!this.email) {
    return 'https://gravatar.com/avatar/?s=' + size + '&d=' + defaults;
  }

  var md5 = crypto.createHash('md5').update(this.email);
  return 'https://gravatar.com/avatar/' + md5.digest('hex').toString() + '?s=' + size + '&d=' + defaults;
};

module.exports = mongoose.model('User', userSchema);
