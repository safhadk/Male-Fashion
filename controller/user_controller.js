const user = require('../model/signup')
const category = require('../model/category')
const products = require('../model/products')
const cart = require('../model/cart')
const address = require('../model/address')
const coupon = require('../model/coupon')
const paypal = require('@paypal/checkout-server-sdk')
const banners = require('../model/banner')
const wishlists = require('../model/wishlist')
const envirolment = process.env.NODE_ENV === "production"
    ? paypal.core.LiveEnvironment
    : paypal.core.SandboxEnvironment;
const paypalCliend = new paypal.core.PayPalHttpClient(
    new envirolment(process.env.paypalclientid, process.env.PAYPAL_CLIENT_SECRET)
);
const twilio = require('twilio')
const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const bcrypt = require('bcrypt')
const moment = require("moment");
const Coupon = require('../model/coupon')
const order = require('../model/order')
const { PhoneNumberInstance } = require('twilio/lib/rest/lookups/v2/phoneNumber')
const { ObjectId } = require('mongodb')


//user home

const userhome = async (req, res) => {
    try {
        a = "63bf48297289a661b982166c"
        console.log(typeof (a))
        a = ObjectId(a)
        console.log(typeof (a))
        const banner = await banners.find({}).sort({ Date: -1 })
        const product = await products.find({}).sort({ Date: -1 }).limit(8)
        const { login, userId } = req.session
        const userCart = await cart.findOne({ user: userId })
        console.log(userId + " 7563")
        if (userCart) {
            console.log("finded")
            const { grandTotal, cartquantity } = userCart
            console.log(cartquantity + " " + grandTotal);
            req.session.cartQuantity = cartquantity
            req.session.grandTotal = grandTotal
            res.render('user/user_home', { message: login, banner, product, cartquantity, grandTotal })
        } else {
            res.render('user/user_home', { message: login, banner, product })
        }
    } catch (error) {
        console.error(`Error in userhome: ${error.message}`);
        res.render('user/something-wrong');
    }
}

//user login page

const loginpage = (req, res) => {
    try {
        const { login } = req.session
        if (login) {
            res.redirect('/')
        } else {
            const { loginerror, loginblock } = req.session
            res.render('user/user_login', { message: loginerror, userblock: loginblock })
            req.session.loginblock = false
            req.session.loginerror = false
        }
    } catch (error) {
        console.error(`Error in loginpage: ${error.message}`);
        res.render('user/something-wrong');
    }
}

//user signup page

const signup = (req, res) => {
    try {
        const { login } = req.session
        if (login) {
            res.redirect('/')
        } else {
            const { userexist } = req.session
            res.render('user/user_signup', { userexist: userexist })
            req.session.userexist = false;
        }
    } catch (error) {
        console.error(`Error in signup: ${error.message}`);
        res.render('user/something-wrong');
    }
}

//signup post

const postsignup = async (req, res) => {
    try {
        const { email, name, phoneNumber, password, password2 } = req.body
        const userexist = await user.findOne({ email: email })
        if (userexist) {
            req.session.userexist = true
            res.redirect('/signup')
        } else {
            // const generateOTP = () => {
            //     let randomotp = '';
            //     for (let i = 0; i < 6; i++) {
            //         randomotp += Math.floor(Math.random() * 10);
            //     }
            //     return randomotp;
            // };
            // const randomotp = generateOTP()
            // req.session.otp = randomotp;
            // client.messages.create({
            //     body: `Hi ${name} YOUR OTP IS ${randomotp}`,
            //     to: `+91 ${phoneNumber}`,
            //     from: process.env.TWILIO_PHONE_NUMBER
            // }).then(message => {
            //     req.session.password = password
            //     req.session.password2 = password2
            //     req.session.email = email
            //     req.session.name = name
            //     req.session.phoneNumber = phoneNumber
            //     res.render('user/verifyotp', { phoneNumber: phoneNumber });
            // }).catch(error => {
            //     console.error(error)
            //     res.redirect('/signup')
            // })
            client.verify.v2.services('VA31d3b9a2dea46eadd0aa4eb0fe70eb7a')
                .verifications
                .create({ to: `+91${phoneNumber}`, channel: 'sms' })
                .then(verification => {
                    req.session.password = password
                    req.session.password2 = password2
                    req.session.email = email
                    req.session.name = name
                    req.session.phoneNumber = phoneNumber
                    res.render('user/verifyotp', { phoneNumber: phoneNumber });
                })
                .catch(error => {
                    console.error(error)
                    req.session.checkInternet = true
                    res.redirect('/signup')
                })
        }
    } catch (error) {
        console.log(`Error in postsignup: ${error.message}`)
        res.render('user/something-wrong')
    }
}

//otp verification

const verifyotp = async (req, res) => {
    try {
        const { name, email, password, password2, phoneNumber } = req.session
        const { otp } = req.body
        client.verify.v2.services('VA31d3b9a2dea46eadd0aa4eb0fe70eb7a')
            .verificationChecks
            .create({ to: `+91${phoneNumber}`, code: otp })
            .then (async verification_check  => {
                if (verification_check.status == "approved") {
                    const hashedpassword = await bcrypt.hash(password, 10)
                    const hashedconfirmpassword = await bcrypt.hash(password2, 10)
                    await user.create({
                        name: name,
                        email: email,
                        password: hashedpassword,
                        password2: hashedconfirmpassword,
                        phoneNumber: phoneNumber
                    })
                    req.session.otpverified = true
                    res.redirect('/login')
                } else if (verification_check.status == "pending") {
                    req.session.resetinvalidotp = true
                    res.redirect('/verifyotp')
                } else {
                    res.redirect('/signup')
                }
            })
    } catch (error) {
        console.error(`Error in verifyotp: ${error.message}`)
        res.render('user/something-wrong')
    }
}

//otp page

