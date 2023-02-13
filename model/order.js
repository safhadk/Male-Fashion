const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user_details'
    },
    shipping: {
        type: String
    },
    orderId: {
        type: String
    },
    payment: {
        type: String,
        default:"pending"
    },
    payerId:{
      type:String,
    },
    payId:{
      type:String,
    },
    products: [
        {
          product: {
            type: Schema.Types.ObjectId,
            ref: 'products',
            required:true
          },
          quantity: {
            type: Number,
            default: 1,
            required:true
          },total:{
              type:Number,
              default: 0,
              required:true
          }
        }
      ],
    subTotal: {
        type: Number,
         default: 0,
      },totalQuantity:{
        type:Number,
          default: 0,
      },
      discount:{
        type:Number,
      },
      total:{
        type:Number,
      },
      orderDate:{
        type:Date,
        default:Date.now()
      },
      status:{
        type:String,
        default:"processing"
      },
      couponCode:{
        type:String,
        default:"NIL"
      },
      paymentStatus:{
        type:String,
        default:"Not Paid"
      },
    address: [{
        firstname: {
            type: String,
            
        },
        lastname: {
            type: String,
            
        },
        phone: {
            type: Number,
         
        },
        email: {
            type: String,
           
        },
        company: {
            type: String,
        },
        address: {
            type: String,
            
        },
        city: {
            type: String,
            
        },
        state: {
            type: String,
            
        },
        zip: {
            type: Number,
            
        },
        country: {
            type: String,
            
        }
    }]


},
    { versionKey: false }
);
const order = mongoose.model('order', orderSchema);

module.exports = order;
