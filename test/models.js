var chai = require('chai');
var should = chai.should();
var User = require('../models/User');

describe('User Model', function() {
  it('should create a new user', function(done) {
    var user = new User({
      email: 'test@gmail.com',
      tokens: []
    });
    user.save(function(err) {
      if (err) return done(err);
      done();
    })
  });

  it('should not create a user with the unique email', function(done) {
    var user = new User({
      email: 'test@gmail.com',
    });
    user.save(function(err) {
      if (err) err.code.should.equal(11000);
      done();
    });
  });

  it('should add tokens to user', function(done) {
    User.findOne({email: 'test@gmail.com'}, function(err, user) {
      user.tokens.push({ kind: 'google', accessToken: 'accessToken', refreshToken: 'refreshToken', expiry: Date.now()});
      user.tokens.push({ kind: 'fitbit', accessToken: 'fitbitAccessToken', secret:'secret'});
      user.save(function(err) {
        if (err) err.code.should.equal(11000);
        done();
      });
    });
  });

  it('should find google refresh token ', function(done) {
    User.findOne({email: 'test@gmail.com'}, function(err, user) {

      user.getRefreshToken().should.equal('refreshToken');
      done();
    });
  });

  it('should find fitbit token ', function(done) {
    User.findOne({email: 'test@gmail.com'}, function(err, user) {

      user.getFitbitToken().accessToken.should.equal('fitbitAccessToken');
      user.getFitbitToken().secret.should.equal('secret');
      done();
    });
  });

  it('should find user by email', function(done) {
    User.findOne({ email: 'test@gmail.com' }, function(err, user) {
      if (err) return done(err);
      user.email.should.equal('test@gmail.com');
      done();
    });
  });

  it('should delete a user', function(done) {
    User.remove({ email: 'test@gmail.com' }, function(err) {
      if (err) return done(err);
      done();
    });
  });
});
