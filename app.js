
var http = require('http');

//////////////////////////////////////////////////////////////////////////////////////////////
// Crash Report
//////////////////////////////////////////////////////////////////////////////////////////////

if(process.env.NODE_ENV === 'production') {

	// Log to rollbar

	var rollbar = require('rollbar');

	rollbar.handleUncaughtExceptions('51d783b209fd4c24927dc5e0b1270aef', {
		exitOnUncaughtException: false
	});	

}

//////////////////////////////////////////////////////////////////////////////////////////////
// Lift sails
//////////////////////////////////////////////////////////////////////////////////////////////

var app = require('./src/server/app.js');

http.createServer(app).listen(60000).on('listening', function() {

});