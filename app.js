const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

//session 
const session = require("express-session");
const nocache = require("nocache");

require('dotenv').config()

//requiring server module from model folder that connected mongoose to database
const db = require("./config/server");

//routers / require two router from routes folder
const adminRouter = require('./routes/admin_router');
const userRouter = require('./routes/user_router');


const app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

//session
app.use(
  session({
    secret: process.env.sessionKey,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 600000000 },
  })
);

app.use(nocache());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



app.use('/admin', adminRouter);
app.use(userRouter);

userRouter.get('/', (req, res, next) => {
  if (req.originalUrl.slice(-1) === '/') {
    const newUrl = req.originalUrl.slice(0, -1);
    return res.redirect(301, newUrl);
  }
  next();
});



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status );
  res.render('error');
});

app.listen(process.env.portNumber, () => {
  console.log('Server is running on port 3000');
});




