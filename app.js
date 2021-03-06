
/**
 * Module dependencies.
 */

var express = require('express');
var MongoStore = require('connect-mongo')(express);
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
/**
 * Load controllers.
 */

var homeController = require('./controllers/home');
var userController = require('./controllers/user');
var subscriptionController = require('./controllers/subscription');

/**
 * API keys + Passport configuration.
 */

var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

/**
 * Create Express server.
 */

var app = express();

/**
 * Mongoose configuration.
 */

mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.error('✗ MongoDB Connection Error. Please make sure MongoDB is running.');
});

/**
 * Express configuration.
 */

var hour = 3600000;
var day = (hour * 24);
var month = (day * 30);

/**
 * Routes that don't require CSRF
 */
var conditionalCSRF = function (req, res, next) {
  var whitelist = [
    '/subscription/activity',
  ];

  if (req.method !== 'POST') {
    next();
    return;
  }
  if (whitelist.indexOf(req.url) !== -1) {
    next();
  } else {
    (express.csrf())(req, res, next);
  }
};

app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(connectAssets({
  paths: ['public/css', 'public/js'],
  helperContext: app.locals
}));
app.use(express.compress());
app.use(express.logger('dev'));
app.use(express.cookieParser());
//app.use(express.json());
app.use(express.bodyParser());
app.use(express.urlencoded());
app.use(expressValidator());
app.use(express.methodOverride());
app.use(express.session({
  secret: secrets.sessionSecret,
  store: new MongoStore({
    url: secrets.db,
    auto_reconnect: true
  })
}));
//app.use(conditionalCSRF);
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.locals.user = req.user;
  //res.locals._csrf = req.csrfToken();
  res.locals.secrets = secrets;
  next();
});
app.use(flash());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: month }));
app.use(function(req, res, next) {
  // Keep track of previous URL
  if (req.method !== 'GET') return next();
  var path = req.path.split('/')[1];
  if (/(auth|login|logout|signup)$/i.test(path)) return next();
  req.session.returnTo = req.path;
  next();
});
app.use(app.router);
app.use(function(req, res) {
  res.status(404);
  res.render('404');
});
app.use(express.errorHandler());

/**
 * Application routes.
 */
app.post('/subscription/activity', subscriptionController.activities);

app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.get('/logout', userController.logout);
app.get('/account', passportConf.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);

app.get('/auth/google', passport.authenticate('google', { scope: 'profile email https://www.googleapis.com/auth/glass.timeline', accessType: 'offline', approvalPrompt: 'force'}));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});

app.get('/auth/fitbit', passport.authenticate('fitbit'));
app.get('/auth/fitbit/callback', passport.authenticate('fitbit', { failureRedirect: '/login' }), function(req, res) {
  console.log('callback')
  res.redirect(req.session.returnTo || '/');
});

/**
 * Start Express server.
 */

var https = require('https');
var fs = require('fs');
/*
var options = {
    key: fs.readFileSync('/home/jonah/servernopass.key'),
    cert: fs.readFileSync('/home/jonah/jonahback_com.crt')
}*/

//https.createServer(options, app).listen(3001);

app.listen(app.get('port'), function() {
  console.log("✔ Express server listening on port %d in %s mode", app.get('port'), app.get('env'));
});

module.exports = app;
