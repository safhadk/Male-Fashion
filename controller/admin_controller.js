//requiring category,products,users schema from model folder

const category = require('../model/category')
const products = require('../model/products')
const { find } = require('../model/signup')
const users = require('../model/signup')
const coupon = require('../model/coupon')
const order = require('../model/order')
const moment = require('moment')
const { Cursor } = require('mongoose')
const banners = require('../model/banner')
const csv = require("fast-csv");
const PDFDocument = require('pdfkit');
// const csv = require("csv-writer");
const fs = require("fs");
const path = require("path");



//admin login

const get_admin_login = async (req, res) => {
  try {
    if (req.session.admin) {
     
      const del=await order.deleteMany({status:"processing"})
      const newOrders = await order.find({ status: "Pending" }).count()
      const notification=await order.find({ status: "Pending" })
      let newOrdersArray = Array.from({length: newOrders}, (_, i) => i + 1);
      const orderdetails = await order.find({status:"Pending"}).sort({ orderDate: -1 })
      const newOrder = orderdetails.reduce((acc, curr) => {
        const data = {
          _id: curr._id,
          orderId: curr.orderId,
          address: curr.address,
          orderDate: moment(curr.orderDate).format("DD MMM YYYY hh:mm:ss:a"),
          subTotal: curr.subTotal,
          paymentStatus: curr.paymentStatus,
          payment: curr.payment,
          status: curr.status,
        }
        acc.push(data)
        return acc;
      }, [])
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      const todaysOrder = await order.find({ orderDate: { $gte: startOfToday, $lt: endOfToday } })
      const totalOrders = await order.find({})
      const todaysRevenue = todaysOrder.reduce((acc, curr) => {
        const data = {
          subTotal: curr.subTotal
        };
        acc.push(data);
        return acc;
      }, []).reduce((sum, curr) => sum + curr.subTotal, 0);


      const totalRevenue = totalOrders.reduce((acc, curr) => {
        const data = {
          subTotal: curr.subTotal
        };
        acc.push(data);
        return acc;
      }, []).reduce((sum, curr) => sum + curr.subTotal, 0);

      let person = { firstName: "John", lastName: "Doe", age: 50, eyeColor: "blue" };
      console.log(person)



      async function getOrders() {
        const today = new Date();
        const aYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        const result = await order.aggregate([
          {
            $match: {
              orderDate: { $gte: aYearAgo }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m",
                  date: "$orderDate"
                }
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { "_id": 1 }
          }
        ]);

        return result;
      }

async function getsales() {
const currentDate = new Date();
const oneYearAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());

const result = await order.aggregate([
  {
    $match: {
      orderDate: { $gte: oneYearAgo }
    }
  },
  {
    $group: {
      _id: {
        year: { $year: "$orderDate" },
        month: { $month: "$orderDate" }
      },
      totalSales: { $sum: "$subTotal" }
    }
  },
  {
    $sort: {
      "_id.year": 1,
      "_id.month": 1
    }
  }
]);
return result;
      }

      const orders = await getOrders();
      const sales = await getsales();
      let monthOrder;
      let monthSales;
      if(orders&&sales){
      monthOrder = { jan: orders[0].count, feb: orders[1].count };
      monthSales = {jan:sales[0].totalSales,feb:sales[1].totalSales}
      }
      const delivered = await order.find({ status: "Delivered" }).count()
      const cancelled = await order.find({ status: "Cancelled" }).count()
      const returned = await order.find({ status: "Returned" }).count()
      const shipped = await order.find({ status: "Shipped" }).count()
      const cod = await order.find({ payment: "Cod" }).count()
      const prepaid = await order.find({ payment: "Online" }).count()
      console.log(newOrder)

      res.render('admin/admin_dashboard', { todaysOrder: todaysOrder.length, totalOrders: totalOrders.length, todaysRevenue, totalRevenue, monthOrder,monthSales, delivered, cancelled, returned, shipped, cod, prepaid,newOrdersArray,newOrder,newOrders,notification })

    } else {
      const { loginerror } = req.session
      res.render('admin/admin_login', { loginerror: loginerror })
      req.session.loginerror = false
    }

  } catch (error) {
    console.log(error.message + " error in get_admin_login")
  }

}

//admin login details

const admin_username = process.env.admin_username
const admin_password = process.env.admin_password

//admin dashboard

const get_admin_dashboard = async (req, res) => {
  try {
    console.log("entered")
    const { username, password } = req.body
    if (admin_username == username && admin_password == password) {
      req.session.admin = true
      res.redirect('/admin')
    } else {
      req.session.loginerror = true
      res.redirect('/admin')
    }

  } catch (error) {
    console.log(error.message + " error in get_admin_dashboard")
  }

}

