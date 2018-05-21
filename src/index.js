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

function handleEvent(event) {
  switch (event.type) {
    case 'message':
      const message = event.message;
      switch (message.type) {
        case 'text':
          return handleText(message, event.replyToken, event.source);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }

    case "postback":
      const data = Utils.toObject(event.postback.data);
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
          return fetch.fetchPlayersStatsByGameId(data.teamId, data.gameId, data.date, event.replyToken)
        case 'queryPlayer':
          return fetch.queryPlayer(data.playerName, event.replyToken);
          //TODO: change to TEAM_LIST
        case 'TEAM_TODAY':
          return fetch.getTeamList(event.replyToken);
        case 'help':
          return Utils.replyText(
            client,
            event.replyToken, [
              `${Command.Help} menu -> Menu`,
              `${Command.Help} profile -> Profile`,
              `${Command.Team} Name -> Team Info`,
              `${Command.Player} Name -> Player Info`
            ]
          )
        case 'subscribe':{
          return fetch.updateUserPreference(data.urlCode, event.source.userId, event.replyToken);
        }
        case 'display':
          console.log("display only")
        default:
          throw new Error(`Unknown data: ${JSON.stringify(data)}`);
      }
    case 'follow':
      return Utils.replyText(client, event.replyToken, 'Got followed event');

    case 'unfollow':
      return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);

    case 'join':
      return Utils.replyText(client, event.replyToken, `Joined ${event.source.type}`);

    case 'leave':
      return console.log(`Left: ${JSON.stringify(event)}`);

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
        axios.post(`${API.LineRoot}/user/${source.userId}/richmenu/${API.RichMenu['celtics']}`, {}, {
          headers:{ Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`}
        })
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
        if (source.userId) {
          return client.getProfile(source.userId)
            .then((profile) => Utils.replyText(
              client,
              replyToken, [
                `Display name: ${profile.displayName}`,
                `Status message: ${profile.statusMessage}`,
              ]
            ));
        } else {
          return Utils.replyText(client, replyToken, 'Bot can\'t use profile API without user ID');
        };
      case 'menu':
        return client.replyMessage(
          replyToken, {
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
                },
                {
                  type: 'postback',
                  label: 'Search Team',
                  data: 'type=TEAM'
                },
              ],
            },
          }
        );
      default:
        return Utils.replyText(
          client,
          replyToken, [
            `${Command.Help} menu -> Menu`,
            `${Command.Help} profile -> Profile`,
            `${Command.Team} Name -> Team Info`,
            `${Command.Player} Name -> Player Info`
          ]
        )
    }

  } else if (requestType === Command.Team || requestType === Command.TeamAlt) {
    return fetch.getTeam("name", requestContent, replyToken);
  } else if (requestType === Command.Player || requestType === Command.PlayerAlt) {
    return fetch.queryPlayer(requestContent, replyToken);
  } else {
    Utils.replyText(client, replyToken, `Unknown command, please type ${Command.Help} or ${Command.HelpAlt} for more info`)
  }
}

// listen on port
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
