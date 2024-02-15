require('dotenv').config();
let bodyParser = require('body-parser');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

try {
  const conectionMongoDB = mongoose.connection.once('open', () => {
       console.log("MongoDB database connected ")
  });
  
} catch ({name, message}) {
  console.error.bind(console, `Mongoose DB error: ${name} : ${message}`);
}

const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: Number
});


let DBUrl = mongoose.model("DBUrl", urlSchema); 


// Basic Configuration
const port = process.env.PORT || 3000;


app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
}).post("/api/shorturl", async (req, res) => {
  req.body;
  try {
    const url = new URL(req.body.url);

    const httpRegex = /^(http|https)(:\/\/)/;
    if (!httpRegex.test(url)) {return res.json({ error: 'invalid url' })}

    let urlInDB = await DBUrl.findOne({ original_url: url });

    if (urlInDB) {
      res.json({ original_url: urlInDB.original_url, short_url: urlInDB.short_url });
    } else {
     
      const count = await DBUrl.countDocuments({});

      const newUrl = new DBUrl({ original_url: url, short_url: count + 1 });

      await newUrl.save();


      res.json({ original_url: newUrl.original_url, short_url: newUrl.short_url});
    }
  } catch ({name, message}) {
    console.log( name + ": "+ message );
  res.json({ error: "Invalid URL" });
    
  }
  
}).get("/api/shorturl/:short_url?", async (req, res) => {
     
  const shortUrl = req.params.short_url;

  // getting url for db by short_url
  const urlData = await DBUrl.findOne({ short_url: shortUrl });
  if (urlData) {
    res.redirect(urlData.original_url);
  } else {
    res.json({ error: 'Invalid URL' });
  }
  
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