//admin logout

const adminlogout = (req, res) => {
  try {
    req.session.admin = false
    res.redirect('/admin')

  } catch (error) {
    console.log(error.message + " error in adminlogout")
  }
}

//products page contain products and category details

const get_products = async (req, res) => {
  try {
    const categories = await category.find({}).sort({ Date: -1 })
    const product = await products.find({}).sort({ Date: -1 })
    res.render('admin/products', { categories, product })
  } catch (error) {
    console.log(error.message + " error in get_products")
  }
}

//add product page

const get_add_products = async (req, res) => {
  try {
    const categories = await category.find({}, { name: 1, _id: 0 })
    res.render('admin/add_products', { categories })
  } catch (error) {
    console.log(error.message + " error in get_add_products")
  }
}

//add category page

const get_add_category = (req, res) => {
  try {
    const { duplicate } = req.session
    res.render('admin/add_new_category', { duplicate: duplicate })
    req.session.duplicate = false
  } catch (error) {
    console.log(error.message + " error in get_add_category")
  }
}

//adding category

const postcategory = async (req, res) => {
  try {
    const { name, description } = req.body
    const categories = await category.findOne({ name })
    if (categories) {
      req.session.duplicate = true
      res.redirect('/admin/add_category')
    } else {
      await category.create({
        name: name,
        description: description,
      })
      res.redirect('/admin/products')
    }
  } catch (error) {
    console.log(error.message + " error in postcategory")
  }
}

//adding product

const postproduct = async (req, res) => {
  try {
    const { name, description, category, price, stock, size, color } = req.body
    const images = req.files.map((val) => val.filename)
    await products.create({
      name: name,
      description: description,
      category: category,
      price: price,
      stock: stock,
      size: size,
      color: color,
      image: images
    })
    res.redirect('/admin/products')
  } catch (error) {
    console.log(error.message + " error in postproduct")
  }

}

//userdetail page 

const userdetails = async (req, res) => {
  try {
    const userlist = await users.find({}).sort({ joined_date: -1 })
    res.render('admin/user_details', { userlist })
  } catch (error) {
    console.log(error.message + " error in userdetails")
  }
}

//user block

const userblock = async (req, res) => {
  try {
    const { id } = req.params
    const up =await users.updateOne({ _id: id }, { $set: { blocked: true } })

    res.redirect('/admin/user_details')
  } catch (error) {
    console.log(error.message + " error in userblock")
  }
}

//user unblock

const userunblock = async (req, res) => {
  try {
    const { id } = req.params
    await users.updateOne({ _id: id }, { $set: { blocked: false } })
    res.redirect('/admin/user_details')
  } catch (error) {
    console.log(error.message + " error in userunblock")
  }
}

//delete category

const deletecategory = async (req, res) => {
  try {
    const { id } = req.params
    await category.deleteOne({ _id: id })
    res.redirect('/admin/products')
  } catch (error) {
    console.log(error.message + " error in deletecategory")
  }
}

//edit product page

const editproduct = async (req, res) => {
  try {
    const { id } = req.params
    const product = await products.findOne({ _id: (id) })
    res.render('admin/editproduct', { product })
  } catch (error) {
    console.log(error.message + " error in editproduct")
  }
}

//update product in edit product page

const updateproduct = async (req, res) => {
  try {
    const { id } = req.params
    const { name, price, description, category, stock, size, color } = req.body
    const images = req.files.map((val) => val.filename)
    await products.updateOne({ _id: (id) }, { $set: { name: name, price: price, description: description, category: category, stock: stock, size: size, color: color, image: images } })
    res.redirect('/admin/products')
  } catch (error) {
    console.log(error.message + " error in updateproduct")
  }
}

//delete product

const deleteproduct = async (req, res) => {
  try {
    const { id } = req.params
    await products.updateOne({ _id: (id) }, { $set: { blocked: true } })
    res.redirect('/admin/products')
  } catch (error) {
    console.log(error.message + " error in deleteproduct")
  }
}

//unblock product 

const unblockProduct = async (req, res) => {
  try {
    const { id } = req.params
    await products.updateOne({ _id: (id) }, { $set: { blocked: false } })
    res.redirect('/admin/products')
  } catch (error) {
    console.log(error.message + " error in unblockProduct")
  }
}

//coupon page

const coupons = (req, res) => {
  try {
    res.render('admin/createCoupon')
  } catch (error) {
    console.log(error.message + " error in coupons")
  }
}

//create coupon and adding to database

