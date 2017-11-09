var pg = require('pg');
var postgresURL = 'postgres://localhost:5432/twitterdb';
var client = new pg.Client(postgresURL);

client.connect();

module.exports = client;
