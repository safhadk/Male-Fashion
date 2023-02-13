//requiring mongoose npm module

const mongoose = require('mongoose');

//schema for users / signup details

const users = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  password2: {
    type: String,
    required: true
  },
  blocked: {
    type: Boolean,
    default: false,
  },
  phoneNumber:{
    type:String ,
    required:true
  },
  joined_date: {
    type: Date,
    default: Date.now
  }
},
 { versionKey: false }
);

//exporting schema


const User = mongoose.model('User_details', users);

module.exports = User;