const createCoupon = async (req, res) => {
  try {
    const { name, code, startDate, endDate, quantity, percentage, amount, minSpend, maxDiscount, perCustomer } = req.body
    await coupon.create({
      name: name,
      code: code,
      startDate: startDate,
      endDate: endDate,
      quantity: quantity,
      percentage: percentage,
      amount: amount,
      minSpend: minSpend,
      maxDiscount: maxDiscount,
      perCustomer: perCustomer
    })
    res.redirect('/admin/manageCoupon')
  } catch (error) {
    console.log(error.message + " error in createCoupon")
  }
}

//manage coupons page

const manageCoupon = async (req, res) => {
  try {
    const coupons = await coupon.find({})
    const updatedCoupon = coupons.reduce((acc, curr) => {
      currentDate = Date.now()
      endDate = curr.endDate
      let couponStatus;
      const usedPercentage = (curr.used * 100) / curr.quantity
      if (currentDate > endDate) {
        couponStatus = false;
      } else {
        couponStatus = true;
      }
      const data = {
        _id: curr._id,
        name: curr.name,
        code: curr.code,
        startDate: moment(curr.startDate).format("DD MMM YYYY"),
        endDate: moment(curr.endDate).format("DD MMM YYYY"),
        quantity: curr.quantity,
        percentage: curr.percentage,
        amount: curr.amount,
        minSpend: curr.minSpend,
        maxDiscount: curr.maxDiscount,
        used: curr.used,
        perCustomer: curr.perCustomer,
        status: couponStatus,
        usedPercentage: usedPercentage
      }
      acc.push(data)
      return acc;
    }, [])
    res.render('admin/manageCoupons', { updatedCoupon })
  } catch (error) {
    console.log(error.message + " error in manageCoupon")
  }
}

//orders

const orders = async (req, res) => {
  try {
    const orderdetails = await order.find({}).sort({ orderDate: -1 })
    const orders = orderdetails.reduce((acc, curr) => {
      const data = {
        _id: curr._id,
        orderId: curr.orderId,
        address: curr.address,
        orderDate: moment(curr.orderDate).format("DD MMM YYYY"),
        subTotal: curr.subTotal,
        paymentStatus: curr.paymentStatus,
        payment: curr.payment,
        status: curr.status,
      }
      acc.push(data)
      return acc;
    }, [])
    res.render('admin/orders', { orders })
  } catch (error) {
    console.log(error.message + " error in orders")
  }
}

//inventory

const inventory = async (req, res) => {
  try {
    const allproducts = await products.find({}).sort({ Date: -1 })
    res.render('admin/inventory', { allproducts })
  } catch (error) {
    console.log(error.message + " error in inventory")
  }
}

//order detail page

const orderDetail = async (req, res) => {
  try {
    const { id } = req.params
    let orders = await order.findOne({ _id: (id) }).populate("products.product")
    if (orders) {
      const allProducts = orders.products
      const numberOfProducts = allProducts.length
      res.render('admin/order-detail', { orders, allProducts, numberOfProducts })
    }
  } catch (error) {
    console.log(error.message + " error in orderDetail")
  }
}

//updating order status

const updateOrderStatus = async (req, res) => {
  try {
    const { status, orderId } = req.body
    const orders = await order.findOneAndUpdate({ orderId: orderId }, { $set: { status: status } })
    console.log(status)
    if (status == "Cancelled" || status == "Returned") {
      console.log((status == "Cancelled" || status == "Returned"));
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
    } else {
      console.log("Shipped or Delivered")
    }
    res.send({ status: status })
  } catch (error) {
    console.log(error.message + " error in updateOrderStatus")
  }
}

//stock update

const stockUpdate = async (req, res) => {
  try {
    const { id } = req.params
    const { stock } = req.body
    await products.updateOne({ _id: id }, { $set: { stock: stock } })
    res.redirect('/admin/inventory')
  } catch (error) {
    console.log(error.message + " error in stockUpdate ")
  }
}

//banner management page

const banner = async (req, res) => {
  try {
    const banner = await banners.find({}).sort({ Date: -1 })
    res.render('admin/banner', { banner })
  } catch (error) {
    console.log(error.message + " error in banner ")
  }
}

//add banner page

const addBanner = (req, res) => {
  try {
    res.render('admin/add-banner')
  } catch (error) {
    console.log(error.message + " error in addBanner ")
  }
}

//banner upload

const uploadBanner = async (req, res) => {
  try {
    const { name, title, description, url } = req.body
    const images = req.files.map((val) => val.filename)
    await banners.create({
      name: name,
      title: title,
      description: description,
      url: url,
      image: images
    })
    res.redirect('/admin/banner')
  } catch (error) {
    console.log(error.message + " error in uploadBanner ")
  }
}

