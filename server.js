//Import dependencies modules:
const express = require("express");
//const bodyParser = require('body-parser')

const path = require('path');
const morgan = require('morgan');
const fs = require("fs");

//Create an Express.js instance:
const app = express();

//config Express.js
app.use(express.json());
app.set("port", 3000);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  next();
});

//connect to MongoDB
const MongoClient = require("mongodb").MongoClient;

let db;
MongoClient.connect(
  "mongodb+srv://mrKnapsack:Admin@cluster0.htsndkb.mongodb.net/",
  (err, client) => {
    db = client.db("Webstore");
  }
);

// Logger middleware
app.use(morgan('common'));

// Static file middleware for lesson images
app.use('/images', (req, res, next) => {
  const imagePath = path.join(__dirname, 'images', req.url);
  fs.access(imagePath, fs.constants.F_OK, (err) => {
      if (err) {
          res.status(404).send('Image not found');
      } else {
          res.sendFile(imagePath);
      }
  });
});

//display a message for root path to show tha API is working
app.get("/", (req, res, next) => {
  res.send("Select a collection, e.g., /collection/messages");
});

// get the collection name
app.param("collectionName", (req, res, next, collectionName) => {
  req.collection = db.collection(collectionName);
  //console.log('collection name: req.collection)
  return next();
});
//retrieve all the objects from an collection
app.get("/collection/:collectionName", (req, res, next) => {
  req.collection.find({}).toArray((e, results) => {
    if (e) return next(e);
    res.send(results);
  });
});
// adding post
app.post("/collection/:collectionName", (req, res, next) => {
  req.collection.insert(req.body, (e, results) => {
    if (e) return next(e);
    res.send(results.ops);
  });
});
// return with object id

const objectID = require("mongodb").ObjectID;
app.get("/collection/:collectionName/:id", (req, res, next) => {
  req.collection.findOne({ _id: new objectID(req.params.id) }, (e, result) => {
    if (e) return next(e);
    res.send(result);
  });
});


app.delete('/collection/:collectionName/:id', (req, res, next) => {
  req.collection.deleteOne(
    {_id: objectID(req.params.id)},
    (e, result) => {
      if (e) return next(e)
        res.send((result.result.n === 1) ? {msg: 'success'}: {msg: 'error'})
    })
})

// GET route to handle search functionality
// Search route
app.get("/:collectionName/search", (req, res, next) => {
  const query = req.query.q;
  const searchCriteria = {
    $or: [
      { subject: { $regex: query, $options: "i" } },
      { location: { $regex: query, $options: "i" } }
    ]
  };
  
  db.collection("Webstore").find(searchCriteria).toArray((err, results) => {
    if (err) return next(err);
    res.send(results);
  });
});


app.listen(3000, () => {
  console.log("Express.js server running at localhost:3000");
});