const getverifyotp = (req, res) => {
    try {
        const { invalidotp, otpverified, login } = req.session
        if (invalidotp && !otpverified) {
            res.render('user/verifyotp')
        } else if (login) {
            res.redirect('/')
        } else {
            res.redirect('/signup')
        }
    } catch (error) {
        console.error(`Error in getverifyotp: ${error.message}`)
        res.render('user/something-wrong')
    }
}

// login post

const loginpost = async (req, res) => {
    try {
        const { email, password } = req.body
        req.session.profile = email
        const userdetails = await user.findOne({ email })
        if (userdetails) {
            const { _id } = userdetails
            req.session.profileId = _id
            req.session.userId = _id
            bcrypt.compare(password, userdetails.password, (err, data) => {
                if (err) {
                    console.error(`Error in password Bcrypt in loginpost: ${err.message}`)
                }
                else if (data) {
                    if (userdetails.blocked) {
                        req.session.loginblock = true
                        res.redirect('/login')
                    } else {
                        req.session.loginuser = true;
                        req.session.login = true
                        res.redirect('/')
                    }
                } else {
                    req.session.loginerror = true
                    res.redirect('/login')
                }
            })
        }
        else {
            req.session.loginerror = true
            res.redirect('/login')
        }
    } catch (error) {
        console.error(`Error in loginpost: ${error.message}`)
        res.render('user/something-wrong')
    }
}

//user logout

const logout = (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/login')
    } catch (error) {
        console.error(`Error in logout: ${error.message}`)
        res.render('user/something-wrong')
    }
}

//user shop page for buying products

const getusershop = async (req, res) => {
    try {
        const getallcategory = await category.find({}, { name: 1, _id: 0 })
        const getallproductdetails = await products.find({}).sort({ Date: -1 })
        const { userId, login } = req.session
        console.log(userId + " " + login)
        const userCart = await cart.findOne({ user: userId })
        console.log(userCart)
        let cartQuantity;
        let grandTotal;
        if (userCart) {
            cartQuantity = userCart.cartquantity
            grandTotal = userCart.grandTotal
        }
        res.render('user/shop', { getallcategory, getallproductdetails, message: login, cartQuantity, grandTotal })
    } catch (error) {
        console.error(`Error in getusershop: ${error.message}`)
        res.render('user/something-wrong')
    }
}

//user product detailpage

const productdetailpage = async (req, res) => {
    try {
        const { id } = req.params
        let productdetails;
        productdetails = await products.findOne({ _id: (id) })
        let category;
        if (productdetails) {
            category = productdetails.category
            req.session.temp = productdetails._id;
        } else {
            const { temp } = req.session
            productdetails = await products.findOne({ _id: (temp) })
        } const { userId, login, addedtocart } = req.session
        const userCart = await cart.findOne({ user: userId })
        let cartQuantity;
        let grandTotal;
        if (userCart) {
            cartQuantity = userCart.cartquantity
            grandTotal = userCart.grandTotal
        }
        const relatedProduct = await products.find({ category: category }).sort({ Date: -1 }).limit(4)
        console.log("related product")
        console.log(relatedProduct)
        res.render('user/product_detailpage', { productdetails, login: login, addedtocart: addedtocart, cartQuantity, grandTotal, relatedProduct })
        req.session.addedtocart = false

    } catch (error) {
        if (error.message.includes('Cast to ObjectId failed for value')) {
            const { temp } = req.session
            res.redirect(`/productdetail/${temp}`);
        } else {
            console.error(`Error in productdetailpage : ${error.message}`)
            res.render('user/something-wrong')
        }
    }
}

//user profile

const account = async (req, res) => {
    try {
        const { login, userId, cartQuantity, grandTotal } = req.session
        const count = await order.find({ user: userId }).count()
        req.session.ordercount = count
        const profiledata = await user.findOne({ _id: userId })
        if (profiledata) {
            const formattedDate = moment(profiledata.joined_date).format("MMM DD YYYY");
            req.session.joinedDate = formattedDate
            req.session.userName = profiledata.name
            const numberOfOrders = await order.find({ user: userId }).count()
            const wishlist = await wishlists.findOne({ user: userId })
            let wishlistCount;
            if (wishlist) {
                const items = wishlist.items
                wishlistCount = items.length
                req.session.wishlistCount = wishlistCount
                console.log(wishlistCount + " count is this")
            } else {
                wishlistCount = 0
            }
            res.render('user/account', { message: login, profiledata, formattedDate, cartQuantity, grandTotal, numberOfOrders, wishlistCount })
        } else {
            throw new Error(`no profiledata`)
        }
    } catch (error) {
        console.error(`Error in account : ${error.message}`)
        res.render('user/something-wrong')
    }
}

//profile update

const updateprofile = async (req, res) => {
    try {
        const { name, email, phoneNumber } = req.body
        const { userId } = req.session
        await user.updateOne({ _id: userId }, {
            $set: {
                name: name,
                email: email,
                phoneNumber: phoneNumber
            }
        })
        res.redirect('/account')
    } catch (error) {
        console.error(`Error in updateprofile : ${error.message}`)
        res.render('user/something-wrong')
    }
}

//add to cart

const addToCart = async (req, res) => {
    try {
        const { login } = req.session
        const usercartid = req.session.profileId;
        const { quantity } = req.body;
        console.log(quantity + " " + "morning")
        const productId = req.params.id;
        const product = await products.findOne({ _id: productId });
        const price = product.price;
        const total = quantity * price;
        const cartexist = await cart.findOne({ user: usercartid });
        const existproduct = await cart.findOne({ user: usercartid, "items.product": productId });
        if (cartexist && existproduct) {
            console.log("cart existed and product existed checked success")
            await cart.updateOne({ user: usercartid, "items.product": productId }, { $inc: { "items.$.quantity": quantity, "items.$.total": total, grandTotal: total, cartquantity: quantity, finalTotal: total } });
            res.redirect('/cart');
        } else if (cartexist && !existproduct) {
            console.log("iam here checked success")
            await cart.updateOne({ user: usercartid }, { $push: { items: { product: productId, quantity: quantity, total: total } }, $inc: { grandTotal: total, cartquantity: quantity, finalTotal: total } });
            res.redirect('/cart');
        } else if (login && !cartexist && !existproduct) {
            console.log("loged in no cart no product checked succcess")
            const usercart = await cart.create({
                user: usercartid,
                items: [
                    {
                        product: productId,
                        quantity: quantity,
                        total: total
                    }
                ],
                grandTotal: total,
                cartquantity: quantity,
                discount: 0,
                finalTotal: total,
            });
            req.session.grandtotal = usercart.grandTotal;
            res.redirect('/cart');
            req.session.addedtocart = true;
        } else {
            throw new Error("Not match any if error");
        }
    } catch (error) {
        console.error(`Error in addToCart: ${error.message}`);
        res.render('user/something-wrong');
    }
};

