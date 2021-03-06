// Configuration file for passportJS

var LocalStrategy = require('passport-local').Strategy;
var Team = require('../models/team.js');
var validate = require('validator');


module.exports = function(passport){

    // Specify a local strategy for passport login
    passport.use('local-login', new LocalStrategy(
        
        {
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },

        function(req, username, password, done){

            // Validate user data
            var error = 0;
            username = validate.trim(username);
            username = username.toLowerCase();
            error += validate.isEmpty(username);
            error += validate.isEmpty(password);


            if (!error) {

                Team.findOne({'local.username': username }, function(err, team){

                    if (err) {
                        return done(err);
                    }
                    
                    if (!team) {
                        // Team not found
                        return done(null, false);
                    }
                    
                    if (!team.validPassword(password)) {
                        // Wrong password
                        return done(null, false);
                    }

                    return done(null, team);
                });
            } 
            else
                return done(null, false);
        }
    ));


    // Specify a local strategy for passport logout
    passport.use('local-signup', new LocalStrategy(
        
        {
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },

        function(req, username, password, done){

            // Validate user data
            var error = 0;
            username = validate.trim(username);
            username = username.toLowerCase();
            error += validate.isEmpty(username);
            error += validate.isEmpty(password);


            if (!error) {
                
                Team.findOne({'local.username': username}, function(err, team){

                    if (err) {
                        return done(err);
                    }

                    if (team) {
                        // Team already registered
                        return done(null, false);
                    }
                    else{

                        var newTeam = new Team();
                        newTeam.local.username = username;
                        newTeam.local.password = newTeam.generateHash(password);

                        newTeam.save(function(err){
                            if (err) {
                                throw err;
                            }
                                return done(null, newTeam);
                        });
                    }
                });
            }else
                return done(null, false);
        }
    ));


    // Specify serialize and deserialize methods for passport
    passport.serializeUser(function(team, done){
        
        // Can use tokens in the future
        done(null, team.id);
    });

    passport.deserializeUser(function(id, done){
        
        // retrieve team from the info
        Team.findById(id, function (err, team) {
            done(err, team);
        });
    });

};
