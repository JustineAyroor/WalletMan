var user = require("../models/user")
var passport = require("passport")
var localStrategy = require("passport-local")
var middlewareObj={}

middlewareObj.isLoggedIn = function(req,res,next){
    if(req.isAuthenticated){
        return next()
    }
    res.redirect("/login")
}

module.exports = middlewareObj