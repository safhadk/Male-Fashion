
//requiring mongoose npm module

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const wishlistSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user_details'
    },
    items: [
        {
            product: {
                type: Schema.Types.ObjectId,
                ref: 'products',
            }
        }
    ],
},
    { versionKey: false }
);
const wishlist = mongoose.model('wishlist', wishlistSchema);

module.exports = wishlist;
