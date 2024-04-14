const bodyParser = require('body-parser');
const express= require('express');
const cors = require('cors');
const { ObjectId } = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const { check,validationResult } = require('express-validator');

const uploadController = require('./controller/upload');
const multer = require('multer');
const url = "mongodb+srv://sachinv2299:password%401Ab@self1.qlpea3s.mongodb.net/database1"

const app = express();

app.use(cookieParser())
app.use(bodyParser.json())
app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000' //client host
  }));

// app.use((req,res,next)=>{
//     res.header('Access-Control-Allow-Credentials',true);
//     res.header('Access-Control-Allow-Origin','*');
//     res.header('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept, Authorization, X-HTTP-Method-Override')
//     res.header('Access-Control-Allow-Method','GET, POST, PUT, PATCH, DELETE');

//     next();
// })

// app.use(session({secret:'my secret',resave:false,saveUninitialized:false}))
app.use(bodyParser.urlencoded({extended:false}))
// home all the data
app.get('/',async (req,res,next)=>
{
    const client = new MongoClient(url);
    let data;
    try{
        await client.connect();
        const db = client.db();
        data = await db.collection('collection1').find().toArray();
        console.log(data);
    }
    catch(err)
    {
        console.log(err);

    }
    let a= JSON.stringify('hello world');
    res.send(data);
    next();
})

// posting a new data
app.post('/',async (req,res,next)=>{
    console.log(req.body);
    let obj = {
        name:req.body.name,
        age:req.body.age
    }
    const client = new MongoClient(url);
    let product;
    try {
        await client.connect()
        const db = client.db();
        product= await db.collection('collection1').insertOne(obj);
    }
    catch(error) {
        console.log(error)
    }
    client.close();
    res.json(product)
    next();
})

// delete a data by id
app.delete('/:id',async (req,res,next)=>{
    const client = new MongoClient(url);
    const id = req.params.id;
    try {
        await client.connect()
        const db = client.db();
        const product= await db.collection('collection1').deleteOne({
            _id: new ObjectId(id)
        });
    }
    catch(error) {
        console.log(error)
    }
    res.send(JSON.stringify("Document deleted successfully"));
    next();
})

// finding a data by id
app.get('/formData/:id',async (req,res,next)=>{
    const id= req.params.id;
    console.log(id);
    const client = new MongoClient(url);
    let data;
    console.log('inside get')
    try{
        await client.connect();
        const db = client.db();
        data = await db.collection('collection1').findOne({
            _id: new ObjectId(id)
        });
        console.log(data);
    }
    catch(err){
        console.log(err);

    }
    client.close();
    res.send(data)
    next();
})

// finding and updating a data by id
app.patch('/formData/:id',async (req,res,next)=>{
    const id = req.params.id;
    const client = new MongoClient(url);
    const {name,age} = req.body;
    console.log('inside formdata update')
    try{
        await client.connect();
        const db = client.db();
        data = await db.collection('collection1')
            .updateOne(
                {_id: new ObjectId(id)},
                {
                    $set:{'name':name,'age':age}
                }
            )
    }
    catch(err){
        console.log(err);
    }
    res.json("update done successfully")
    next();
});

// signup part

app.post('/user',[
    check('email')
        .isEmail()
        .withMessage("please check the Email."),
    check('password')
        .isLength({min:5})
        .withMessage("incorrect path length")
    ],
    async (req,res,next)=>
{
    console.log('inside signup')
    const {email,password} = req.body;
    const errors = validationResult(req);
    console.log('hi----',errors.array())
    if(!errors.isEmpty())
    {
        return res.json({error:errors.array()[0].msg})
    }
    const client = new MongoClient(url);

    let existing;
    try{
        await client.connect();
        const db = client.db();
        existing = await db.collection('user')
            .findOne({
                email:email,
            })
    }
    catch(err)
    {
        console.log(err);
    }
    if(existing)
    {
        console.log('inside existing');
        return res.json({alreadyExist:true});
    }
    let hashedPassword;
    try{
        hashedPassword = await bcrypt.hash(password,12);
    }
    catch(err)
    {
        console.log('error in bcrypt');
    }
    let data;
    try{
        await client.connect();
        const db = client.db();
        data = await db.collection('user')
            .insertOne({
                email:email,
                password:hashedPassword
            })
    }
    catch(err){
        console.log(err);
    }
    res.status(201).send(data);
})


// logging the user 

app.post('/login',check('email').isEmail().withMessage("please enter a valid Email"),async (req,res,next)=>{
    const {email,password,logout} =req.body;
    const errors = validationResult(req)
    console.log('line no. 196---------',errors)
    console.log(email,password);
    let hashedPassword;  
    const client = new MongoClient(url);
    let data;
    try{
        await client.connect();
        const db = client.db();
        data = await db.collection('user')
                .findOne({
                    email:email
                })
        console.log('line no.213',data)
    }
    catch(err){
        console.log(err);
    }
    if(!data)
    {
        return res.json("this email doesn't exist")
    }
    try{
        console.log('line no.223',data);
        hashedPassword = await bcrypt.compare(password,data.password);
    }
    catch(err)
    {
        console.log(err);
    }
    if(data && hashedPassword)
    {
        console.log(hashedPassword)
        // req.session.isLoggedIn=true;
        res.cookie("isLoggedIn",true)
        res.json({login:true})
        res.end();
    }
})

app.post('/logout',(req,res,next)=>{
    res.clearCookie('isLoggedIn')
    return res.end('successfully logged out')

})

app.get('/login', async(req,res,next)=>{
    const isLoggedIn = req.cookies
    console.log(isLoggedIn);
    res.json(isLoggedIn);
})


app.post('/session',(req,res,next)=>{
    req.session.temp="yes there"
    console.log(req.session);
    res.json({session:'session done'});
})


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'images')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now()
      cb(null, uniqueSuffix + '-' + file.originalname)
    }
  })
  
  const upload = multer({ storage: storage })

app.get('/upload',uploadController.getUpload);

app.post('/upload',upload.single('image'),uploadController.postUpload);

app.listen(8000);
