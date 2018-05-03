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
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }

  // handle events separately
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// simple reply function
const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage(
    token,
    texts.map((text) => ({ type: 'text', text }))
  );
};

// event handler
function handleEvent(event) {

  switch (event.type) {
    case 'message':
      const message = event.message;
      switch (message.type) {
        case 'text':
          return handleText(message, event.replyToken, event.source);
        case 'sticker':
          return handleSticker(message, event.replyToken);
        case 'location':
          return handleLocation(message, event.replyToken);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }

    case "postback":
      const data = event.postback.data;
      switch (data) {
        case 'score':
          return fetchScore(data, event.replyToken);
        case 'live':
          return fetchScore(data, event.replyToken);
        default:
          throw new Error(`Unknown data: ${JSON.stringify(data)}`);
      }
    case 'follow':
      return replyText(event.replyToken, 'Got followed event');

    case 'unfollow':
      return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);

    case 'join':
      return replyText(event.replyToken, `Joined ${event.source.type}`);

    case 'leave':
      return console.log(`Left: ${JSON.stringify(event)}`);

    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}

function fetchScore(data, replyToken){
	return axios.get('http://stats.nba.com/stats/scoreboard/?GameDate=02/14/2015', {
		params: {
			LeagueID: "00",
			DayOffset: "0"
		}
	})
	.then(function (response) {
		return replyText(replyToken, response.data.resultSets[4].rowSet[0])
	})
	.catch(function (error) {
		console.log(error);
	});
}

function handleText(message, replyToken, source) {

  switch (message.text) {
    case 'profile':
      if (source.userId) {
        return client.getProfile(source.userId)
          .then((profile) => replyText(
            replyToken,
            [
              `Display name: ${profile.displayName}`,
              `Status message: ${profile.statusMessage}`,
            ]
          ));
      } else {
        return replyText(replyToken, 'Bot can\'t use profile API without user ID');
      };
    case 'confirm':
      return client.replyMessage(
        replyToken, 
		{
		  "type": "template",
		  "altText": "Function Menu",
		  "template": {
		      "type": "carousel",
		      "columns": [
		          {
		            //"thumbnailImageUrl": "https://example.com/bot/images/item1.jpg",
		            "imageBackgroundColor": "#FFFFFF",
		            "title": "Function Menu",
		            "text": "description",
		            "defaultAction": {
		                "type": "uri",
		                "label": "View detail",
		                "uri": "http://example.com/page/123"
		            },
		            "actions": [
		                {
		                    "type": "postback",
		                    "label": "Score",
		                    "data": "score"
		                },
		                {
		                    "type": "postback",
		                    "label": "Live Report",
		                    "data": "live"
		                },
		                {
		                    "type": "uri",
		                    "label": "View detail",
		                    "uri": "http://example.com/page/111"
		                }
		            ]
		          },
		          {
		            //"thumbnailImageUrl": "https://example.com/bot/images/item1.jpg",
		            "imageBackgroundColor": "#FFFFFF",
		            "title": "Function Menu",
		            "text": "description",
		            "defaultAction": {
		                "type": "uri",
		                "label": "View detail",
		                "uri": "http://example.com/page/123"
		            },
		            "actions": [
		                {
		                    "type": "postback",
		                    "label": "Score",
		                    "data": "score"
		                },
		                {
		                    "type": "postback",
		                    "label": "Live Report",
		                    "data": "live"
		                },
		                {
		                    "type": "uri",
		                    "label": "View detail",
		                    "uri": "http://example.com/page/111"
		                }
		            ]
		          }
		      ],
		      "imageAspectRatio": "rectangle",
		      "imageSize": "cover"
		  }
		}
        
      );
    case 'datetime':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: 'Datetime pickers alt text',
          template: {
            type: 'buttons',
            text: 'Select date / time !',
            actions: [
              { type: 'datetimepicker', label: 'date', data: 'DATE', mode: 'date' },
              { type: 'datetimepicker', label: 'time', data: 'TIME', mode: 'time' },
              { type: 'datetimepicker', label: 'datetime', data: 'DATETIME', mode: 'datetime' },
            ],
          },
        }
      );
    case 'bye':
      switch (source.type) {
        case 'user':
          return replyText(replyToken, 'Bot can\'t leave from 1:1 chat');
        case 'group':
          return replyText(replyToken, 'Leaving group')
            .then(() => client.leaveGroup(source.groupId));
        case 'room':
          return replyText(replyToken, 'Leaving room')
            .then(() => client.leaveRoom(source.roomId));
      }
    default:
      console.log(`Echo message to ${replyToken}: ${message.text}`);
      return replyText(replyToken, message.text);
  }
}

function handleSticker(message, replyToken) {
  return client.replyMessage(
    replyToken,
    {
      type: 'sticker',
      packageId: message.packageId,
      stickerId: message.stickerId,
    }
  );
}

function handleLocation(message, replyToken) {
  return client.replyMessage(
    replyToken,
    {
      type: 'location',
      title: message.title,
      address: message.address,
      latitude: message.latitude,
      longitude: message.longitude,
    }
  );
}


// listen on port
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});