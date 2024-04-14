exports.getUpload = (req,res,next) =>{
    res.send("inside mail controller")
}

exports.postUpload = (req,res,next)=>{
    console.log('inside post upload');
    console.log(req.file);
    res.json(req.file);
}