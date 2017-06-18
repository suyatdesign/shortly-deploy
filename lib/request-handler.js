var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../app/config');
var User = require('../app/models/user');
var Link = require('../app/models/link');


exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Link.find({}).exec(function(err, links) {
    console.log('fetchlinks: ',links);
    res.status(200).send(links);
  });
};

var createSha = function(url) {
  // console.log('createSha request handler');
  var shasum = crypto.createHash('sha1');
  // console.log('line 39', url);
  // console.log(shasum);
  shasum.update(url);
  // console.log('line 41');
  return shasum.digest('hex').slice(0, 5);
  // console.log('line 43');
  //next();
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;
  // console.log(req.body.url, uri);

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  Link.findOne({ url: uri}).exec(function(err, found) {

    if (found) {
      //console.log('find', found);
      res.status(200).send(found);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }
        // console.log(uri);
        // console.log('createSHa', createSha)
        var code = createSha(uri);
        // console.log('made a code: ',code, typeof code);
        var newLink = new Link({
          url: uri,
          title: title,
          code: code,
          baseUrl: req.headers.origin,
          visits: 0
        });

        console.log(newLink)

        newLink.save(function(err, newLink) {
          if (err) {
            console.log('error on saveLink');
            res.status(500).send(err);
          } else {
            // console.log('saved');
            //res.status(200).send(newLink);
            res.send(200, newLink);
          }
        });
      });
    }
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({ username: username })
    .exec(function(err, user) {
      if (!user) {
        res.redirect('/login');
      } else {
        User.comparePassword(password, user.password, function(err, match) {
          if (match) {
            util.createSession(req, res, user);
          } else {
            res.redirect('/login');
          }
        });
      }
    });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({ username: username })
    .exec(function(err, user) {
      if (!user) {
        var cipher = Promise.promisify(bcrypt.hash);
        return cipher(password, null, null).bind(this)
          .then(function(hash) {
            console.log('look at me im in the then');
            password = hash;
            var newUser = new User({
              username: username,
              password: password
            });
            newUser.save(function(err, newUser) {
              if (err) {
                res.status(500).send(err);
              }
              util.createSession(req, res, newUser);
            });
            next();
          });

      } else {
        console.log('Account already exists');
        res.redirect('/signup');
      }
    });
};

exports.navToLink = function(req, res) {
  Link.findOne({ code: req.params[0] }).exec(function(err, link) {
    if (!link) {
      res.redirect('/');
    } else {
      link.visits++;
      link.save(function(err, link) {
        res.redirect(link.url);
        return;
      })
    }
  });
};