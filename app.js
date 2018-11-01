var express = require("express"),
    app     = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose");
    
mongoose.connect("mongodb://localhost:27017/wallet_man_v1", { useNewUrlParser: true });

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", function(req,res){
    res.send("Welcome to My Wallet Manager App");
});

app.get("/login", function(req,res){
    res.send("Login Form will be rendered");
});


app.post("/login", function(req,res){
    res.send("Login logic will be performed and User will be redirected to his/hers Homepage");
});


app.get("/register", function(req,res){
    res.send("Registration Form will be rendered");
});


app.post("/register", function(req,res){
    res.send("Registration logic will be performed and user will directly be logged In and redirected to his/her Homepage");
});


app.get("/home/:id", function(req,res){
    res.send("This will be the Specific User HomePage");
});


app.get("/home/:id/new", function(req,res){
    res.send("This will be the page where User can add a new Transaction that He/She makes for the day");
});


app.post("/home/:id", function(req,res){
    res.send("The transaction will be added to the DB and the User will be redirected to his/her homepage to view the updated data");
});

app.get("/home/:id/history", function(req,res){
    res.send("This will be the page where User can view his/her Transactions history");
});


app.get("/home/:id/category", function(req,res){
    res.send("This will be the page where User can view his/hers expenses in a categorical format");
});


app.listen(process.env.PORT, process.env.IP, function(){
   console.log("The WalletMan Server Has Started!");
});