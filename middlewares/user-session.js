
const user=(req,res,next)=>{
    if(req.session.login){
        console.log('have session safad');
        next();
    }
    else{
        console.log("no session safad")
        res.redirect('/login')
    }
}

module.exports=user