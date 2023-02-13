//requiring mongoose npm module

const mongoose = require('mongoose');

//schema for products

const product = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    // unique:true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true
  },
   size: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  image: {
    type: Array,
    required: true
  },
  blocked: {
    type: Boolean,
    default: false,
  },
  Date:{
    type:Date,
    default:Date.now()
  }
},
  {versionKey:false}
);

//exporting schema

const User = mongoose.model('products', product);

module.exports = User;