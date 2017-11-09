'use strict';
var express = require('express');
var router = express.Router();
var client = require('../db/index.js');

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    client.query('SELECT tweets.id, user_id, content, name, picture_url FROM tweets JOIN users ON tweets.user_id=users.id', function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    var username = req.params.username;
    client.query('SELECT tweets.id, user_id, content, name, picture_url FROM tweets JOIN users ON tweets.user_id=users.id WHERE name=$1', [username], function (err, result) {
      if (err) return next(err); // pass errors to Express
      var userTweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: userTweets, showForm: true, username: username });
    });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    var id = req.params.id;
    client.query('SELECT tweets.id, user_id, content, name, picture_url FROM tweets JOIN users ON tweets.user_id=users.id WHERE tweets.id=$1', [id], function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweetsWithThatId = result.rows;
      console.log(tweetsWithThatId)
      res.render('index', { title: 'Twitter.js', tweets: tweetsWithThatId });
    });
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){
    var name = req.body.name;
    var text = req.body.content;
    client.query('SELECT * FROM tweets JOIN users ON tweets.user_id=users.id WHERE users.name=$1', [name], function(err, result){
      if (err) return next(err);
      if (result.rows.length > 0){
        var user = result.rows[0].user_id;
        client.query('INSERT INTO tweets (user_id, content) VALUES ($1, $2)', [user, text]);
      } else {
        client.query('INSERT INTO users (name, picture_url) VALUES ($1, $2)', [name, 'http://i.imgur.com/JKInSVz.jpg']);
        client.query('SELECT * FROM users WHERE name=$1', [name], function(err2, result2){
          if (err2) return next(err2);
          var user2 = result2.rows[0].id;
          client.query('INSERT INTO tweets (user_id, content) VALUES ($1, $2)', [user2, text]);
        });
      }
      client.query('SELECT * FROM tweets JOIN users ON tweets.user_id=users.id WHERE users.name=$1', [name], function(err, result){
        if (err) return console.error(err);
        var newTweet = result.rows[0];
        io.sockets.emit('new_tweet', newTweet);
        res.redirect('/');
      });
    });
  });

  return router;
};
