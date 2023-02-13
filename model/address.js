

//requiring mongoose npm module
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const addressSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user_details'
  },
  firstname:{
    type:String,
    required:true
  },
  lastname:{
    type:String,
    required:true
  },
  phone:{
    type:Number,
    required:true
  },
  email:{
    type:String,
    required:true
  },
  company:{
    type:String,
  },
  address:{
    type:String,
    required:true
  },
  city:{
    type:String,
    required:true
  },
  state:{
    type:String,
    required:true
  },
  zip:{
    type:Number,
    required:true
  },
  country:{
    type:String,
    required:true
  }
 

},
{versionKey:false}
);
const User = mongoose.model('address', addressSchema);

module.exports = User;
