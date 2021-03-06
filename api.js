fs = require('fs');
var Teams = require('./models/team.js');

module.exports = function(app, passport){

    app.get('/api/users/', isAdmin, function(req, res){
        Teams.find({}, function(err, teams){

            if (err) {
                throw err;
            }else{
                var content = [];
                teams.forEach(function (team) {
                    content.push(team.local);
                });
                res.setHeader('content-type', 'application/json');
                res.send(JSON.stringify(content));
            }
        });
    });

    app.get('/api/leaderboard/', isLoggedIn, function(req, res){
        var Teams = require('./models/team.js');
        var query = Teams.find({});

        query.select('local.username local.game.score');

        query.exec(function(err, teams){

            if (err) {
                throw err;
            }else{
                var content = [];
                teams.forEach(function (team) {
                    if (team.local.username != 'admin')
                        content.push(team.local);
                });
                content.sort(function(a, b){
                    return b.game.score - a.game.score;
                });
                res.setHeader('content-type', 'application/json');
                res.send(JSON.stringify(content));
            }
        });
    });

    
    app.get('/api/question/', isLoggedIn, function(req, res){

        var Game = JSON.parse(fs.readFileSync('./config/questions.json'));
        var content = [];
        if (Game[req.user.local.game.level]) {
            content.push(Game[req.user.local.game.level].question);
        }
        res.setHeader('content-type', 'application/json');
        res.send(JSON.stringify(content));
    });


    app.get('/api/news', isLoggedIn, function(req, res){
        var News = require('./models/news.js');
        News.find({}).sort('-updated').exec(function (err, news){
            res.setHeader('content-type', 'application/json');
            res.send(news);
        });
    });


    app.get('/api/questions', isAdmin, function(req, res){
        var Question = require('./models/question.js');
        Question.find({}).sort('-updated').exec(function (err, question){
            res.setHeader('content-type', 'application/json');
            res.send(question);
        });
    });


    app.get('/api/time', isLoggedIn, function(req, res){
        var game = JSON.parse(fs.readFileSync('./config/game.json'));
        var ms = new Date(game.time.start).valueOf() +
            Number(game.time.initial) +
            req.user.local.game.time;
        var time = new Object();
        time.initial = new Date(Number(game.time.initial)).valueOf();
        time.start = new Date(game.time.start).valueOf();
        time.left = new Date(ms) - Date.now();
        time.elapsed = Date.now() - new Date(game.time.start);
        time.user = req.user.local.game.time;
        
        res.setHeader('content-type', 'application/json');
        res.send(time);
    });
    

    app.post('/api/set/status/:status/:username', isAdmin, function(req, res){
        var query = { 'local.username': req.params.username };
        var update = {
            $set: {'local.status': req.params.status}
        };
        var opts = { strict: false };

        Teams.update(query, update, opts, function (err) {
            if (err) {
                res.send('error');
            } else {
                res.send('done');
            }
        });
    });

    app.post('/api/delete/all/:what', isAdmin, function(req, res){
        switch (req.params.what){
            case 'users':
                Teams.remove({}, function(){
                    res.send('All deleted');
                });
                break;
            case 'news':
                var News = require('./models/news.js');
                News.remove({}, function(){
                    res.send('All deleted');
                });
                break;
            case 'questions':
                var Questions = require('./models/question.js');
                Questions.remove({}, function(){
                    res.send('All deleted');
                });
                break;
            default:
                res.send('Wrong options');
        }
    });
}


function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.send();
}

function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.local.username == "admin") {
        return next();
    }
    res.send();
}
