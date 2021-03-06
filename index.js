  'use strict';
  
  const line = require('@line/bot-sdk');
  const express = require('express');
  const bodyParser = require('body-parser'); 
  const multer = require('multer');
  const upload = multer(); 
  const fs = require('fs');

  //Word list
  const words = require('./words');

  //Put your LINE access token in the config file
  const conf = require('./config');

  //Create express app
  const app = express();

  //Router for mobile app use
  var mobilerouter = express.Router();

  mobilerouter.use(bodyParser.json({ limit: '5000kb'})); // for parsing application/json
  mobilerouter.use(bodyParser.urlencoded({ extended: true, limit: '5000kb'})); // for parsing application/x-www-form-urlencoded
  mobilerouter.use(bodyParser.raw({ limit: '5000kb'}));  // for parsing raw
 
  
  // create LINE SDK config from env variables
  const config = conf.config;
  
  // create LINE SDK client
  const client = new line.Client(config);

  var isDed = false;

  //Routes
  app.get('/', function (req, res) {
    res.send('Hello World!')
  })

  app.post('/callback', line.middleware(config), (req, res) => {
    if(isDed) {
      Promise
      .all(req.body.events.map(handleDead)); 
    }
    else{
    Promise
      .all(req.body.events.map(handleEventWithName))
      .then((result) => res.json(result));
    }
  });

  mobilerouter.post('/test', (req, res) => {
    res.send('halo');
  });

  mobilerouter.post('/', (req, res) => {
    console.log("Congratulations");
  
    var replyString;
    var b64image = req.body.image_path;

    req.body ? console.log(req.body) : console.log('none');
    req.file ? console.log(req.file) : console.log('none');

    fs.writeFile('default.jpg', b64image, 'base64', function (err) {
      console.log(err);
    });
         
    const spawn = require('child_process').spawn;
    const pyproc = spawn('python3', ["classify_image.py", "--image_file", "default.jpg"]);
            
    pyproc.stdout.on('data', (data) => {
      replyString = String(data);
    });
            
    pyproc.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });
                  
    pyproc.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    
      var replyArrayString = replyString ? replyString.split(",") : ("a,a");
    
      const echo = { type: 'text', text: "sepertinya itu adalah " + replyArrayString[0]};
      console.log(echo);
    
      res.send(replyArrayString[0]);
    });
  });

  app.use('/mobilecallback', mobilerouter);

  //Main event handler
  function handleEventWithName(event) {
    if (event.type !== 'message') {
        // ignore non-text-message event
        return Promise.resolve(null);
      }

    // Case for image and text messages
    if (event.message.type === 'image') {
      var replyString;

      client.getMessageContent(event.message.id)
      .then((stream) => {
        stream.pipe(fs.createWriteStream('default.jpg'));
      })
      .then(() => {
        const spawn = require('child_process').spawn;
        const pyproc = spawn('python3', ["classify_image.py", "--image_file", "default.jpg"]);
        
        pyproc.stdout.on('data', (data) => {
          replyString = String(data);
        });
        
        pyproc.stderr.on('data', (data) => {
          console.log(`stderr: ${data}`);
        });
              
        pyproc.on('close', (code) => {
          console.log(`child process exited with code ${code}`);

          var replyArrayString = replyString.split(",")
          replyArrayString = replyArrayString[0].split(" (")

          const echo = { type: 'text', text: "sepertinya itu adalah " + replyArrayString[0]};
          return client.replyMessage(event.replyToken, echo);
        });
      });
    } 
    else if (event.message.type === 'text') {
      var arrayOfStrings = event.message.text.split(" "); 
      if (/(h|H)alo/.test(event.message.text)) {
        var name;
        console.log(event.source.userId);    
        client.getProfile(event.source.userId)
        .then((profile) => {
            console.log(profile.displayName);
            name = profile.displayName;   

            var msg = 'hello ' + name;
            const echo = { type: 'text', text: msg };
            return client.replyMessage(event.replyToken, echo);
          })
      }  
      else if(/(a|A)pakah/.test(arrayOfStrings[0])) {
          console.log(event.message.text);
          var wibu;
          var deawibu;

          wibu = arrayOfStrings.some((string) => {
            return /(w|W)ibu/.test(string);
          });
          
          if(wibu){
            const echo = { type: 'text', text: "Selamat, anda sangat wibu" };
            return client.replyMessage(event.replyToken, echo);
          }
          const echo = { type: 'text', text: Math.random() > 0.49 ? "ya" : "tidak" };
          return client.replyMessage(event.replyToken, echo);
      }
      else if(/([^.?!]*)\?$/.test(event.message.text)) {
        var reply = Math.random() < 0.70 ? "Sebaiknya anda " + words.katakerja[Math.floor(Math.random() * words.katakerja.length)] + 
        " " + words.katabenda[Math.floor(Math.random() * words.katabenda.length)] : words.quotes[Math.floor(Math.random() * words.quotes.length)];

        const echo = { type: 'text', text: reply}
        return client.replyMessage(event.replyToken, echo);
      }
      else if (event.message.text === 'woof') {
          const pic = { type: 'image', 
          originalContentUrl: 'https://t1.rbxcdn.com/05bc39f41d747418cfd98e3c667b367d',
          previewImageUrl:  'https://t1.rbxcdn.com/05bc39f41d747418cfd98e3c667b367d'};
          return client.replyMessage(event.replyToken, pic);
      }
      else if (event.message.text === '!kill') {
        isDed = true;
      }
      else if (event.message.text === 'activate') {
        isDed = false;
      }
      else {
        return Promise.resolve(null);
      }
    }
  }

  function handleDead(event) {
    if (event.message.text === 'activate') {
      isDed = false;
      const echo = { type: 'text', text: 'Salam kenal, saya adalah pengganti'};
      return client.replyMessage(event.replyToken, echo);
    }
  }
  
  // listen on port
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`listening on ${port}`);
  });
  