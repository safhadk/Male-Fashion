//connecting mongoose to mongodb database


var mongoose=require('mongoose')

// const url = "mongodb://127.0.0.1:27017/BESTSHOPPY";
 const url = "mongodb+srv://safad:skktkl4455%40atlas@cluster0.dy5gyxe.mongodb.net/BESTSHOPPY";


mongoose.set("strictQuery", false);
mongoose
  .connect(url, { useNewUrlParser: true })
  .then(() => {
    console.log("data base connected");
  })
  .catch((error) => {
    console.log("error occured", error);
  });
  