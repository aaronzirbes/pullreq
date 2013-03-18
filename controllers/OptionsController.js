var _ = require('underscore');
var async =     require('async');

var gitUserService = require("../services/GitUserService.js");
var repoService =    require("../services/RepoService.js");

function requireAuthentication(req, res, next) {
    if (req.session.user_id) {
        next();
    } else {
        res.send(403, {error:'Not Authenticated'});
    }
}

var render = {
    mainPage: function(res, locals) {
        res.render('options.ejs', {
            locals: locals
        });
    }
}

function getAndClearMessage(req) {
    var message = req.session.message;
    delete req.session.message;
    return message;
}

function saveRepos(req, res) {
    if (!req.body.repo) {
        res.redirect('/home');
        return;
    }
    var repos = [].concat(req.body.repo);
    var options = [];
    _.each(repos, function(repoOption) {
        var repo = repoOption.split('/');
            options.push(function(callback) {
                repoService.saveRepoForUser(req.session.user_id, repo[0].toLowerCase(), repo[1].toLowerCase(), function(err, repo) {
                    callback(err, repo);
                });
            });
    }, this);
    repoService.removeReposForUser(req.session.user_id, function(err) {
        async.series(options, function(err, repos) {
            res.redirect('/home');
        });
    });
}

function editRepoPage(req, res) {
    var id = req.session.user_id
    if (id) {
        gitUserService.getGitUserById(id, function(err, gitUser) {
            render.mainPage(res, {
                user: gitUser,
                message: null
            });
        });
    } else {
        render.mainPage(res, {
            user: null,
            message: getAndClearMessage(req)
        });
    }
}

module.exports = function(app) {
    var path = '/options'
    app.all(path + '/*', requireAuthentication);
    app.get(path, editRepoPage);
    app.post(path + '/saveRepos', saveRepos);
};