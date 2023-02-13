const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CouponSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    quantity: {
        type: Number,
        required:true
    },
    percentage: {
        type: Number,
    },
    amount: {
        type: Number,
    },
    minSpend: {
        type: Number,
    },
    maxDiscount: {
        type: Number,
    },
    used: {
        type: Number,
        default: 0
    },
    perCustomer: {
        type: Number,
    }
}, 
{ versionKey: false }
);
const Coupon = mongoose.model('coupon', CouponSchema);

module.exports = Coupon;