//cart 

const getcart = async (req, res) => {
    try {
        const { loginuser } = req.session
        userpersonalid = req.session.profileId
        req.session.appliedCode = false;
        console.log(req.session.appliedCode + " 8967656")
        const usercart = await cart.findOne({ user: userpersonalid }).populate("items.product", "image price name");
        let cartdetails;
        let emptyCart;
        if ((!usercart) || (usercart.quantity == 0)) {
            req.session.emptyCart = true
        } else {
            req.session.emptyCart = false
        }
        if (usercart) {
            console.log("cart finded")
            cartdetails = usercart.items
            if (usercart.cartquantity == 0) {
                emptyCart = true
                console.log("empty 0")
            }
        } else {
            emptyCart = true
            console.log(" full empty ")
        }
        console.log(emptyCart + " " + "boolean")
        res.render('user/cart', { cartdetails, usercart, userlogin: loginuser, emptyCart })
    } catch (error) {
        console.log(`Error in getcart: ${error.message}`)
        res.render('user/something-wrong')
    }
}

//checkout

const checkout = async (req, res) => {
    try {
        const { login, cartQuantity } = req.session
        const popular = await products.find({}).sort({ Date: -1 }).limit(3)
        userpersonalid = req.session.profileId
        const savedAddress = await address.findOne({ user: userpersonalid })
        const checkout = await cart.findOne({ user: userpersonalid })
        finalTotal = req.session.finalTotal
        couponApplied = req.session.coupon
        if (!couponApplied) {
            await cart.updateOne({ user: userpersonalid }, {
                $set: {
                    discount: 0,
                }
            })
            console.log(req.session.emptyCart)
            if (checkout){
            if (req.session.emptyCart||checkout.items.length==0) {
                res.redirect('/cart')
            } else {
                res.render('user/checkout', { savedAddress, checkout, finalTotal: req.session.finalTotal, couponApplied, login, cartQuantity, popular })
            }
        }
        }

    } catch (error) {
        console.log(error.message + " error in  checkout ")
        res.render('user/something-wrong')
    }
}

//address in profile

const getaddress = async (req, res) => {
    try {
        const { cartQuantity, grandTotal, login, wishlistCount, ordercount } = req.session
        userpersonalid = req.session.profileId
        profileEmail = req.session.profile
        console.log(userpersonalid)
        const userAddress = await address.findOne({ user: userpersonalid })
        const profiledata = await user.findOne({ email: profileEmail })
        req.session.savedAddress = userAddress
        console.log(userAddress)
        let formattedDate = moment(profiledata.joined_date).format("MMM DD, YYYY ");
        res.render('user/address', { userAddress, formattedDate, message: login, cartQuantity, grandTotal, login, wishlistCount, ordercount })
    } catch (error) {
        console.log(error.message + " error in getaddress  ")
        res.render('user/something-wrong')
    }

}

//update address in profile

const updateAddress = async (req, res) => {
    try {
        const { firstname, lastname, phone, email, company, address1, city, state, zip, country } = req.body
        userpersonalid = req.session.profileId
        const addressExist = await address.findOne({ user: userpersonalid })
        if (!addressExist) {
            const addAddress = await address.create({
                user: userpersonalid,
                firstname: firstname,
                lastname: lastname,
                phone: phone,
                email: email,
                company: company,
                address: address1,
                city: city,
                state: state,
                zip: zip,
                country: country
            })
            res.redirect('/address')
        }
        else {
            const updateAddress = await address.updateOne({ user: userpersonalid }, {
                $set: {
                    user: userpersonalid,
                    firstname: firstname,
                    lastname: lastname,
                    phone: phone,
                    email: email,
                    company: company,
                    address: address1,
                    city: city,
                    state: state,
                    zip: zip,
                    country: country
                }
            })
            res.redirect('/address')
        }
    } catch (error) {
        console.log(error.message + " error in  updateAddress ")
        res.render('user/something-wrong')
    }
}

//apply coupon

