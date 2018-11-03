var express         = require('express'),
    app             = express(),
    bodyParser      = require('body-parser'),
    ejs             = require('ejs'),
    mongoose        = require('mongoose'),
    flash           = require("connect-flash"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    User            = require('./models/user'),
    Transaction     = require('./models/transaction'),
    Category        = require('./models/category'),
    middlewareObj      = require('./middleware');

//MongoDB Configuration
mongoose.connect('mongodb://localhost:27017/users',{useNewUrlParser:true});

//bodyParser Configuration
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine','ejs');
app.use(flash());

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Hack NJIT is awesome!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

// INDEX ROUTES

app.get('/',(req,res)=>{
     res.render('landing');
})

app.get('/login',(req,res)=>{
    res.render('login');
})

app.get('/register',(req,res)=>{
    res.render('register')
})

app.post('/login',passport.authenticate('local',{
    successRedirect:'/home/',
    failureRedirect:'/login'
}),(req,res)=>{});

app.post('/register', (req, res) => {
    var newUser = new User({
        'username':req.body.username,
    });
    User.register(newUser,req.body.password,(err,user)=>{
        if(err){
            res.redirect('/register');
        }else{
            passport.authenticate('local')(req,res,()=>{
                res.redirect('/home/'+user._id);
            });
        }
    });
});

app.get("/logout", function(req, res){
   req.logout();
   res.redirect("/");
});

// USER ROUTES

app.get('/home/',(req,res)=>{
    var user_id = res.locals.currentUser.id;
    res.redirect("/home/" + user_id);
});

app.get('/home/:id', (req, res) => {
    
    // 2018-11-03T07:56:44.193Z
    // new Date("11/20/2014 04:11") 
    
    // var event = new Date('August 19, 1975 23:15:30');
    //Transaction.find().where('user.id').equals(req.params.id).exec(function(err, transactionList){
    Transaction.find({
        'user.id' :req.params.id,
        'date'    : {$gte:new Date().getMilliseconds()}},
        function(err, transactionList){
        if(err){
            console.log(err);
            req.flash("error", "Something Went Wrong");
            res.redirect("/");
        }else{
            Category.find({'user.id':req.params.id}, function(err,categoryList){
                if(err){
                    console.log(err);
                    req.flash("error", "Something Went Wrong");
                    res.redirect("/");
                }else{
                    
                    console.log(transactionList)
                    var maxAmount = 0;
                    var maxCategoryName = "Null";
                    var categoryAmount = [];
                    var categoryName = [];
                    
                    for(var i =0;i<categoryList.length;i++){
                        categoryName.push(categoryList[i].name);
                        categoryAmount.push(0);
                    }
                    
                    for(var trans in transactionList){
                        for(var cat in categoryList){
                            if(transactionList[trans].category.name===categoryList[cat].name){
                                categoryAmount[cat]+=transactionList[trans].amount
                            }
                        }
                    }
                    
                    for(var cat in categoryAmount){
                        if(categoryAmount[cat] > maxAmount ){
                            maxAmount = categoryAmount[cat]
                            maxCategoryName = categoryName[cat]
                        }
                    }
                    
                    
                //console.log(transactionList);
                //console.log(categoryList);
                //console.log(maxCategoryName); // Not getting Object
                //console.log(maxAmount); // Not getting Object
                console.log(categoryName);
                console.log(categoryAmount);// Not getting Object
                
                res.render('home', {
                        transactionList:transactionList,
                        categoryList:categoryList,
                        maxCategoryName:maxCategoryName,
                        maxAmount:maxAmount,
                        categoryName:categoryName,
                        categoryAmount:categoryAmount
                    });
                }
            })
        }
    })
})
            


app.get("/home/:id/new", function(req, res) {
    Category.find({'user.id':req.params.id}, function(err, categoryList) {
        if(err){
            console.log(err);
        }else{
            res.render('new', {categoryList:categoryList});
        }
    });
});

app.post('/home/:id/new', (req, res) => {
    Category.find({'user.id':req.params.id, 'category.name':req.body.category},function(err,category){
        if(err){
            console.log(err)
            res.send("Error")
        }else{
            console.log(category)
            Transaction.create({
                'user.username':req.body.username,
                'user.id':req.params.id,
                'amount':req.body.amount,
                'date':Date.now(),
                'category.name':req.body.category,
                'category.id':category.id,
                'description':req.body.description
            },function(err,transaction){
              if(err){
                  console.log(err);
              }else{
                  res.redirect('/home/'+req.params.id);
              }
            });
        }
    });
});

app.get('/home/:id/insertCategory',(req,res)=>{
    Category.find({'user.id':req.params.id},function(err, categoryList) {
        if(err){
            console.log(err)
        }else{
            res.render('insertCategory',{'categoryList':categoryList});
        }
    })
});

app.post('/home/:id/newCategory',(req,res)=>{
    Category.create({
        'name':req.body.categoryName,
        'user.id':req.params.id
    },function(err,category){
        if(err){
            res.send(err);
        }else{
         res.redirect('/home/'+req.params.id);
        }
    });
});

app.listen(process.env.PORT, process.env.IP, function(){
   console.log("The WalletMan Server Has Started!");
});