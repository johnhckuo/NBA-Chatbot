'use strict';
require('dotenv').config()
const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios');

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
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
    .all(req.body.events.map(handleEvent))
    .then((result) => {
      replyMessage(result);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

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

// listen on port
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

// curl -v -X POST  \
// -H 'Content-Type:application/json' \
// -H 'Authorization: Bearer {channel access token}' \
// -d ''
// reply messages


function replyMessage(replyToken){
  axios({
    method: 'post',
    url: 'https://api.line.me/v2/bot/message/reply',
    headers: {'content-type': "application/json", "Authorization": `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`},
    data: {
        "replyToken":replyToken,
        "messages":[
            {
                "type":"text",
                "text":"Hello, user"
            },
            {
                "type":"text",
                "text":"May I help you?"
            }
        ]
    }
    })
    .then(function (response) {
      console.log(response);
    })
    .catch(function (error) {
      console.log(error);
  });
}
