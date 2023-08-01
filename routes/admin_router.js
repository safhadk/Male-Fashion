const express = require('express');
const router = express.Router();
const upload = require('../config/multer')
const session=require('../middlewares/admin-session')

//requiring modules from admin controller

const {
  get_admin_login,
  get_admin_dashboard,
  adminlogout,
  get_products,
  get_add_products,
  get_add_category,
  postcategory,
  postproduct,
  userdetails,
  userblock,
  userunblock,
  deletecategory,
  editproduct,
  updateproduct,
  deleteproduct,
  coupons,
  createCoupon,
  manageCoupon,
  unblockProduct,
  orders,
  inventory,
  orderDetail,
  updateOrderStatus,
  stockUpdate,
  banner,
  addBanner,
  uploadBanner,
  editBanner,
  updateBanner,
  dailyReport,
  monthlyReport,
  yearlyReport
} = require('../controller/admin_controller')

//admin routes

router.get('/', get_admin_login)
router.post('/admin', get_admin_dashboard)
router.get("/admin_logout", adminlogout);
router.get("/products",session, get_products);
router.get('/add_products',session, get_add_products)
router.get('/add_category',session, get_add_category)
router.post('/add_category',session, postcategory)
router.post('/post_products',session, upload.array('image', 4), postproduct)
router.get('/user_details',session, userdetails)
router.get('/userblock/:id',session, userblock)
router.get('/userunblock/:id',session, userunblock)
router.get('/deletecategory/:id',session, deletecategory)
router.get('/editproduct/:id',session, editproduct)
router.post('/post_editproducts/:id',session, upload.array('image', 4), updateproduct)
router.get('/deleteproduct/:id',session, deleteproduct)
router.get('/unblockProduct/:id',session, unblockProduct)
router.get('/coupon',session, coupons)
router.post('/createCoupon',session, createCoupon)
router.get('/manageCoupon',session, manageCoupon)
router.get('/orders',session, orders)
router.get('/inventory',session, inventory)
router.get('/order-detail/:id',session,orderDetail)
router.post('/update-orderStatus',session,updateOrderStatus)
router.post('/stockUpdate/:id',session,stockUpdate)
router.get('/banner',session,banner)
router.get('/add-banner',session,addBanner)
router.post('/add-banner',session, upload.array('image', 1), uploadBanner)
router.get('/editBanner/:id',session, editBanner)
router.post('/updateBanner/:id',session, upload.array('image', 1), updateBanner)
router.get('/dailyReport',session,dailyReport)
router.get('/monthlyReport',session,monthlyReport)
router.get('/yearlyReport',session,yearlyReport)

module.exports = router;

