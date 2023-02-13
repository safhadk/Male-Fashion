
//requiring mongoose npm module

const mongoose = require('mongoose');

//schema for category

const category = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique:true
  },
  description: {
    type: String,
    required: true
  },
  Date:{
    type:Date,
    default:Date.now()
  }},
  {versionKey:false}
);

//exporting schema

const User = mongoose.model('category', category);

module.exports = User;