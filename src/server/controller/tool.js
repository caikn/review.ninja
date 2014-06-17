
var async = require('async');
var express = require('express');

//////////////////////////////////////////////////////////////////////////////////////////////
// Tool controller
//////////////////////////////////////////////////////////////////////////////////////////////

var router = express.Router();

router.all('/vote/:uuid/:comm', function(req, res) {

	var Tool = require('mongoose').model('Tool');
	var Repo = require('mongoose').model('Repo');
	var Vote = require('mongoose').model('Vote');

	var uuid = req.params.uuid;
	var comm = req.params.comm;
	var vote = req.body;

	Tool.findOne({'uuid': uuid}, function (err, tool) {

		if (err) {
			return res.send(500);
		}

		if(!tool) {
			return res.send(404, 'Tool not found');
		}

		Vote.findOne({repo: tool.repo, comm: comm, user: 'tool/' + tool.name}, function(err, previousVote) {

			if (err) {
				return res.send(500);
			}

			if(previousVote) {
				return res.send(403);
			}

			Repo.findOne({'uuid': tool.repo}, function(err, repo) {

				if (err || !repo) {
					return res.send(404, 'Repo not found');
				}

				req.github.authenticate({
					type: 'oauth',
					token: tool.token
				});

				req.github.repos.getCommit({user: repo.user, repo: repo.name, sha: comm}, function(err, comm) {

					console.log(arguments);

					if(err) {
						return res.send(err.code, err.message.message);
					}

					var queue = [];

					if(vote.comments) {
						vote.comments.forEach(function(c) {
							queue.push(function(done) {
								req.github.repos.createCommitComment({
									user: repo.user,
									repo: repo.name,
									sha: comm.sha,
									commit_id: comm.sha,
									body: c.body,
									path: c.path,
									line: c.line
								}, done);
							});
						});
					}

					if(vote.vote) {
						queue.push(function(done) {
							req.github.repos.createCommitComment({
								user: repo.user,
								repo: repo.name,
								sha: comm.sha,
								commit_id: comm.sha,
								body: vote.vote + '\n\n' + 'On behalf of ' + tool.name
							}, done);
						});
						queue.push(function(done) {
							Vote.update({repo: repo.uuid, comm: comm.sha, user: 'tool/' + tool.name}, {vote: vote.vote}, {upsert: true}, done);
						});
					}

					async.parallel(queue, function() {
						res.send(200);
					});
				
				});

			});
		});
	});
});

module.exports = router;