const applyCoupon = async (req, res) => {
    try {
        const userpersonalid = req.session.profileId;
        const appliedCode = req.body.appliedCode;
        req.session.appliedCode = appliedCode
        const userOrder = await order.findOne({ user: userpersonalid });
        req.session.userused = userOrder && userOrder.couponCode == appliedCode
        const userCart = await cart.findOne({ user: userpersonalid });

        let grandTotal
        if (userCart) {
            grandTotal = userCart.grandTotal

        }
        if (grandTotal == 0 || !userCart) {
            res.send({ message: 'Your Cart Is Empty', grandTotal: grandTotal });
            await cart.updateOne({ user: userpersonalid }, { $set: { discount: 0, finalTotal: 0 } });
        }
        else if (appliedCode) {
            console.log("entered to applied code");
            const findCoupon = await coupon.findOne({ code: appliedCode });
            if (findCoupon && userCart) {
                req.session.minspend = userCart.grandTotal < findCoupon.minSpend
                const appliedDate = Date.now();
                const formatAppliedDate = moment(appliedDate).format("DD MMM YYYY");
                const expireDate = findCoupon.endDate;
                const formatExpireDate = moment(expireDate).format("DD MMM YYYY");
                if (appliedDate > expireDate) {
                    console.log("coupon expired");

                    await cart.updateOne({ user: userpersonalid }, { $set: { discount: 0, finalTotal: 0 } });
                    res.send({ message: 'Coupon Expired', finalTotal: userCart.finalTotal });
                }

                else if (userOrder && userOrder.couponCode == appliedCode) {
                    console.log("coupon already used ");
                    res.send({ message: 'Coupon Already Used' });
                    await cart.updateOne({ user: userpersonalid }, { $set: { discount: 0, finalTotal: 0 } });
                }

                else if (userCart.grandTotal < findCoupon.minSpend) {
                    console.log("spend minimum amount")

                    await cart.updateOne({ user: userpersonalid }, { $set: { discount: 0, finalTotal: 0 } });
                    res.send({ message: 'Spend Minimum of ₹' + findCoupon.minSpend + " Rupees", grandTotal: grandTotal, finalTotal: grandTotal, minSpend: true });
                }
                else {
                    console.log("coupon code success");
                    req.session.couponCode = findCoupon.code;
                    req.session.coupon = true;
                    const discount = findCoupon.percentage;
                    console.log(discount);
                    const findCart = await cart.findOne({ user: userpersonalid });
                    console.log("user cart data" + findCart);
                    const grandTotal = findCart.grandTotal;
                    console.log("grandTotal in the user cart " + grandTotal);
                    let discountAmount = (grandTotal * discount) / 100;

                    if (discountAmount > findCoupon.maxDiscount) {
                        discountAmount = findCoupon.maxDiscount;
                        req.session.maxAmount = discountAmount;
                    }
                    console.log("discount amount " + discountAmount);
                    const afterDiscount = grandTotal - discountAmount;
                    req.session.finalTotal = afterDiscount;
                    console.log("subtotal=== " + afterDiscount);
                    const updateDiscount = await cart.updateOne({ user: userpersonalid }, {
                        $set: {
                            discount: discountAmount,
                            finalTotal: afterDiscount
                        }
                    });
                    console.log(discountAmount)
                    res.send({ message: 'Coupon Applied successfully', success: true, discountValue: discountAmount, finalTotal: afterDiscount });
                }
            } else {
                console.log("coupon invalid");
                res.send({ message: 'Invalid coupon code', grandTotal: grandTotal });
                await cart.updateOne({ user: userpersonalid }, { $set: { discount: 0, finalTotal: 0 } });
                res.send({ message: 'Invalid coupon code', grandTotal: grandTotal, });
            }

        } else {
            console.log("enter code");
            res.send({ message: 'Please Enter a coupon code', grandTotal: grandTotal });
            await cart.updateOne({ user: userpersonalid }, { $set: { discount: 0, finalTotal: 0 } });
        }
    } catch (error) {
        console.log(error.message + " error in  applyCoupon ")
        res.render('user/something-wrong')
    }
}

//adding shipping address and rendering shipping method page

const shippingMethod = async (req, res) => {
    try {
        userpersonalid = req.session.profileId
        const popular = await products.find({}).sort({ Date: -1 }).limit(3).skip(3)
        console.log(userpersonalid + "lqweuriwerhiuweqhqweiouf owifihwpuifwiupyfqiupryfruiyrpiughriughriugreyghiurghiueghreiugheugero;g;erigyqrgirgi")
        const usercart = await cart.findOne({ user: userpersonalid })
        console.log(usercart + "funtastic")
        console.log(usercart + "0000000000000000000000000000000000000000000000000000000000000000000000000000000")
        res.render('user/shippingMethod', { usercart, popular })
    } catch (error) {
        console.log(error.message + " error in  shippingMethod ")
        res.render('user/something-wrong')
    }
}
//adding new shipping Address

const shippingAddress = async (req, res) => {
    try {
        const userpersonalid = req.session.profileId
        const { name, lastname, phone, email, company, country, city, zip, state, address } = req.body
        const addAddress = await order.create({
            user: userpersonalid,
            address: [{
                firstname: name,
                lastname: lastname,
                phone: phone,
                email: email,
                company: company,
                address: address,
                city: city,
                state: state,
                zip: zip,
                country: country,


            }]
        })
        console.log('entered to method')
        res.redirect('/shippingMethod')
    } catch (error) {
        console.log(error.message + " error in  shippingAddress ")
        res.render('user/something-wrong')
    }
}

//adding/post saved Address

const postSavedAddress = async (req, res) => {
    try {
        console.log("params of address111111111111111111111111111111111111111111111111111111111111111111111111111111111111111" + req.params.id)
        const SavedAddress = await address.findOne({ _id: req.params.id })
        const Id = () => {
            let Id = '';
            for (let i = 0; i < 6; i++) {
                Id += Math.floor(Math.random() * 10);
            }
            return Id;
        };
        const orderId = Id()
        req.session.orderId = orderId
        const userpersonalid = req.session.profileId
        const usercart = await cart.findOne({ user: userpersonalid })
        const couponCode = req.session.couponCode
        if (usercart) {

            console.log(usercart + "cat data is .504656351623268520852096396363")
            const addAddress = await order.create({
                user: userpersonalid,
                orderId: "#" + orderId,
                orderDate: Date.now(),
                // total: usercart.finalTotal,
                subTotal: usercart.grandTotal,
                products: usercart.items,
                subTotal: usercart.grandTotal,
                totalQuantity: usercart.cartquantity,
                discount: usercart.discount,
                // total:usercart.finalTotal,
                status: "processing",
                couponCode: couponCode,
                paymentStatus: "Not Paid",
                address: [{
                    firstname: SavedAddress.firstname,
                    lastname: SavedAddress.lastname,
                    phone: SavedAddress.phone,
                    email: SavedAddress.email,
                    company: SavedAddress.company,
                    address: SavedAddress.addresss,
                    city: SavedAddress.city,
                    state: SavedAddress.state,
                    zip: SavedAddress.zip,
                    country: SavedAddress.country,
                }]
            })
        }

        res.redirect('/shippingMethod')
    } catch (error) {
        console.log(error.message + " error in  postSavedAddress ")
        res.render('user/something-wrong')
    }
}

