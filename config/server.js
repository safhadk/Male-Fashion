//connecting mongoose to mongodb database

var mongoose=require('mongoose')
require ("dotenv").config()

// const url = "mongodb://127.0.0.1:27017/BESTSHOPPY";
 const url = process.env.url;
console.log(url,1212121);

mongoose.set("strictQuery", false);
mongoose
  .connect(url, { useNewUrlParser: true })
  .then(() => {
    console.log("data base connected");
  })
  .catch((error) => {
    console.log("error occured", error);
  });
  