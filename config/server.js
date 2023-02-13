//connecting mongoose to mongodb database


var mongoose=require('mongoose')

const url = "mongodb://127.0.0.1:27017/BESTSHOPPY";

mongoose.set("strictQuery", false);
mongoose
  .connect(url, { useNewUrlParser: true })
  .then(() => {
    console.log("data base connected");
  })
  .catch((error) => {
    console.log("error occured", error);
  });
  