//adding shipping Method

const shippingmethod = async (req, res) => {
    try {
        console.log(req.body)
        const userpersonalid = req.session.profileId
        const popular = await products.find({}).sort({ Date: -1 }).limit(3).skip(6)
        console.log(userpersonalid + " user iddddd")
        console.log(req.body.shipping + " shipping in body")
        console.log(req.body)
        const addShippingMethod = await order.updateOne({ user: userpersonalid }, { $set: { shipping: req.body.shipping } })
        console.log(userpersonalid + "lqweuriwerhiuweqhqweiouf owifihwpuifwiupyfqiupryfruiyrpiughriughriugreyghiurghiueghreiugheugero;g;erigyqrgirgi")
        const usercart = await cart.findOne({ user: userpersonalid })
        console.log(usercart + "98295651654626+46+623" +
            "6266+2+6566+62" +
            "4+626+5+629+526+562+65+62+95+62+626+2")

        res.render('user/paymentOption', { usercart, popular })
    } catch (error) {
        console.log(error.message + " error in  shippingmethod ")
        res.render('user/something-wrong')
    }
}

//review

const review = (req, res) => {
    try {
        res.render('user/review')
    } catch (error) {
        console.log(error.message + " error in  review")
        res.render('user/something-wrong')
    }
}

//post payment method

const paymentMethod = async (req, res) => {
    try {
        console.log("entered too payment method")
        const userpersonalid = req.session.profileId
        const orderId = req.session.orderId
        const { payment } = req.body
        console.log("pay" + payment)
        if (payment == "Cod") {
            req.session.cod = true
        }
        const addPaymentMethod = await order.updateOne({ orderId: "#" + orderId }, { $set: { payment: payment } })

        const usercart = await cart.findOne({ user: userpersonalid }).populate("items.product");
        console.log(usercart)
        if (usercart) {
            const cartdetails = usercart.items
            const { cod } = req.session
            res.render('user/review', { cartdetails, usercart, paypalclientid: process.env.paypalclientid, cod: cod })
            req.session.cod = false
        }
        else {
            res.render('user/review')
        }
    } catch (error) {
        console.log(error.message + " error in  paymentMethod ")
        res.render('user/something-wrong')
    }
}

//place order

const placeOrder = async (req, res) => {
    try {
        const userpersonalid = req.session.profileId
        const usercart = await cart.findOne({ user: userpersonalid }).populate("items.product");
        if (usercart) {
            const items = usercart.items
            const orderId = req.session.orderId
            console.log(orderId + "orderid is siisisisisiisisis")
            const couponCode = req.session.couponCode
            console.log("entered to place orderrrrrrrrrrrrrrr469018560+980+6905+965+650+6506")
            const orders = await order.findOneAndUpdate({ orderId: "#" + orderId }, {
                $set: {
                    status: "Pending",
                    paymentStatus: "Paid",
                    total: usercart.finalTotal,
                }
            })
            if (orders) {
                console.log(orderId + " hlo " + userpersonalid)
                console.log(orders + "user new orders")
                const deleteCart = await cart.deleteOne({ user: userpersonalid })
                const userorder = await order.findOne({ user: userpersonalid, orderId: "#" + orderId })
                productCount = userorder.products.length
                console.log("product count " + productCount)
                for (let i = 0; i < productCount; i++) {
                    let productId = userorder.products[i].product
                    console.log(typeof (productId), 'product id')
                    console.log(typeof (userorder.products[i].quantity) + "user.pro.quant")
                    let quantity = (userorder.products[i].quantity)
                    console.log(typeof (quantity) + "quantity")
                    await products.updateOne({ _id: productId }, { $inc: { stock: -quantity } })
                }
                const updateUsed = await coupon.updateOne({ code: couponCode }, { $inc: { used: 1 } })
            }


        }
        res.render('user/orderSuccess')
    } catch (error) {
        console.log(error.message + " error in  placeOrder ")
        res.render('user/something-wrong')
    }
}

const cartIncrement = async (req, res) => {
    try {
        const { itemId } = req.body;
        const userpersonalid = req.session.profileId;
        const { appliedCode } = req.session
        const product = await products.findOne({ _id: itemId });
        const carts = await cart.findOne({ user: userpersonalid })
        const coupons = await coupon.findOne({ code: appliedCode })
        if (product) {
            const price = product.price;
            const findCoupon = await coupon.findOne({ code: appliedCode });
            let discount;
            if (findCoupon) {
                const percentage = findCoupon.percentage
                discount = (price * percentage) / 100
                if ((carts.discount + discount >= 500)) {
                    discount = 500 - carts.discount
                }
            } else {
                discount = 0
            }
            const userCart = await cart.updateOne(
                { user: userpersonalid, "items.product": itemId },
                { $inc: { "items.$.quantity": 1, "items.$.total": price, grandTotal: price, cartquantity: 1, finalTotal: price, discount: discount } }
            );
        }
        const cartdetails = await cart.findOne({ user: userpersonalid, "items.product": itemId });
        if (cartdetails) {
            const usercart = await cart.findOne({ user: userpersonalid, "items.product": itemId }, { "items.$": 1 });
            if (usercart) {
                const total = usercart.items[0].total;
                console.log(total + "product cart details 4455");
                console.log(usercart + "product cart details 1234");
                res.send({ grandTotal: cartdetails.grandTotal, finalTotal: cartdetails.finalTotal, productTotal: total, cartquantity: cartdetails.cartquantity, discount: cartdetails.discount });
                console.log("sended");
            }
        } else {
            console.error("User cart not found");
        }
    } catch (error) {
        console.log(error.message + " error in  cartIncrement ")
        res.render('user/something-wrong')
    }
}

//cart decrement

