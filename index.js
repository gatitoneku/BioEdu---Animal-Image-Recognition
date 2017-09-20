  'use strict';
  
  const line = require('@line/bot-sdk');
  const express = require('express');
  
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
  
  // register a webhook handler with middleware
  // about the middleware, please refer to doc
  app.post('/callback', line.middleware(config), (req, res) => {
    
    Promise
      .all(req.body.events.map(handleEventWithName))
      .then((result) => res.json(result));
    
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
    if (event.type !== 'message' || event.message.type !== 'text') {
        // ignore non-text-message event
        return Promise.resolve(null);
      }
      var name;
      console.log(event.source.userId);    
      client.getProfile(event.source.userId)
      .then((profile) => {
          console.log(profile.displayName);
          name = profile.displayName;   

          var msg = 'hello' + name;
          // create a echoing text message
          const echo = { type: 'text', text: msg };


      // use reply API
      return client.replyMessage(event.replyToken, echo);
        })
    
  }
  
  // listen on port
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`listening on ${port}`);
  });
  