var request = require('supertest');
var app = require('../app.js');

describe('GET /', function() {
  it('should return 200 OK', function(done) {
    request(app)
      .get('/')
      .expect(200, done);
  });
});

describe('GET /login', function() {
  it('should return 200 OK', function(done) {
    request(app)
      .get('/login')
      .expect(200, done);
  });
});

describe('POST /subscription/activity', function() {
  it('should return 204 No Content', function(done) {
    request(app)
      .post('/subscription/activity')
      .expect(204, done);
  });
});

describe('GET /badroute', function() {
  it('should return 404 Not Found', function(done) {
    request(app)
      .get('/badroute')
      .expect(404, done);
  });
});