const cartDecrement = async (req, res) => {
    try {
        console.log("entered");
        const { itemId } = req.body;
        console.log(itemId + 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111)
        console.log("product id i s 4879200 " + itemId)
        const userpersonalid = req.session.profileId;
        console.log("userid" + userpersonalid);
        const product = await products.findOne({ _id: itemId });
        if (product) {
            const price = product.price;
            console.log("product price" + price);
            const userCart = await cart.updateOne(
                { user: userpersonalid, "items.product": itemId },
                { $inc: { "items.$.quantity": -1, "items.$.total": -price, grandTotal: -price, cartquantity: -1, finalTotal: -price } }
            );
        }

        console.log("entered m");
        const cartdetails = await cart.findOne({ user: userpersonalid, "items.product": itemId });
        if (cartdetails) {
            const usercart = await cart.findOne({ user: userpersonalid, "items.product": itemId }, { "items.$": 1 });
            if (usercart) {
                const total = usercart.items[0].total;
                console.log(total + "product cart details 4455");
                console.log(usercart + "product cart details 1234");
                res.send({ grandTotal: cartdetails.grandTotal, finalTotal: cartdetails.finalTotal, productTotal: total, cartquantity: cartdetails.cartquantity });
                console.log("sended");
            }
        } else {
            console.error("User cart not found");
        }
    } catch (error) {
        console.log(error.message + " error in  cartDecrement ")
        res.render('user/something-wrong')
    }
}


//delete Cart

const deleteCart = async (req, res) => {
    try {
        const { itemId } = req.body;
        console.log(itemId)
        const userpersonalid = req.session.profileId;
        console.log(userpersonalid)
        console.log(req.session.profileId)
        const cartdetails = await cart.findOne({ user: userpersonalid, "items.product": itemId });
        if (cartdetails) {
            console.log("cart and product found")
            const usercart = await cart.findOne({ user: userpersonalid, "items.product": itemId }, { "items.$": 1 });
            console.log(usercart + "data here")
            if (usercart) {
                console.log("usercart found no 2")
                const userpersonalid = req.session.profileId;
                const { itemId } = req.body;
                const { items } = usercart
                const total = items[0].total;
                const quantity = items[0].quantity;
                const userCart = await cart.updateOne(
                    { user: userpersonalid },
                    { $inc: { grandTotal: -total, cartquantity: -quantity, finalTotal: -total } }
                );
                const pullproduct = await cart.updateOne({ user: userpersonalid }, { $pull: { items: { product: itemId, quantity: quantity, total: total } } });
                const cartdetails = await cart.findOne({ user: userpersonalid });
                if (cartdetails) {
                    console.log("cart details found")
                    const grandTotal = cartdetails.grandTotal;
                    const finalTotal = cartdetails.finalTotal;
                    res.send({ grandTotal: grandTotal, finalTotal: finalTotal, cartquantity: cartdetails.cartquantity });
                } else {
                    console.log("cart not found 3")
                }
            } else {
                console.log("cart not found no 2")
            }

        } else {
            console.log("cart not found")
        }
    } catch (error) {
        console.log(error.message + " error in  deleteCart ")
        res.render('user/something-wrong')
    }
}

//orders

const orders = async (req, res) => {
    try {
        const userpersonalid = req.session.profileId;
        const { cartQuantity, grandTotal, login, wishlistCount, joinedDate, userName } = req.session
        console.log(userpersonalid + " userid")
        const orderDetails = await order.find({ user: userpersonalid }).sort({ orderDate: -1 })
        const orders = orderDetails.reduce((acc, curr) => {

            const data = {
                _id: curr._id,
                orderDate: moment(curr.orderDate).format("DD MMM YYYY"),
                orderId: curr.orderId,
                status: curr.status,
                total: curr.total
            }
            acc.push(data)
            return acc;
        }, [])
        const count = await order.find({ user: userpersonalid }).count()
        req.session.ordercount = count
        res.render('user/orders', { orders, count, message: login, cartQuantity, grandTotal, wishlistCount, joinedDate, userName })
    } catch (error) {
        console.log(error.message + " error in  orders ")
        res.render('user/something-wrong')
    }
}

//orderDetails

const orderDetail = async (req, res) => {
    try {
        console.log("entered 1234")
        const orderId = req.params.id


        req.session.orderId = orderId

        console.log(" _id of user order document " + orderId)
        let orders = await order.findOne({ _id: (orderId) }).populate("products.product")
        if (orders) {
            console.log(5555555555555555555555555555555555555555555555555555555555555555555555)
            const allProducts = orders.products
            const numberOfProducts = allProducts.length
            console.log("all products that user ordered " + allProducts)

            if (orders.status == "Pending") {
                console.log("pending 1234")
                req.session.ordered = true
            } else if (orders.status == "Shipped") {
                console.log("shipped 1234")
                req.session.shipped = true
            } else if (orders.status == "Delivered") {
                console.log("delivered 1234")
                req.session.delivered = true
            } else if (orders.status == "Canceled") {
                req.session.canceled = true
            } else {
                req.session.returned = true;
            }
            res.render('user/orderDetail', { orders, allProducts, numberOfProducts, ordered: req.session.ordered, shipped: req.session.shipped, delivered: req.session.delivered, canceled: req.session.canceled, returned: req.session.returned })
            req.session.ordered = false;
            req.session.shipped = false;
            req.session.delivered = false;
            req.session.canceled = false;
            req.session.returned = false;

        }
        else {
            res.send("error")
        }

        console.log("all order of specific user " + orders)

    } catch (error) {
        console.error(`Error in orderDetail : ${error.message}`)
        res.render('user/something-wrong')
    }
}

//update Order sattus

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body
        const { id } = req.params
        const orders = await order.findOneAndUpdate({ _id: req.params.id }, { $set: { status: status } })

        if (orders) {

            console.log(orders + " user new orders")
            productCount = orders.products.length
            console.log("product count " + productCount)
            for (let i = 0; i < productCount; i++) {
                let productId = orders.products[i].product
                console.log(typeof (productId), 'product id')
                console.log(typeof (orders.products[i].quantity) + "user.pro.quant")
                let quantity = (orders.products[i].quantity)
                console.log(typeof (quantity) + "quantity")
                await products.updateOne({ _id: productId }, { $inc: { stock: quantity } })
            }
        }

        res.redirect('/orderDetail/' + req.params.id)
    } catch (error) {
        console.log(error.message + " error in  updateOrderStatus ")
        res.render('user/something-wrong')
    }
}

