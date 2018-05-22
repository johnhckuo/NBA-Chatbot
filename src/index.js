'use strict';
require('dotenv').config()
const {
  Fetch
} = require("./fetch");
const {
  Utils
} = require("./utils");
const {
  Command
} = require("./command");
const {
  API
} = require('./api');
const {
  INIT
} = require('./init');
const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios');

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);
const app = express();
const fetch = new Fetch(client);

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

//INIT.start();
//INIT.fetchList();
//INIT.uploadImage();

function handleEvent(event) {
  switch (event.type) {
    case 'message':
      const message = event.message;
      switch (message.type) {
        case 'text':
          handleText(message, event.replyToken, event.source);
          break;
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }

    case "postback":
      const data = Utils.toObject(event.postback.data);
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
          fetch.fetchPlayersStatsByGameId(data.teamId, data.gameId, data.date, event.replyToken)
          break;
        case 'queryPlayer':
          fetch.replyPlayerInfo(data.playerName, event.replyToken);
          break;
        case 'TEAM_LIST':
          fetch.replyTeamList(event.replyToken);
          break;
        case 'help':
          Utils.replyText(
            client,
            event.replyToken, [
              `${Command.Help} profile -> Profile`,
              `${Command.Team} Name -> Team Info`,
              `${Command.Player} Name -> Player Info`
            ]
          )
          break;
        case 'subscribe':
          fetch.updateUserPreference(data.urlCode, event.source.userId, event.replyToken);
          break;
        case 'display':
          console.log("display only")
          break;
        default:
          throw new Error(`Unknown data: ${JSON.stringify(data)}`);
      }
    case 'follow':
      Utils.replyText(client, event.replyToken, 'Got followed event');
      break;
    case 'unfollow':
      console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);
      break;
    case 'join':
      Utils.replyText(client, event.replyToken, `Joined ${event.source.type}`);
      break;
    case 'leave':
      console.log(`Left: ${JSON.stringify(event)}`);
      break;
    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}

function handleText(message, replyToken, source) {
  const requestType = message.text.split(" ")[0];
  const requestContent = message.text.split(" ")[1];

  if (requestType === Command.Help || requestType === Command.HelpAlt) {
    switch (requestContent) {
      case 'profile':
        if (source.userId) {

          return axios.get(`${API.LineRoot}/user/${source.userId}/richmenu`, {
              headers: {
                "Authorization": `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`
              }
            })
            .then((response) => {
              var richMenuId = response.data.richMenuId;
              var keys = Object.keys(API.RichMenu);
              var subscribedTeam = "None";
              for (var i = 0; i < keys.length; i++) {
                if (API.RichMenu[keys[i]] == richMenuId) {
                  subscribedTeam = keys[i];
                  break;
                }
              }

              return client.getProfile(source.userId)
                .then((profile) => Utils.replyText(
                  client,
                  replyToken, [
                    `Username: ${profile.displayName}`,
                    `Subscribed Team: ${subscribedTeam}`
                  ]
                ));
            })
            .catch((error) => {
              console.log(error.originalError.response.data);
            });

        } else {
          return Utils.replyText(client, replyToken, 'Bot can\'t use profile API without user ID');
        };
        break;
      default:
        return Utils.replyText(
          client,
          replyToken, [
            `${Command.Help} profile -> Profile`,
            `${Command.Team} Name -> Team Info`,
            `${Command.Player} Name -> Player Info`
          ]
        )
    }

  } else if (requestType === Command.Team || requestType === Command.TeamAlt) {
    return fetch.replyTeamInfo("name", requestContent, replyToken);
  } else if (requestType === Command.Player || requestType === Command.PlayerAlt) {
    return fetch.replyPlayerInfo(requestContent, replyToken);
  } else {
    Utils.replyText(client, replyToken, `Unknown command, please type ${Command.Help} or ${Command.HelpAlt} for more info`)
  }
}

// listen on port
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
