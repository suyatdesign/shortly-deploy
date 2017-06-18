var mongoose = require('mongoose');

mongoURL = 'mongodb://localhost/shortlydb';
mongoose.connect(mongoURL);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', function () {
  console.log('mongdb connection established to shortly db');
});

module.exports = db;