//create order

const createOrder = async (req, res) => {
    try {
        console.log("entered too paypal 501435043546460503")
        const request = new paypal.orders.OrdersCreateRequest();

        console.log("////////");
        console.log(req.body.items[0].amount);
        const balance = req.body.items[0].amount;

        console.log(balance, "jj");
        request.prefer("return=representation");
        request.requestBody({
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: balance,

                        breakdown: {
                            item_total: {
                                currency_code: "USD",
                                value: balance,
                            },
                        },
                    },
                },
            ],
        });
        try {
            console.log(",,,,,,,");
            const order = await paypalCliend.execute(request);
            console.log(".........");
            console.log(order);
            console.log(order.result.id);
            res.json({ id: order.result.id });
        } catch (error) {
            // res.redirect("/errorpage")
            res.render('user/something-wrong')
        }
    } catch (error) {
        console.log(error.message + " error in  createOrder ")
        res.render('user/something-wrong')
    }
}

//category filter

const categoryFilter = async (req, res) => {
    try {
        const { name } = req.params
        const { message } = req.session
        let getallproductdetails;
        if (name == "All") {
            console.log(name + " entered to all")
            getallproductdetails = await products.find({}).sort({ Date: -1 })
        } else {
            getallproductdetails = await products.find({ category: name }).sort({ Date: -1 })
        }
        const getallcategory = await category.find({}, { name: 1, _id: 0 })

        res.render('user/shop', { getallcategory, getallproductdetails, message: message, })
    } catch (error) {
        console.log(error.message + " error in  categoryFilter ")
        res.render('user/something-wrong')
    }
}

//forgot password page

const forgotPassword = (req, res) => {
    try {
        const { checkInternet, userNotFound } = req.session
        res.render('user/forgot-password', { checkInternet: checkInternet, userNotFound: userNotFound })
        req.session.checkInternet = false;
        req.session.userNotFound = false;
    } catch (error) {
        console.error(`Error in forgotPassword : ${error.message}`)
        res.render('user/something-wrong')
    }
}

//forgot password post

const forgotPasswordPost = async (req, res) => {
    try {
        const { email } = req.body
        const users = await user.findOne({ email: email })
        if (!users) {
            req.session.userNotFound = true
            res.redirect('/forgotPassword')
        } else {
            const phoneNumber = users.phoneNumber
            const email = users.email
            req.session.phoneNumber = phoneNumber
            req.session.email = email

            client.verify.v2.services('VA31d3b9a2dea46eadd0aa4eb0fe70eb7a')
                .verifications
                .create({ to: `+91${phoneNumber}`, channel: 'sms' })
                .then(verification => {
                    res.render('user/reset-otp', { phoneNumber: phoneNumber });
                })
                .catch(error => {
                    console.error(error)
                    req.session.checkInternet = true
                    res.redirect('/forgotPassword')
                })
        }
    } catch (error) {
        console.error(`Error in forgotPasswordPost : ${error.message}`)
        res.render('user/something-wrong')
    }
}

//reset password otp page

const resetotp = (req, res) => {
    try {
        res.render('user/reset-otp')
    } catch (error) {
        console.error(`Error in resetotp : ${error.message}`)
        res.render('user/something-wrong')
    }
}

//reset password otp verfication

const resetverifyotp = async (req, res) => {
    try {
        const { phoneNumber } = req.session
        const { otp } = req.body
        client.verify.v2.services('VA31d3b9a2dea46eadd0aa4eb0fe70eb7a')
            .verificationChecks
            .create({ to: `+91${phoneNumber}`, code: otp })
            .then(verification_check => {
                if (verification_check.status == "approved") {
                    req.session.otpcorrect = true
                    req.session.resetotpverified = true
                    res.redirect('/newPassword')
                } else if (verification_check.status == "pending") {
                    req.session.resetinvalidotp = true
                    res.redirect('/resetotp')
                } else {
                    res.redirect('/forgotPassword')
                }
            })
    } catch (error) {
        console.error(`Error in resetverifyotp : ${error.message}`)
        res.render('user/something-wrong')
    }
}

//new password page

const newPassword = (req, res) => {
    try {
        res.render('user/new-password', { verified: req.session.otpcorrect })
        req.session.otpcorrect = false
    } catch (error) {
        console.error(`Error in newPassword : ${error.message}`)
        res.render('user/something-wrong')
    }
}

//verifying new password

const verifyPassword = async (req, res) => {
    try {
        const { password, password2 } = req.body
        console.log(password + password2)
        const { phoneNumber, email } = req.session
        const hashedpassword = await bcrypt.hash(password, 10)
        const hashedconfirmpassword = await bcrypt.hash(password2, 10)
        await user.updateOne({ email: email, phoneNumber: phoneNumber }, { $set: { password: hashedpassword, password2: hashedconfirmpassword } })
        res.redirect('/login')
    } catch (error) {
        console.error(`Error in verifyPassword : ${error.message}`)
        res.render('user/something-wrong')
    }
}

//product search

const search = async (req, res) => {
    try {
        console.log(req.query.search)
        const { search } = req.query
        const getallproductdetails = await products.find({
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: "^" + search, $options: 'i' } },
                { size: { $regex: "^" + search, $options: 'i' } },
                { color: { $regex: "^" + search, $options: 'i' } },
            ]
        })
        const getallcategory = await category.find({}, { name: 1, _id: 0 })
        let noProducts
        if (getallproductdetails.length == 0) {
            noProducts = true
        }
        res.render('user/shop', { getallproductdetails, getallcategory, noProducts })
    } catch (error) {
        console.log(error.message + " error in search ")
        res.render('user/something-wrong')
    }
}

