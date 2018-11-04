var express         = require('express'),
    app             = express(),
    moment          = require('moment'),
    bodyParser      = require('body-parser'),
    ejs             = require('ejs'),
    mongoose        = require('mongoose'),
    flash           = require("connect-flash"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    User            = require('./models/user'),
    Transaction     = require('./models/transaction'),
    Category        = require('./models/category'),
    middleware      =  require('./middleware');

//MongoDB Configuration
mongoose.connect('mongodb://localhost:27017/users',{useNewUrlParser:true});

//bodyParser Configuration
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine','ejs');
app.use(express.static(__dirname + "/public"));
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

// Render login page
app.get('/login',(req,res)=>{
    res.render('login');
})

// Render registration page
app.get('/register',(req,res)=>{
    res.render('register')
})

// Login user
app.post('/login',passport.authenticate('local',{
    successRedirect:'/home/',
    failureRedirect:'/login'
}),(req,res)=>{});

// Register new user
app.post('/register', (req, res) => {
    var newUser = new User({
        'username':req.body.username,
    });
    User.register(newUser,req.body.password,(err,user)=>{
        if(err){
            res.redirect('/register');
        }else{
            passport.authenticate('local')(req,res,()=>{
                var basicCategories = ["Food","Shopping","Entertainment","Bills"]
                basicCategories.forEach(function(category) {
                    Category.create({
                        'name':category,
                        'user.id':user._id
                    },function(err, transaction) {
                        if(err){
                            console.log(err)
                        }else{
                            
                        }
                    })
                })
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

// Render home page
//  $gte : moment().utc().startOf('day').toDate(),
            // $lte : moment().utc().endOf('day').toDate()
app.get('/home/:id', function(req, res) {
    Transaction.find({
        'user.id' :req.params.id,
        'date'    : {
            $gte : moment().startOf('days').toDate(),
            $lte : moment().endOf('days').toDate()
        }},
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
                    var maxAmount = 0;
                    var maxCategoryName = "Null";
                    var categoryAmount = [];
                    var categoryName = [];
                    var totalAmount = 0;
                    
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
                        totalAmount+=transactionList[trans].amount
                    }
                    
                    for(var cat in categoryAmount){
                        if(categoryAmount[cat] > maxAmount ){
                            maxAmount = categoryAmount[cat]
                            maxCategoryName = categoryName[cat]
                        }
                    }
                    
                res.render('home', {
                        transactionList:transactionList,
                        categoryList:categoryList,
                        maxCategoryName:maxCategoryName,
                        maxAmount:maxAmount,
                        categoryName:categoryName,
                        categoryAmount:categoryAmount,
                        totalAmount:totalAmount
                    });
                }
            });
        }
    });
});
            

// Render form for new transaction
app.get("/home/:id/new", function(req, res) {
    Category.find({'user.id':req.params.id}, function(err, categoryList) {
        if(err){
            console.log(err);
        }else{
            res.render('new', {categoryList:categoryList});
        }
    });
});

// Add new transaction
app.post('/home/:id/new', function(req, res) {
    Category.find({'user.id':req.params.id, 'category.name':req.body.category},function(err,category){
        if(err){
            console.log(err)
            res.send("Error")
        }else{
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

// Render page to add new category
app.get('/home/:id/insertCategory',(req,res)=>{
    Category.find({'user.id':req.params.id},function(err, categoryList) {
        if(err){
            console.log(err);
        }else{
            res.render('insertCategory',{'categoryList':categoryList});
        }
    });
});


// Add new category
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

app.get("/home/:id/history",function(req, res) {
    Transaction.find({'user.id':req.params.id},function(err, transactionList) {
        if(err){
            console.log(err)
        }else{
            Category.find({'user.id':req.params.id}, function(err,categoryList){
               if(err){
                   console.log(err)
               }else{
                    var categoryAmount = [];
                    var categoryName = [];
            
                    for(var i =0;i<categoryList.length;i++){
                        categoryName.push(categoryList[i].name);
                        categoryAmount.push(0);
                    }
                    
                    for(var trans in transactionList){
                        for(var cat in categoryList){
                            if(transactionList[trans].category.name===categoryList[cat].name){
                                categoryAmount[cat]+=transactionList[trans].amount;
                            }
                        }
                    }
                    res.render('history',{"allTime":transactionList,"categoryAmount":categoryAmount,"categoryName":categoryName});    
                }
            });
        }
    });
});

app.post("/home/:id/history",function(req,res){
    
});

// Server listen
app.listen(process.env.PORT, process.env.IP, function(){
   console.log("The WalletMan Server Has Started!");
});