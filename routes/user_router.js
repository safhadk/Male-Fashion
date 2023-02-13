const express = require('express');
const router = express.Router();
const session=require('../middlewares/user-session')

const {
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
} = require('../controller/user_controller')

router.get('/', userhome)
router.get('/login', loginpage)
router.get('/signup', signup)
router.post("/signuppost", postsignup);
router.post('/loginpost', loginpost)
router.get('/logout', logout)
router.get('/shop', getusershop)
router.get('/productdetail/:id', productdetailpage)
router.get('/account',session, account)
router.post('/verifyotp', verifyotp)
router.get('/verifyotp', getverifyotp)
router.post('/updateprofile',session, updateprofile)
router.post('/cart/:id',session, addToCart)
router.get('/cart',session, getcart)
router.post('/deleteCart/:id/:total/:quantity',session, deleteCart)
router.get('/checkout',session, checkout)
router.get('/address',session, getaddress)
router.post('/savedAddress/:id',session, postSavedAddress)
router.post('/address',session, updateAddress)
router.post('/applyCoupon',session, applyCoupon)
router.post('/shippingAddress',session, shippingAddress)
router.get('/shippingMethod',session, shippingMethod)
router.post('/shippingMethod',session, shippingmethod)
router.post('/paymentMethod',session, paymentMethod)
router.get('/payment',session,payment)
router.get('/review',session, review)
router.post('/placeOrder',session, placeOrder)
router.post('/cartIncrement',session,cartIncrement) 
router.post('/cartDecrement',session,cartDecrement) 
router.post('/deleteCart',session,deleteCart) 
router.get('/orders',session,orders)
router.get('/orderDetail/:id',session,orderDetail)
router.post('/cancel/return/:id',session,updateOrderStatus)
router.post('/create-order',session,createOrder)
router.get('/category/:name',categoryFilter)
router.get('/forgotPassword',forgotPassword)
router.post('/forgotPassword',forgotPasswordPost)
router.get('/resetotp',resetotp)
router.post('/resetverifyotp',resetverifyotp)
router.get('/newPassword',newPassword)
router.post('/verifyPassword',verifyPassword)
router.get('/search',search)
router.post('/verifyPayment',session,verifyPayment)
router.get('/orderSuccess',session,orderSuccess)
router.post('/wishlist',addToWishlist)
router.get('/wishlist',session,wishlist)
router.post('/deleteWishlist',deleteWishlist)
router.post('/priceFilter',priceFilter)

module.exports = router;



































