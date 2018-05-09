'use strict';

var _require = require('./data/teams'),
    teams = _require.teams;

require('dotenv').config();
var line = require('@line/bot-sdk');
var express = require('express');
var axios = require('axios');

// create LINE SDK config from env variables
var config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

// create LINE SDK client
var client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
var app = express();

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

var replyText = function replyText(token, texts) {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage(token, texts.map(function (text) {
    return {
      type: 'text',
      text: text
    };
  }));
};

// simple reply function
var replyGameByDate = function replyGameByDate(games, token) {
  games = Array.isArray(games) ? games : [games];
  return client.replyMessage(token, {
    "type": "template",
    "altText": "Function Menu",
    "template": {
      "type": "carousel",
      "columns": games.map(function (game) {
        var startDate = new Date(game.startTimeUTC);

        var year = startDate.getFullYear();
        var month = startDate.getMonth() < 10 ? "0" + (startDate.getMonth() + 1).toString() : startDate.getMonth();
        var date = startDate.getDate() < 10 ? "0" + startDate.getDate().toString() : startDate.getDate();

        var isStarted = typeof game.endTimeUTC === "undefined" ? false : true;
        var description = isStarted ? 'Game Ended. Final score: ' + game.vTeam.score + ' : ' + game.hTeam.score : 'Game starts at ' + startDate.toString();
        description = description.split("GMT")[0] + "\n" + game.playoffs.seriesSummaryText;

        var actions = isStarted ? [{
          "type": "postback",
          "label": teams.league.standard[game.hTeam.teamId].nickname + ' Stats',
          "data": 'type=playersStats&teamId=' + game.hTeam.teamId + '&gameId=' + game.gameId + '&date=' + (year + month + date)
        }, {
          "type": "postback",
          "label": teams.league.standard[game.vTeam.teamId].nickname + ' Stats',
          "data": 'type=playersStats&teamId=' + game.hTeam.teamId + '&gameId=' + game.gameId + '&date=' + (year + month + date)
        }] : [{
          "type": "postback",
          "label": "Subscribe",
          "data": game.gameId
        }];
        return {
          //"thumbnailImageUrl": "https://example.com/bot/images/item1.jpg",
          "imageBackgroundColor": "#FFFFFF",
          "title": teams.league.standard[game.vTeam.teamId].nickname + " vs. " + teams.league.standard[game.hTeam.teamId].nickname,
          "text": description,
          "actions": actions
        };
      }),
      "imageAspectRatio": "rectangle",
      "imageSize": "cover"
    }
  });
};

// simple reply function
var fetchPlayersStatsByGameId = function fetchPlayersStatsByGameId(teamId, gameId, date, replyToken) {
  return axios.get('http://data.nba.net/prod/v1/' + date + '/' + gameId + '_Book.pdf', {
    params: {}
  }).then(function (response) {
    return replyText(replyToken, response.data.games);
  }).catch(function (error) {
    console.log(error);
  });
};

function toObject(data) {
  var response = [];
  data.split("&").map(function (subset) {
    response[subset.split("=")[0]] = subset.split("=")[1];
  });
  return response;
}

// event handler
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
      var data = toObject(event.postback.data);
      switch (data.type) {
        case 'DATE':
          return fetchGameByDate(event.postback.params.date, event.replyToken);
        case 'playersStats':
          return fetchPlayersStatsByGameId(data.teamId, data.gameId, data.date, event.replyToken);
        default:
          throw new Error('Unknown data: ' + JSON.stringify(data));
      }
    case 'follow':
      return replyText(event.replyToken, 'Got followed event');

    case 'unfollow':
      return console.log('Unfollowed this bot: ' + JSON.stringify(event));

    case 'join':
      return replyText(event.replyToken, 'Joined ' + event.source.type);

    case 'leave':
      return console.log('Left: ' + JSON.stringify(event));

    default:
      throw new Error('Unknown event: ' + JSON.stringify(event));
  }
}

// function fetchPlayerByGameId(id, replyToken) {
//   return axios.get(`http://data.nba.net/prod/v1/2017/teams/{{teamUrlCode}}/leaders.json`, {
//       params: {}
//     })
//     .then(function(response) {
//       return replyGameByDate(response.data.games, replyToken)
//     })
//     .catch(function(error) {
//       console.log(error);
//     });
// }

function fetchGameByDate(date, replyToken) {
  date = date.split("-").join("");
  return axios.get('http://data.nba.net/prod/v1/' + date + '/scoreboard.json', {
    params: {}
  }).then(function (response) {
    return replyGameByDate(response.data.games, replyToken);
  }).catch(function (error) {
    console.log(error);
  });
}

function handleText(message, replyToken, source) {

  switch (message.text) {
    case 'profile':
      if (source.userId) {
        return client.getProfile(source.userId).then(function (profile) {
          return replyText(replyToken, ['Display name: ' + profile.displayName, 'Status message: ' + profile.statusMessage]);
        });
      } else {
        return replyText(replyToken, 'Bot can\'t use profile API without user ID');
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
    case 'datetime':
      return client.replyMessage(replyToken, {
        type: 'template',
        altText: 'Datetime pickers alt text',
        template: {
          type: 'buttons',
          text: 'Select date / time !',
          actions: [{
            type: 'datetimepicker',
            label: 'date',
            data: 'DATE',
            mode: 'date'
          }, {
            type: 'datetimepicker',
            label: 'time',
            data: 'TIME',
            mode: 'time'
          }, {
            type: 'datetimepicker',
            label: 'datetime',
            data: 'DATETIME',
            mode: 'datetime'
          }]
        }
      });
    case 'bye':
      switch (source.type) {
        case 'user':
          return replyText(replyToken, 'Bot can\'t leave from 1:1 chat');
        case 'group':
          return replyText(replyToken, 'Leaving group').then(function () {
            return client.leaveGroup(source.groupId);
          });
        case 'room':
          return replyText(replyToken, 'Leaving room').then(function () {
            return client.leaveRoom(source.roomId);
          });
      }
    default:
      console.log('Echo message to ' + replyToken + ': ' + message.text);
      return replyText(replyToken, message.text);
  }
}

function handleSticker(message, replyToken) {
  return client.replyMessage(replyToken, {
    type: 'sticker',
    packageId: message.packageId,
    stickerId: message.stickerId
  });
}

function handleLocation(message, replyToken) {
  return client.replyMessage(replyToken, {
    type: 'location',
    title: message.title,
    address: message.address,
    latitude: message.latitude,
    longitude: message.longitude
  });
}

// listen on port
var port = process.env.PORT || 8080;
app.listen(port, function () {
  console.log('listening on ' + port);
});