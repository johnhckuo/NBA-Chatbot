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
          handleText(message, event.replyToken, event.source);
          break;
        default:
          throw new Error('Unknown message: ' + JSON.stringify(message));
      }

    case "postback":
      var data = Utils.toObject(event.postback.data);
      switch (data.type) {
        case 'DATE':
          return fetch.fetchGameByDate(event.postback.params.date, event.replyToken);
          break;
        case 'TEAM':
          fetch.replyTeamInfo("id", data.teamId, event.replyToken);
          break;
        case 'TEAM_LEADERS':
          fetch.fetchTeamInfo("leaders", data.urlCode, event.replyToken);
          break;
        case 'TEAM_SCHEDULE':
          fetch.fetchTeamInfo("schedule", data.urlCode, event.replyToken);
          break;
        case 'TEAM_ROSTER':
          fetch.fetchTeamInfo("roster", data.urlCode, event.replyToken);
          break;
        case 'RECENT_STATS':
          fetch.fetchPlayerRecentStats(data.playerId, event.replyToken);
          break;
        case 'playersStats':
          fetch.fetchPlayersStatsByGameId(data.teamId, data.gameId, data.date, event.replyToken);
          break;
        case 'queryPlayer':
          fetch.replyPlayerInfo(data.playerName, event.replyToken);
          break;
        case 'TEAM_LIST':
          fetch.replyTeamList(event.replyToken);
          break;
        case 'help':
          Utils.replyText(client, event.replyToken, [Command.Help + ' profile -> Profile', Command.Team + ' Name -> Team Info', Command.Player + ' Name -> Player Info']);
          break;
        case 'subscribe':
          fetch.updateUserPreference(data.urlCode, event.source.userId, event.replyToken);
          break;
        case 'display':
          console.log("display only");
          break;
        default:
          throw new Error('Unknown data: ' + JSON.stringify(data));
      }
    case 'follow':
      Utils.replyText(client, event.replyToken, 'Got followed event');
      break;
    case 'unfollow':
      console.log('Unfollowed this bot: ' + JSON.stringify(event));
      break;
    case 'join':
      Utils.replyText(client, event.replyToken, 'Joined ' + event.source.type);
      break;
    case 'leave':
      console.log('Left: ' + JSON.stringify(event));
      break;
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
        if (source.userId) {

          return axios.get(API.LineRoot + '/user/' + source.userId + '/richmenu', {
            headers: {
              "Authorization": 'Bearer ' + process.env.CHANNEL_ACCESS_TOKEN
            }
          }).then(function (response) {
            var richMenuId = response.data.richMenuId;
            var keys = Object.keys(API.RichMenu);
            var subscribedTeam = "None";
            for (var i = 0; i < keys.length; i++) {
              if (API.RichMenu[keys[i]] == richMenuId) {
                subscribedTeam = keys[i];
                break;
              }
            }

            return client.getProfile(source.userId).then(function (profile) {
              return Utils.replyText(client, replyToken, ['Username: ' + profile.displayName, 'Subscribed Team: ' + subscribedTeam]);
            });
          }).catch(function (error) {
            console.log(error.originalError.response.data);
          });
        } else {
          return Utils.replyText(client, replyToken, 'Bot can\'t use profile API without user ID');
        };
        break;
      default:
        return Utils.replyText(client, replyToken, [Command.Help + ' profile -> Profile', Command.Team + ' Name -> Team Info', Command.Player + ' Name -> Player Info']);
    }
  } else if (requestType === Command.Team || requestType === Command.TeamAlt) {
    return fetch.replyTeamInfo("name", requestContent, replyToken);
  } else if (requestType === Command.Player || requestType === Command.PlayerAlt) {
    return fetch.replyPlayerInfo(requestContent, replyToken);
  } else {
    Utils.replyText(client, replyToken, 'Unknown command, please type ' + Command.Help + ' or ' + Command.HelpAlt + ' for more info');
  }
}

// listen on port
var port = process.env.PORT || 8080;
app.listen(port, function () {
  console.log('listening on ' + port);
});