const verifyPayment = async (req, res) => {
    try {
        const { profileId, orderId } = req.session
        const { details } = req.body
        const userpersonalid = req.session.profileId
        const usercart = await cart.findOne({ user: userpersonalid }).populate("items.product");
        if (usercart) {
            const items = usercart.items
            const orderId = req.session.orderId
            console.log(orderId + "orderid is siisisisisiisisis")
            const couponCode = req.session.couponCode
            console.log("entered to place orderrrrrrrrrrrrrrr469018560+980+6905+965+650+6506")
            const orders = await order.findOneAndUpdate({ orderId: "#" + orderId }, {
                $set: {
                    status: "Pending",
                    paymentStatus: "Paid",
                    total: usercart.finalTotal,
                    payerId: details.payer.payer_id,
                    payId: details.id,
                }
            })
            if (orders) {
                console.log("entered to the right path");
                const orders = await order.updateOne({ user: profileId, orderId: orderId }, { $set: { payerId: details.payer.payer_id, payId: details.id } })
                console.log(orderId + " hlo " + userpersonalid)
                console.log(orders + "user new orders")
                const deleteCart = await cart.deleteOne({ user: userpersonalid })
                const userorder = await order.findOne({ user: userpersonalid, orderId: "#" + orderId })
                productCount = userorder.products.length
                console.log("product count " + productCount)
                for (let i = 0; i < productCount; i++) {
                    let productId = userorder.products[i].product
                    console.log(typeof (productId), 'product id')
                    console.log(typeof (userorder.products[i].quantity) + "user.pro.quant")
                    let quantity = (userorder.products[i].quantity)
                    console.log(typeof (quantity) + "quantity")
                    await products.updateOne({ _id: productId }, { $inc: { stock: -quantity } })
                }
                const updateUsed = await coupon.updateOne({ code: couponCode }, { $inc: { used: 1 } })
            }
        }
        res.render('user/orderSuccess')
    } catch (error) {
        console.log(error.message + " error in  verifyPayment ")
        res.render('user/something-wrong')
    }
}




const orderSuccess = (req, res) => {
    res.render('user/orderSuccess')
}

const addToWishlist = async (req, res) => {
    try {
        if (req.session.login) {
            console.log("entered to wishlist")
            const { profileId } = req.session
            console.log(profileId + " id of user")
            const { productId } = req.body
            console.log(productId + " id of product");
            console.log(req.session.loginuser + " boolean")
            const product = await products.findOne({ _id: productId })
            const wishlistExist = await wishlists.findOne({ user: profileId })
            const existproduct = await wishlists.findOne({ user: profileId, "items.product": productId })
            if (wishlistExist && existproduct) {
                res.send({ message: "product Already added to Wishlist" })
            }
            else if (wishlistExist && !existproduct) {
                const pushproduct = await wishlists.updateOne({ user: profileId }, { $push: { items: { product: productId } } });
                res.send({ message: "product Added to Wishlist " })
            } else if (req.session.loginuser && !wishlistExist && !existproduct) {
                const userWishlist = await wishlists.create({
                    user: profileId,
                    items: [
                        {
                            product: productId,
                        }
                    ],
                })
                res.send({ message: "product Added to Wishlist " })
            }
            else {
                res.send({ message: "not match any if error" })
            }
        } else {
            console.log("redirecting")
            res.send({ message: "noSession" })
        }
    } catch (error) {
        console.log(error.message + " error in  addToWishlist")
        res.render('user/something-wrong')
    }
}

const wishlist = async (req, res) => {
    try {
        userpersonalid = req.session.profileId
        const { cartQuantity, grandTotal, login, wishlistCount, joinedDate, userName, ordercount } = req.session
        console.log("userpersonal id is" + userpersonalid)
        const wishlist = await wishlists.findOne({ user: userpersonalid }).populate("items.product", "image price name");
        console.log(wishlist)
        if (wishlist) {
            console.log("have wishlist")
            const wishlists = wishlist.items
            res.render('user/wishlist', { wishlists, cartQuantity, grandTotal, login, wishlistCount, joinedDate, userName, ordercount })
        }
    } catch (error) {
        console.log(error.message + " error in  wishlist ")
        res.render('user/something-wrong')
    }
}

const deleteWishlist = async (req, res) => {
    try {
        console.log("entered to delete wishlist")
        const { login, profileId } = req.session
        if (login) {
            const { productId } = req.body;
            console.log(productId)
            console.log(profileId)
            const wishlist = await wishlists.findOne({ user: profileId, "items.product": productId });
            if (wishlist) {
                console.log("cart found")
                await wishlists.updateOne({ user: profileId }, { $pull: { items: { product: productId, } } });
                res.send({ message: "product Deleted" })
            } else {
                res.send({ message: "noSession" })
            }
        } else {
            res.send({ message: "noSession" })
        }
    }
    catch (error) {
        console.log(error.message + " error in  deleteWishlist ")
        res.render('user/something-wrong')
    }
}

const payment = (req, res) => {
    res.render('user/paymentOption')
}


const priceFilter = async (req, res) => {
    console.log("price filtering")
    const value = req.body.value

    res.send({ message: a })
}


//module export to user router

module.exports = {
    userhome,
    loginpage,
    signup,
    postsignup,
    loginpost,
    logout,
    getusershop,
    productdetailpage,
    account,
    verifyotp,
    getverifyotp,
    updateprofile,
    addToCart,
    getcart,
    checkout,
    getaddress,
    updateAddress,
    applyCoupon,
    shippingAddress,
    shippingmethod,
    paymentMethod,
    postSavedAddress,
    shippingMethod,
    review,
    placeOrder,
    cartIncrement,
    cartDecrement,
    deleteCart,
    orders,
    orderDetail,
    updateOrderStatus,
    createOrder,
    categoryFilter,
    forgotPassword,
    forgotPasswordPost,
    resetverifyotp,
    resetotp,
    newPassword,
    verifyPassword,
    search,
    verifyPayment,
    orderSuccess,
    addToWishlist,
    wishlist,
    deleteWishlist,
    payment,
    priceFilter

}