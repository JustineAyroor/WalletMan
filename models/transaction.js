var mongoose = require('mongoose');

var transactionSchema = mongoose.Schema({
    'date':{ type: Date, default: Date.now },
    'amount':Number,
    'description': String,
    'user':{
    id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
    'category':{
    id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Category"
      },
    name: String
   },
});

module.exports = mongoose.model('Transaction',transactionSchema);