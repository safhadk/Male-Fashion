//requiring mongoose npm module

const mongoose = require('mongoose');

//schema for products

const Schema = mongoose.Schema;

const banner = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: Array,
    required: true
  },
  url:
  {
    type: String,
    required:true
  },
  blocked: {
    type: Boolean,
    default: false,
  },
  Date: {
    type: Date,
    default: Date.now()
  }
},
  { versionKey: false }
);

//exporting schema

const Banner = mongoose.model('banner', banner);

module.exports = Banner;