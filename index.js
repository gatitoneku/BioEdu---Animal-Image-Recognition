  'use strict';
  
  const line = require('@line/bot-sdk');
  const express = require('express');
  //const axios = require('axios');
  const fs = require('fs');

  const words = require('./words');
  
  // create LINE SDK config from env variables
  const config = {
    channelAccessToken: 'ty6j1NgXbxTY3sVWTk13TbOAvlC6TNtY0EBvSZw02JC+rCRLNcTioRERLgPrfvylOnwCk+rQJW7lYtkSidiH86mHUzkP1ERKcjcC2uLVNM4YfPpOmmeyhW6ojEpN5O/w0G8j/IoF08wRJIplxUfkDQdB04t89/1O/w1cDnyilFU=',
    channelSecret: '5140e8e814e0a4af5f0e8fc9e0e88753'
  };
  
  // create LINE SDK client
  const client = new line.Client(config);
  
  // create Express app
  // about Express itself: https://expressjs.com/
  const app = express();

  var isDed = true;
  
  // register a webhook handler with middleware
  // about the middleware, please refer to doc
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

  app.get('/', function (req, res) {
    res.send('Hello World!')
  })
  
  // event handler
  function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
      // ignore non-text-message event
      return Promise.resolve(null);
    }
  
    // create a echoing text message
    const echo = { type: 'text', text: event.message.text };
  
    // use reply API
    return client.replyMessage(event.replyToken, echo);
  }

  function handleEventWithName(event) {
    if (event.type !== 'message') {
        // ignore non-text-message event
        return Promise.resolve(null);
      }
   
    if (event.message.type === 'image') {
      client.getMessageContent(event.message.id)
      .then((stream) => {
        stream.pipe(fs.createWriteStream('default.jpg'));
      })
      .then(() => {
        const spawn = require('child_process').spawn;
        const pyproc = spawn('python3', ["./classify_image.py", "--image_file default.jpg"]);
        
              pyproc.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
              });
        
              pyproc.stderr.on('data', (data) => {
                console.log(`stderr: ${data}`);
              });
              
              pyproc.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
              });
      })
    } 
    else if (event.message.type === 'text') {
      var arrayOfStrings = event.message.text.split(" "); 
      if (event.message.text === 'halo') {
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
          arrayOfStrings.forEach((string) => {
            wibu = /(w|W)ibu/.test(string);
          })
          if(wibu){
            const echo = { type: 'text', text: "Selamat, anda sangat wibu" };
            return client.replyMessage(event.replyToken, echo);
          }
          const echo = { type: 'text', text: Math.random() > 0.49 ? "ya" : "tidak" };
          return client.replyMessage(event.replyToken, echo);
      }
      else if(/([^.?!]*)\?$/.test(event.message.text)) {
        var reply = "Sebaiknya anda " + words.katakerja[Math.floor(Math.random() * words.katakerja.length)] + 
        " " + words.katabenda[Math.floor(Math.random() * words.katabenda.length)];

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
        const echo = { type: 'text', text: event.message.text };
        return client.replyMessage(event.replyToken, echo);
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
  