'use strict';

require('dotenv').config();

var _require = require("./fetch"),
    Fetch = _require.Fetch;

var _require2 = require("./utils"),
    Utils = _require2.Utils;

var _require3 = require("./command"),
    Command = _require3.Command;

var _require4 = require('./api'),
    API = _require4.API;

var _require5 = require('./init'),
    INIT = _require5.INIT;

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

//INIT.start();
//INIT.fetchList();
//INIT.uploadImage();

function handleEvent(event) {
  switch (event.type) {
    case 'message':
      var message = event.message;
      switch (message.type) {
        case 'text':
          return handleText(message, event.replyToken, event.source);
        default:
          throw new Error('Unknown message: ' + JSON.stringify(message));
      }

    case "postback":
      var data = Utils.toObject(event.postback.data);
      switch (data.type) {
        case 'DATE':
          return fetch.fetchGameByDate(event.postback.params.date, event.replyToken);
        case 'TEAM':
          return fetch.getTeam("id", data.teamId, event.replyToken);
        case 'TEAM_LEADERS':
          return fetch.fetchTeamInfo("leaders", data.urlCode, event.replyToken);
        case 'TEAM_SCHEDULE':
          return fetch.fetchTeamInfo("schedule", data.urlCode, event.replyToken);
        case 'TEAM_ROSTER':
          return fetch.fetchTeamInfo("roster", data.urlCode, event.replyToken);
        case 'RECENT_STATS':
          return fetch.fetchPlayerRecentStats(data.playerId, event.replyToken);
        case 'playersStats':
          return fetch.fetchPlayersStatsByGameId(data.teamId, data.gameId, data.date, event.replyToken);
        case 'queryPlayer':
          return fetch.queryPlayer(data.playerName, event.replyToken);
        case 'TEAM_LIST':
          return fetch.getTeamList(event.replyToken);
        case 'help':
          return Utils.replyText(client, event.replyToken, [Command.Help + ' menu -> Menu', Command.Help + ' profile -> Profile', Command.Team + ' Name -> Team Info', Command.Player + ' Name -> Player Info']);
        case 'subscribe':
          {
            return fetch.updateUserPreference(data.urlCode, event.source.userId, event.replyToken);
          }
        case 'display':
          console.log("display only");
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
  var requestType = message.text.split(" ")[0];
  var requestContent = message.text.split(" ")[1];
  if (requestType === Command.Help || requestType === Command.HelpAlt) {
    switch (requestContent) {
      case 'profile':
        axios.post(API.LineRoot + '/user/' + source.userId + '/richmenu/' + API.RichMenu['celtics'], {}, {
          headers: { Authorization: 'Bearer ' + process.env.CHANNEL_ACCESS_TOKEN }
        }).then(function (response) {
          console.log(response);
        }).catch(function (error) {
          console.log(error);
        });
        if (source.userId) {
          return client.getProfile(source.userId).then(function (profile) {
            return Utils.replyText(client, replyToken, ['Display name: ' + profile.displayName, 'Status message: ' + profile.statusMessage]);
          });
        } else {
          return Utils.replyText(client, replyToken, 'Bot can\'t use profile API without user ID');
        };
      case 'menu':
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
            }, {
              type: 'postback',
              label: 'Search Team',
              data: 'type=TEAM'
            }]
          }
        });
      default:
        return Utils.replyText(client, replyToken, [Command.Help + ' menu -> Menu', Command.Help + ' profile -> Profile', Command.Team + ' Name -> Team Info', Command.Player + ' Name -> Player Info']);
    }
  } else if (requestType === Command.Team || requestType === Command.TeamAlt) {
    return fetch.getTeam("name", requestContent, replyToken);
  } else if (requestType === Command.Player || requestType === Command.PlayerAlt) {
    return fetch.queryPlayer(requestContent, replyToken);
  } else {
    Utils.replyText(client, replyToken, 'Unknown command, please type ' + Command.Help + ' or ' + Command.HelpAlt + ' for more info');
  }
}

// listen on port
var port = process.env.PORT || 8080;
app.listen(port, function () {
  console.log('listening on ' + port);
});