//edit banner page

const editBanner = async (req, res) => {
  try {
    const { id } = req.params
    const banner = await banners.findOne({ _id: id })
    res.render('admin/edit-banner', { banner })
  } catch (error) {
    console.log(error.message + " error in editBanner ")
  }
}

//update banner

const updateBanner = async (req, res) => {
  try {
    const { id } = req.params
    const { name, title, description, url } = req.body
    const images = req.files.map((val) => val.filename)
    await banners.updateOne({ _id: id }, { $set: { name: name, title: title, description: description, image: images, url: url } })
    res.redirect('/admin/banner')
  } catch (error) {
    console.log(error.message + " error in updateBanner ")
  }
}

//daily report

const dailyReport = async (req, res) => {
  try {
    const { date, excel, pdf } = req.query
    if (date && excel) {
      const startOfDay = new Date(`${date}T00:00:00Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      const customDateOrders = await order.find({ orderDate: { $gte: startOfDay, $lt: endOfDay } });

      if (!customDateOrders || customDateOrders.length === 0) {
        console.log("no orders")
        // return res.status(404).send("No orders found for the specified date range.");
        req.session.noOrders = true
        res.redirect('/admin/dailyReport')
      }

      const headers = ["orderId", "payment", "subTotal", "totalQuantity", "discount", "orderDate", "status", "couponCode", "paymentStatus", "total"];
      const filePath = path.join(__dirname, "downloads", "sales-report.csv");
      const ws = fs.createWriteStream(filePath);

      const csvData = customDateOrders.map(order => {
        return {
          orderId: order.orderId,
          payment: order.payment,
          subTotal: order.subTotal,
          totalQuantity: order.totalQuantity,
          discount: order.discount,
          orderDate: order.orderDate,
          status: order.status,
          couponCode: order.couponCode,
          paymentStatus: order.paymentStatus,
          total: order.total,
        };
      });

      csv.write(csvData, { headers: headers }).pipe(ws)
        .on("finish", function () {
          res.download(filePath, "sales-report.csv", (err) => {
            if (err) {
              console.error("An error occurred while sending the file:", err);
            } else if (!customDateOrders || customDateOrders.length === 0) {
              req.session.noOrders = true
              res.redirect('/admin/dailyReport')
            } else {
              console.log("File sent successfully.");
            }
          });
        })
        .on("error", function (err) {
          console.error("An error occurred while writing the file:", err);
        });


    } else if (date && pdf) {
      const doc = new PDFDocument();
      const startOfDay = new Date(`${date}T00:00:00Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      const customDateOrders = await order.find({ orderDate: { $gte: startOfDay, $lt: endOfDay } });

      if (!customDateOrders || customDateOrders.length === 0) {
        console.log("No orders found for the specified date range.");
        req.session.noOrders = true
        res.redirect('/admin/dailyReport')
      }

      // Pipe its output to a file
      doc.pipe(fs.createWriteStream('sales-report.pdf'));

      // Add a title and some content
      doc.font('Helvetica-Bold')
        .fontSize(25)
        .text('Sales Report', {
          align: 'center'
        });

      const headers = ["Order ID", "Payment Method", "Sub Total", "Total Quantity", "Discount", "Order Date", "Status", "Coupon Code", "Payment Status", "Total"];

      // Add table headers to the PDF
      headers.forEach((header) => {
        doc.font('Helvetica-Bold')
          .fontSize(15)
          .text(header, {
            align: 'left',
            continued: true
          });
      });
      // Iterate over the orders and add each one to the PDF
      customDateOrders.forEach((order) => {
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.orderId, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.payment, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.subTotal, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.totalQuantity, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.discount, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.orderDate, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.status, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.couponCode, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.paymentStatus, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.total, {
            align: 'left'
          });
      });
      doc.end();
      res.download('./sales-report.pdf', (err) => {
        if (err) {
          console.error("An error occurred while sending the file:", err);
        } else if (!customDateOrders || customDateOrders.length === 0) {
          req.session.noOrders = true
          res.redirect('/admin/dailyReport')
        } else {
          console.log("File sent successfully.");
          req.session.noOrders = false
          res.redirect('/admin/dailyReport')
        }
      });
    }
    if (date) {
      const startOfDay = new Date(`${date}T00:00:00Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      const customDateOrders = await order.find({ orderDate: { $gte: startOfDay, $lt: endOfDay } });

      const todayOrderCount = await order.find({ orderDate: { $gte: startOfDay, $lt: endOfDay } }).count()
      const cod = await order.find({
        orderDate: { $gte: startOfDay, $lt: endOfDay },
        payment: "Cod"
      }).count()
      const prepaid = await order.find({
        orderDate: { $gte: startOfDay, $lt: endOfDay },
        payment: "Online"
      }).count()
      console.log(customDateOrders);
      if (customDateOrders[0]) {
        const orders = customDateOrders.reduce((acc, curr) => {
          const data = {
            _id: curr._id,
            orderId: curr.orderId,
            address: curr.address,
            orderDate: moment.utc(curr.orderDate).local().format("DD MMM YYYY hh:mm:ss"),
            subTotal: curr.subTotal,
            paymentStatus: curr.paymentStatus,
            payment: curr.payment,
            status: curr.status,
          }
          acc.push(data)
          return acc;
        }, [])

        const totalRevenue = customDateOrders.reduce((acc, curr) => {
          const data = {
            subTotal: curr.subTotal
          };
          acc.push(data);
          return acc;
        }, []).reduce((sum, curr) => sum + curr.subTotal, 0);

        console.log(orders[0].orderDate + " kiran datas")

        res.render('admin/daily-report', { orders, todayOrderCount, totalRevenue, cod, prepaid })

      } else {
        req.session.noOrders = true
        console.log("no orders in the particular date");
        res.redirect('/admin/dailyReport')
      }
    } else {
      console.log("page loading");
      const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
      console.log(startOfToday)
      const endOfToday = new Date(new Date(startOfToday).setHours(23, 59, 59, 999));
      console.log(endOfToday)
      if (startOfToday && endOfToday) {
        const todaysOrder = await order.find({ orderDate: { $gte: startOfToday, $lt: endOfToday } })
        console.log(todaysOrder + " today order is")

        const todayOrderCount = await order.find({ orderDate: { $gte: startOfToday, $lt: endOfToday } }).count()
        console.log(todaysOrder + " today order is 2")
        const cod = await order.find({
          orderDate: { $gte: startOfToday, $lt: endOfToday },
          payment: "Cod"
        }).count()
        console.log(todaysOrder + " today order is 3")
        const prepaid = await order.find({
          orderDate: { $gte: startOfToday, $lt: endOfToday },
          payment: "Online"
        }).count()
        console.log(todaysOrder + " today order is 4")
        if (todaysOrder[0]) {
          console.log(todaysOrder + " today order is 325")
          const orders = todaysOrder.reduce((acc, curr) => {
            const data = {
              _id: curr._id,
              orderId: curr.orderId,
              address: curr.address,
              orderDate: moment.utc(curr.orderDate).local().format("DD MMM YYYY hh:mm:ss"),
              subTotal: curr.subTotal,
              paymentStatus: curr.paymentStatus,
              payment: curr.payment,
              status: curr.status,
            }
            acc.push(data)
            return acc;
          }, [])
          const totalRevenue = todaysOrder.reduce((acc, curr) => {
            const data = {
              subTotal: curr.subTotal
            };
            acc.push(data);
            return acc;
          }, []).reduce((sum, curr) => sum + curr.subTotal, 0);
          console.log("yes here it is")
          const { noOrders } = req.session
          console.log(noOrders + " boolean")
          res.render('admin/daily-report', { orders, totalRevenue, todayOrderCount, noOrders: noOrders, cod, prepaid })
          req.session.noOrders = false
        } else {
          console.log("working here")

          res.render('admin/daily-report', { noOrders: true })

        }
      }
    }

  } catch (error) {
    console.log(error.message + " error in dailyReport ")
  }
}

const verifyPayment = (req, res) => {
  res.send("payemnt success")

}





////////////////////////////////



const monthlyReport = async (req, res) => {
  try {
    const { month, excel, pdf } = req.query
    console.log("queries")
    console.log(month)

    if (month && excel) {
      const startOfmonth = new Date(`2023-${month}-01T00:00:00.000Z`)
      const endOfmonth = new Date(`2023-${month}-31T00:00:00.000Z`);
      const customMonthOrders = await order.find({ orderDate: { $gte: startOfmonth, $lt: endOfmonth } });

      if (!customMonthOrders || customMonthOrders.length === 0) {
        // return res.status(404).send("No orders found for the specified date range.");
        req.session.noOrders = true
        res.redirect('/admin/monthlyReport')
      }

      const headers = ["orderId", "payment", "subTotal", "totalQuantity", "discount", "orderDate", "status", "couponCode", "paymentStatus", "total"];
      const filePath = path.join(__dirname, "downloads", "sales-report.csv");
      const ws = fs.createWriteStream(filePath);

      const csvData = customMonthOrders.map(order => {
        return {
          orderId: order.orderId,
          payment: order.payment,
          subTotal: order.subTotal,
          totalQuantity: order.totalQuantity,
          discount: order.discount,
          orderDate: order.orderDate,
          status: order.status,
          couponCode: order.couponCode,
          paymentStatus: order.paymentStatus,
          total: order.total,
        };
      });

      csv.write(csvData, { headers: headers }).pipe(ws)
        .on("finish", function () {
          res.download(filePath, "sales-report.csv", (err) => {
            if (err) {
              console.error("An error occurred while sending the file:", err);
            } else if (!customMonthOrders || customMonthOrders.length === 0) {
              req.session.noOrders = true
              res.redirect('/admin/monthlyReport')
            } else {
              console.log("File sent successfully.");
            }
          });
        })
        .on("error", function (err) {
          console.error("An error occurred while writing the file:", err);
        });


    } else if (month && pdf) {
      const doc = new PDFDocument();
      const startOfmonth = new Date(`2023-${month}-01T00:00:00.000Z`)
      const endOfmonth = new Date(`2023-${month}-31T00:00:00.000Z`);
      const customMonthOrders = await order.find({ orderDate: { $gte: startOfmonth, $lt: endOfmonth } });

      if (!customMonthOrders || customMonthOrders.length === 0) {
        // return res.status(404).send("No orders found for the specified date range.");
        req.session.noOrders = true
        res.redirect('/admin/monthlyReport')
      }

      // Pipe its output to a file
      doc.pipe(fs.createWriteStream('sales-report.pdf'));

      // Add a title and some content
      doc.font('Helvetica-Bold')
        .fontSize(25)
        .text('Sales Report', {
          align: 'center'
        });

      const headers = ["Order ID", "Payment Method", "Sub Total", "Total Quantity", "Discount", "Order Date", "Status", "Coupon Code", "Payment Status", "Total"];

      // Add table headers to the PDF
      headers.forEach((header) => {
        doc.font('Helvetica-Bold')
          .fontSize(15)
          .text(header, {
            align: 'left',
            continued: true
          });
      });
      // Iterate over the orders and add each one to the PDF
      customMonthOrders.forEach((order) => {
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.orderId, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.payment, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.subTotal, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.totalQuantity, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.discount, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.orderDate, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.status, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.couponCode, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.paymentStatus, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.total, {
            align: 'left'
          });
      });
      doc.end();
      res.download('./sales-report.pdf', (err) => {
        if (err) {
          console.error("An error occurred while sending the file:", err);
        } else if (!customMonthOrders || customMonthOrders.length === 0) {
          req.session.noOrders = true
          res.redirect('/admin/monthlyReport')
        } else {
          console.log("File sent successfully.");
          req.session.noOrders = false
          res.redirect('/admin/monthlylyReport')
        }
      });
    }
    if (month) {
      const startOfmonth = new Date(`2023-${month}-01T00:00:00.000Z`)
      const endOfmonth = new Date(`2023-${month}-31T00:00:00.000Z`);
      const customMonthOrders = await order.find({ orderDate: { $gte: startOfmonth, $lt: endOfmonth } });

      const currentMonthOrderCount = await order.find({ orderDate: { $gte: startOfmonth, $lt: endOfmonth } }).count()
      const cod = await order.find({
        orderDate: { $gte: startOfmonth, $lt: endOfmonth },
        payment: "Cod"
      }).count()
      const prepaid = await order.find({
        orderDate: { $gte: startOfmonth, $lt: endOfmonth },
        payment: "Online"
      }).count()
      console.log(customMonthOrders);
      if (customMonthOrders[0]) {
        const orders = customMonthOrders.reduce((acc, curr) => {
          const data = {
            _id: curr._id,
            orderId: curr.orderId,
            address: curr.address,
            orderDate: moment.utc(curr.orderDate).local().format("DD MMM YYYY hh:mm:ss"),
            subTotal: curr.subTotal,
            paymentStatus: curr.paymentStatus,
            payment: curr.payment,
            status: curr.status,
          }
          acc.push(data)
          return acc;
        }, [])

        const totalRevenue = customMonthOrders.reduce((acc, curr) => {
          const data = {
            subTotal: curr.subTotal
          };
          acc.push(data);
          return acc;
        }, []).reduce((sum, curr) => sum + curr.subTotal, 0);

        console.log(orders[0].orderDate + " kiran datas")

        res.render('admin/monthly-report', { orders, currentMonthOrderCount, totalRevenue, cod, prepaid })

      } else {
        req.session.noOrders = true
        console.log("no orders in the particular date");
        res.redirect('/admin/monthlyReport')
      }
    } else {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endOfMonth = new Date(new Date(startOfMonth).setMonth(startOfMonth.getMonth() + 1, 0));
      const currentMonthOrders = await order.find({ orderDate: { $gte: startOfMonth, $lt: endOfMonth } });
      const currentMonthOrderCount = await order.find({ orderDate: { $gte: startOfMonth, $lt: endOfMonth } }).count();

      const cod = await order.find({
        orderDate: { $gte: startOfMonth, $lt: endOfMonth },
        payment: "Cod"
      }).count()
      const prepaid = await order.find({
        orderDate: { $gte: startOfMonth, $lt: endOfMonth },
        payment: "Online"
      }).count()
      if (currentMonthOrders[0]) {
        const orders = currentMonthOrders.reduce((acc, curr) => {
          const data = {
            _id: curr._id,
            orderId: curr.orderId,
            address: curr.address,
            orderDate: moment.utc(curr.orderDate).local().format("DD MMM YYYY hh:mm:ss"),
            subTotal: curr.subTotal,
            paymentStatus: curr.paymentStatus,
            payment: curr.payment,
            status: curr.status,
          }
          acc.push(data)
          return acc;
        }, [])
        const totalRevenue = currentMonthOrders.reduce((acc, curr) => {
          const data = {
            subTotal: curr.subTotal
          };
          acc.push(data);
          return acc;
        }, []).reduce((sum, curr) => sum + curr.subTotal, 0);
        console.log("yes here it is")
        const { noOrders } = req.session
        console.log(noOrders + " boolean")
        res.render('admin/monthly-report', { orders, totalRevenue, currentMonthOrderCount, noOrders: noOrders, cod, prepaid })
        req.session.noOrders = false
      }
    }

  } catch (error) {
    console.log(error.message + " error in MOnthly Report ")
  }
}


































//yearly report


const yearlyReport = async (req, res) => {

  try {
    const { year, excel, pdf } = req.query
    console.log("queries")
    console.log(year)

    if (year && excel) {
      const startOfyear = new Date(`${year}-01-01T00:00:00.000Z`)
      const endOfyear = new Date(`${year}-12-31T00:00:00.000Z`);
      const customYearOrders = await order.find({ orderDate: { $gte: startOfyear, $lt: endOfyear } });

      if (!customYearOrders || customYearOrders.length === 0) {
        // return res.status(404).send("No orders found for the specified date range.");
        req.session.noOrders = true
        res.redirect('/admin/yearlyReport')
      }

      const headers = ["orderId", "payment", "subTotal", "totalQuantity", "discount", "orderDate", "status", "couponCode", "paymentStatus", "total"];
      const filePath = path.join(__dirname, "downloads", "sales-report.csv");
      const ws = fs.createWriteStream(filePath);

      const csvData = customYearOrders.map(order => {
        return {
          orderId: order.orderId,
          payment: order.payment,
          subTotal: order.subTotal,
          totalQuantity: order.totalQuantity,
          discount: order.discount,
          orderDate: order.orderDate,
          status: order.status,
          couponCode: order.couponCode,
          paymentStatus: order.paymentStatus,
          total: order.total,
        };
      });

      csv.write(csvData, { headers: headers }).pipe(ws)
        .on("finish", function () {
          res.download(filePath, "sales-report.csv", (err) => {
            if (err) {
              console.error("An error occurred while sending the file:", err);
            } else if (!customYearOrders || customYearOrders.length === 0) {
              req.session.noOrders = true
              res.redirect('/admin/yearlyReport')
            } else {
              console.log("File sent successfully.");
            }
          });
        })
        .on("error", function (err) {
          console.error("An error occurred while writing the file:", err);
        });


    } else if (year && pdf) {
      const doc = new PDFDocument();
      const startOfyear = new Date(`${year}-01-01T00:00:00.000Z`)
      const endOfyear = new Date(`${year}-12-31T00:00:00.000Z`);
      const customYearOrders = await order.find({ orderDate: { $gte: startOfyear, $lt: endOfyear } });

      if (!customYearOrders || customYearOrders.length === 0) {
        // return res.status(404).send("No orders found for the specified date range.");
        req.session.noOrders = true
        res.redirect('/admin/yearlyReport')
      }

      // Pipe its output to a file
      doc.pipe(fs.createWriteStream('sales-report.pdf'));

      // Add a title and some content
      doc.font('Helvetica-Bold')
        .fontSize(25)
        .text('Sales Report', {
          align: 'center'
        });

      const headers = ["Order ID", "Payment Method", "Sub Total", "Total Quantity", "Discount", "Order Date", "Status", "Coupon Code", "Payment Status", "Total"];

      // Add table headers to the PDF
      headers.forEach((header) => {
        doc.font('Helvetica-Bold')
          .fontSize(15)
          .text(header, {
            align: 'left',
            continued: true
          });
      });
      // Iterate over the orders and add each one to the PDF
      customYearOrders.forEach((order) => {
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.orderId, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.payment, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.subTotal, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.totalQuantity, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.discount, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.orderDate, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.status, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.couponCode, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.paymentStatus, {
            align: 'left',
            continued: true
          });
        doc.font('Helvetica')
          .fontSize(15)
          .text(order.total, {
            align: 'left'
          });
      });
      doc.end();
      res.download('./sales-report.pdf', (err) => {
        if (err) {
          console.error("An error occurred while sending the file:", err);
        } else if (!customYearOrders || customYearOrders.length === 0) {
          req.session.noOrders = true
          res.redirect('/admin/yearlyReport')
        } else {
          console.log("File sent successfully.");
          req.session.noOrders = false
          res.redirect('/admin/yearlylyReport')
        }
      });
    }
    if (year) {
      const startOfyear = new Date(`${year}-01-01T00:00:00.000Z`)
      const endOfyear = new Date(`${year}-12-31T00:00:00.000Z`);
      const customYearOrders = await order.find({ orderDate: { $gte: startOfyear, $lt: endOfyear } });

      const currentYearOrderCount = await order.find({ orderDate: { $gte: startOfyear, $lt: endOfyear } }).count()
      const cod = await order.find({
        orderDate: { $gte: startOfyear, $lt: endOfyear },
        payment: "Cod"
      }).count()
      const prepaid = await order.find({
        orderDate: { $gte: startOfyear, $lt: endOfyear },
        payment: "Online"
      }).count()
      console.log(customYearOrders);
      if (customYearOrders[0]) {
        const orders = customYearOrders.reduce((acc, curr) => {
          const data = {
            _id: curr._id,
            orderId: curr.orderId,
            address: curr.address,
            orderDate: moment.utc(curr.orderDate).local().format("DD MMM YYYY hh:mm:ss"),
            subTotal: curr.subTotal,
            paymentStatus: curr.paymentStatus,
            payment: curr.payment,
            status: curr.status,
          }
          acc.push(data)
          return acc;
        }, [])

        const totalRevenue = customYearOrders.reduce((acc, curr) => {
          const data = {
            subTotal: curr.subTotal
          };
          acc.push(data);
          return acc;
        }, []).reduce((sum, curr) => sum + curr.subTotal, 0);

        console.log(orders[0].orderDate + " kiran datas")

        res.render('admin/yearly-report', { orders, currentYearOrderCount, totalRevenue, cod, prepaid })

      } else {
        req.session.noOrders = true
        console.log("no orders in the particular date");
        res.redirect('/admin/yearlyReport')
      }
    } else {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const endOfYear = new Date(new Date().getFullYear(), 11, 31);
      const currentYearOrders = await order.find({ orderDate: { $gte: startOfYear, $lt: endOfYear } });
      const currentYearOrderCount = await order.find({ orderDate: { $gte: startOfYear, $lt: endOfYear } }).count();

      const cod = await order.find({
        orderDate: { $gte: startOfYear, $lt: endOfYear },
        payment: "Cod"
      }).count()
      const prepaid = await order.find({
        orderDate: { $gte: startOfYear, $lt: endOfYear },
        payment: "Online"
      }).count()
      if (currentYearOrders[0]) {
        const orders = currentYearOrders.reduce((acc, curr) => {
          const data = {
            _id: curr._id,
            orderId: curr.orderId,
            address: curr.address,
            orderDate: moment.utc(curr.orderDate).local().format("DD MMM YYYY hh:mm:ss"),
            subTotal: curr.subTotal,
            paymentStatus: curr.paymentStatus,
            payment: curr.payment,
            status: curr.status,
          }
          acc.push(data)
          return acc;
        }, [])
        const totalRevenue = currentYearOrders.reduce((acc, curr) => {
          const data = {
            subTotal: curr.subTotal
          };
          acc.push(data);
          return acc;
        }, []).reduce((sum, curr) => sum + curr.subTotal, 0);
        console.log("yes here it is")
        const { noOrders } = req.session
        console.log(noOrders + " boolean")
        res.render('admin/yearly-report', { orders, totalRevenue, currentYearOrderCount, noOrders: noOrders, cod, prepaid })
        req.session.noOrders = false
      }
    }

  } catch (error) {
    console.log(error.message + " error in Yearly Report ")
  }
}


//module export

module.exports = {
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
  unblockProduct,
  coupons,
  createCoupon,
  manageCoupon,
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

}