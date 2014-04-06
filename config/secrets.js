module.exports = {
  db: process.env.MONGODB|| 'mongodb://localhost:27017/fitbit',

  sessionSecret: process.env.SESSION_SECRET || 'Your Session Secret goes here',

  localAuth: false,

  googleAuth: true,
  google: {
    clientID: process.env.GOOGLE_ID || '589128473978-r2uj0tp1jbk021v2qqbm7qjlb9lbvnip.apps.googleusercontent.com',
    clientSecret: process.env.GOOGLE_SECRET || 'LzREjQGNtci7IMmx0WCRQFBp',
    callbackURL: '/auth/google/callback',
    passReqToCallback: true
  },

  fitbitAuth: true,
  fitbit: {
    consumerKey: "fcc857148c61457c8f6fbf70ac1eb7ab",
    consumerSecret: "a04cd399206242c9a51fe5da61aec277",
    callbackURL: "/auth/fitbit/callback",
    passReqToCallback: true
  }

};
