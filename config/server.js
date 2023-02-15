//connecting mongoose to mongodb database

var mongoose=require('mongoose')
require ("dotenv").config()

 const url = process.env.url;

mongoose.set("strictQuery", false);
mongoose
  .connect(url, { useNewUrlParser: true })
  .then(() => {
    console.log("data base connected");
  })
  .catch((error) => {
    console.log("error occured", error);
  });
  