// var db = require('../config');
var crypto = require('crypto');
var mongoose = require('mongoose');

var linkSchema = mongoose.Schema({
  visits: Number,
  title: String,
  code: String,
  baseUrl: String,
  url: String
});

var Link = mongoose.model('Link', linkSchema);

var createSha = function(url) {
  console.log('CreateShaw for URL', url)
  var shasum = crypto.createHash('sha1');
  shasum.update(url);
  return shasum.digest('hex').slice(0, 5);
};

linkSchema.pre('save', function(next) {
  console.log('pre validate');
  var code = createSha(this.url);
  this.code = code;
  next();
});

module.exports = Link;
