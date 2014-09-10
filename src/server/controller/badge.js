var express = require('express'),
    ejs = require('ejs'),
    fs = require('fs');

//////////////////////////////////////////////////////////////////////////////////////////////
// Badge controller
//////////////////////////////////////////////////////////////////////////////////////////////

var router = express.Router();

router.all('/:repoId/badge', function(req, res) {
    res.set('Content-Type', 'image/svg+xml');
    var tmp = fs.readFileSync("src/server/templates/badge.svg", 'utf-8');
    var svg = ejs.render(tmp, {});
    res.send(svg);
});

router.all('/:repoId/pull/:number/badge', function(req, res) {
    res.set('Content-Type', 'image/svg+xml');
    var tmp = fs.readFileSync("src/server/templates/badge.svg", 'utf-8');
    var svg = ejs.render(tmp, {});
    res.send(svg);
});

module.exports = router;
