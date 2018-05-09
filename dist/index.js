'use strict';

require('dotenv').config();

var _require = require("./fetch"),
    Fetch = _require.Fetch;

var _require2 = require("./utils"),
    Utils = _require2.Utils;

var line = require('@line/bot-sdk');
var express = require('express');
var axios = require('axios');

// create LINE SDK config from env variables
var config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

var client = new line.Client(config);
var app = express();
var fetch = new Fetch(client);

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), function (req, res) {
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }

  // handle events separately
  Promise.all(req.body.events.map(handleEvent)).then(function () {
    return res.end();
  }).catch(function (err) {
    console.error(err);
    res.status(500).end();
  });
});

function handleEvent(event) {
  switch (event.type) {
    case 'message':
      var message = event.message;
      switch (message.type) {
        case 'text':
          return handleText(message, event.replyToken, event.source);
        case 'sticker':
          return handleSticker(message, event.replyToken);
        case 'location':
          return handleLocation(message, event.replyToken);
        default:
          throw new Error('Unknown message: ' + JSON.stringify(message));
      }

    case "postback":
      var data = Utils.toObject(event.postback.data);
      console.log(data.type);
      switch (data.type) {
        case 'DATE':
          return fetch.fetchGameByDate(event.postback.params.date, event.replyToken);
        case 'playersStats':
          return fetch.fetchPlayersStatsByGameId(data.teamId, data.gameId, data.date, event.replyToken);
        case 'gamble':
          console.log("nothing");
        default:
          throw new Error('Unknown data: ' + JSON.stringify(data));
      }
    case 'follow':
      return Utils.replyText(client, event.replyToken, 'Got followed event');

    case 'unfollow':
      return console.log('Unfollowed this bot: ' + JSON.stringify(event));

    case 'join':
      return Utils.replyText(client, event.replyToken, 'Joined ' + event.source.type);

    case 'leave':
      return console.log('Left: ' + JSON.stringify(event));

    default:
      throw new Error('Unknown event: ' + JSON.stringify(event));
  }
}

function handleText(message, replyToken, source) {
  switch (message.text) {
    case 'profile':
      if (source.userId) {
        return client.getProfile(source.userId).then(function (profile) {
          return Utils.replyText(client, replyToken, ['Display name: ' + profile.displayName, 'Status message: ' + profile.statusMessage]);
        });
      } else {
        return Utils.replyText(client, replyToken, 'Bot can\'t use profile API without user ID');
      };
    case 'confirm':
      return client.replyMessage(replyToken, {
        type: 'template',
        altText: 'Datetime pickers alt text',
        template: {
          type: 'buttons',
          text: 'Welcome to NBA Chatbot',
          actions: [{
            type: 'datetimepicker',
            label: 'Game by date',
            data: 'type=DATE',
            mode: 'date'
          }]
        }
      });

    case 'bye':
      switch (source.type) {
        case 'user':
          return Utils.replyText(client, replyToken, 'Bot can\'t leave from 1:1 chat');
        case 'group':
          return Utils.replyText(client, replyToken, 'Leaving group').then(function () {
            return client.leaveGroup(source.groupId);
          });
        case 'room':
          return Utils.replyText(client, replyToken, 'Leaving room').then(function () {
            return client.leaveRoom(source.roomId);
          });
      }
    default:
      console.log('Echo message to ' + replyToken + ': ' + message.text);
      return Utils.replyText(client, replyToken, message.text);
  }
}

function handleSticker(message, replyToken) {
  return client.replyMessage(replyToken, {
    type: 'sticker',
    packageId: message.packageId,
    stickerId: message.stickerId
  });
}

// listen on port
var port = process.env.PORT || 8080;
app.listen(port, function () {
  console.log('listening on ' + port);
});