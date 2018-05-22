const axios = require('axios');
const {
  teams
} = require('./data/teams');
const {
  Utils
} = require('./utils');
const {
  API
} = require('./api');
const {
  Abbrev
} = require('./data/abbrev');

class Fetch {
  constructor(client) {
    this.client = client;
    this.players = null;
    this.SYSTEM_FetchPlayerData();
    this.ComparableStats = {
      'points': "Points",
      "steals": "Steals",
      "totReb": "Rebounds",
      "assists": "Assists",
      "min": "Minutes"
    }
    console.log("------- initialized -------")
  }

  /* ------------
       Fetch
  --------------*/

  SYSTEM_FetchPlayerData() {
    axios.get(`${API.NBARoot}/2017/players.json`)
      .then((response) => {
        this.players = response.data.league.standard;
        console.log("------- player data initialized -------")
      })
      .catch((error) => {
        throw new SystemException("INITIAL_ERROR", error, null, this.client);
      });
  }

  fetchPlayersStatsByGameId(teamId, gameId, date, replyToken) {
    return axios.get(`${API.NBARoot}/${date}/${gameId}_boxscore.json`, {
        params: {}
      })
      .then((response) => {
        const players = response.data.stats.activePlayers.filter(player => player.teamId === teamId);
        var leaders = {};
        Object.keys(this.ComparableStats).map((key) => {
          leaders[key] = players.slice();

          if (key == "min") {
            leaders[key].sort((a, b) => {
              var a_totalMinutes = a[key].split(":")[0] * 60 + a[key].split(":")[1];
              var b_totalMinutes = b[key].split(":")[0] * 60 + b[key].split(":")[1];
              return b_totalMinutes - a_totalMinutes;
            })
          } else {
            leaders[key].sort((a, b) => {
              return b[key] - a[key];
            })
          }

          leaders[key] = leaders[key].slice(0, 3);
        })
        return this.replyGameLeaders(leaders, replyToken)
      })
      .catch((error) => {
        throw new SystemException("FETCH_ERROR", error, replyToken, this.client);
      });
  }

  fetchTeamInfo(type, teamUrlCode, replyToken) {
    return axios.get(`${API.NBARoot}/2017/teams/${teamUrlCode}/${type}.json`)
      .then((response) => {
        if (type == "leaders") {
          var keys = Object.keys(response.data.league.standard);
          var leaders = "";
          for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (typeof Abbrev[key] != "undefined") {
              var playerId = response.data.league.standard[key][0].personId;
              leaders += `${Abbrev[key]} : ${this.searchPlayerData("personId", playerId).firstName} ${this.searchPlayerData("personId", playerId).lastName}\n`;
            }
          }
          return Utils.replyText(
            this.client,
            replyToken,
            leaders
          )
        } else if (type == "schedule") {
          var teamInfo = [];
          var rawData = response.data.league.standard;
          var currentTime = new Date();
          for (var i = rawData.length - 1; i >= 0; i--) {
            if (new Date(rawData[i].startTimeUTC) - currentTime >= 0) {
              teamInfo.push(rawData[i])
            } else {
              continue;
            }
          }

          var content = "";
          if (teamInfo.length == 0) {
            content = `No schedule for ${teamUrlCode} this season`
          } else {
            teamInfo.map((info) => {
              content += `Start Time: ${this.UTCtoLocaleTime(info.startTimeUTC)}\n${teams.league.standard[info.hTeam.teamId].nickname} vs. ${teams.league.standard[info.vTeam.teamId].nickname}\nHome Team: ${teams.league.standard[info.hTeam.teamId].nickname}\n----------\n`;
            })
          }

          Utils.replyText(
            this.client,
            replyToken,
            content
          )
        } else if (type == "roster") {
          var players = response.data.league.standard.players;

          var playersInfo = players.map((player) => {
            return this.searchPlayerData("personId", player.personId)
          })

          var columns = [];
          var actions = [];
          for (var i = 0; i < playersInfo.length; i++) {
            if (i % API.ActionsPerPage == 0 && i != 0) {
              var currentPage = i / API.ActionsPerPage;
              columns.push({
                //"thumbnailImageUrl": "https://example.com/bot/images/item1.jpg",
                "imageBackgroundColor": "#FFFFFF",
                "title": "Team Players",
                "text": "page" + currentPage,
                "actions": actions
              });
              actions = [];
            }
            actions.push({
              "type": "postback",
              "label": playersInfo[i].firstName + " " + playersInfo[i].lastName,
              "data": `type=queryPlayer&playerName=${playersInfo[i].lastName}`
            });

          }
          this.client.replyMessage(
            replyToken, {
              "type": "template",
              "altText": "Player List",
              "template": {
                "type": "carousel",
                "columns": columns,
                "imageAspectRatio": "rectangle",
                "imageSize": "cover"
              }
            }
          ).catch((e) => {
            console.log(e.originalError.response.data.details)
          });
        }

      })
      .catch((error) => {
        throw new SystemException("FETCH_ERROR", error, replyToken, this.client);
      });
  }

  fetchPlayerRecentStats(playerId, replyToken) {
    return axios.get(`${API.NBARoot}/2017/players/${playerId}_gamelog.json`)
      .then((response) => {
        return this.replyPlayerStats(response.data.league.standard, replyToken);
      })
      .catch((error) => {
        throw new SystemException("FETCH_ERROR", error, replyToken, this.client);
      });
  }

  fetchGameByDate(date, replyToken) {
    date = date.split("-").join("");
    return axios.get(`${API.NBARoot}/${date}/scoreboard.json`)
      .then((response) => {
        return this.replyGameByDate(response.data.games, date, replyToken)
      })
      .catch((error) => {
        throw new SystemException("FETCH_ERROR", error, replyToken, this.client);
      });
  }

  /* ------------
       Reply
  --------------*/

  replyPlayerInfo(playerName, replyToken) {
    var player = this.searchPlayerData("lastName", playerName);
    if (player == null) {
      throw new UserException("PLAYER_NOT_FOUND", replyToken, this.client);
    }
    player.teams = player.teams.map((team) => {
      return {
        team: teams.league.standard[team.teamId].nickname,
        seasonStart: team.seasonStart,
        seasonEnd: team.seasonEnd
      };
    })
    player.draft = Object.assign({}, player.draft, {
      team: teams.league.standard[player.draft.teamId].nickname
    });
    delete player.draft.teamId;
    this.client.replyMessage(
      replyToken, {
        type: 'template',
        altText: 'team query',
        template: {
          type: 'buttons',
          text: 'What do you want to know?',
          actions: [{
            type: 'postback',
            label: 'Recent game stats',
            data: `type=RECENT_STATS&playerId=${player.personId}`
          }],
        },
      }
    ).catch((e) => {
      console.log(e.originalError.response.data.details)
    });
  }

  replyTeamList(replyToken) {
    var i = 0;
    var columns = [];
    var actions = [];

    var keys = Object.keys(teams.league.standard);
    for (var i = 0; i < keys.length; i++) {
      if (teams.league.standard[keys[i]].isNBAFranchise == true) {
        if (actions.length == API.ActionsPerPage) {
          columns.push({
            //"thumbnailImageUrl": "https://example.com/bot/images/item1.jpg",
            "imageBackgroundColor": "#FFFFFF",
            "text": "NBA Team List",
            "actions": actions
          });
          actions = [];
        }
        var teamName;
        if (teams.league.standard[keys[i]].fullName.length > API.LabelCharLength) {
          teamName = teams.league.standard[keys[i]].nickname;
        } else {
          teamName = teams.league.standard[keys[i]].fullName;
        }
        actions.push({
          "type": "postback",
          "label": teamName,
          "data": `type=TEAM&teamId=${keys[i]}`
        });
      }
    }
    this.client.replyMessage(
      replyToken, {
        "type": "template",
        "altText": "Team List",
        "template": {
          "type": "carousel",
          "columns": columns,
          "imageAspectRatio": "rectangle",
          "imageSize": "cover"
        }
      }
    ).catch((e) => {
      console.log(e.originalError.response.data.details)
    });
  }


  replyGameLeaders(leaders, token) {
    return this.client.replyMessage(
      token, {
        "type": "template",
        "altText": "Game Leaders",
        "template": {
          "type": "carousel",
          "columns": Object.keys(leaders).map((key) => {
            var title = `${this.ComparableStats[key]} leader`;
            var actions = leaders[key].map((leader) => {
              var playerData = this.searchPlayerData("personId", leader.personId);
              var playerName = playerData.firstName + " " + playerData.lastName;
              var labelText = `${playerName} ${leader[key]}`;
              if (labelText.length > API.LabelCharLength) {
                labelText = `${playerData.lastName} ${leader[key]}`;
              }
              return {
                type: "postback",
                label: labelText,
                data: `type=playerDetail&playerId=${leader.personId}&queryType=${key}`
              };
            });
            return {
              //"thumbnailImageUrl": "https://example.com/bot/images/item1.jpg",
              "imageBackgroundColor": "#FFFFFF",
              "title": title,
              "text": "Top3 Players",
              "actions": actions
            };
          }),
          "imageAspectRatio": "rectangle",
          "imageSize": "cover"
        }
      }
    ).catch((e) => {
      console.log(e.originalError.response.data.details)
    });
  }

  replyPlayerStats(stats, token) {
    var columns = stats.map((stat) => {
      var team1 = stat.gameUrlCode.split("/")[1].slice(0, 3);
      var team2 = stat.gameUrlCode.split("/")[1].slice(3, 6);
      var date = new Date(stat.gameDateUTC);
      var description = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();

      var keys = Object.keys(stat.stats);
      var actions = [];
      for (var i = 0; i < keys.length; i++) {
        if (keys[i] === "offReb" || keys[i] === "defReb") {
          continue;
        }
        actions.push({
          "type": "postback",
          "label": `${keys[i]}: ${stat.stats[keys[i]]}`,
          "data": `type=display`
        });
      }
      return {
        //"thumbnailImageUrl": "https://example.com/bot/images/item1.jpg",
        "imageBackgroundColor": "#FFFFFF",
        "title": `${team1} vs. ${team2}`,
        "text": description,
        "actions": actions
      };
    });
    this.client.replyMessage(
      token, {
        "type": "template",
        "altText": "Player Stats",
        "template": {
          "type": "carousel",
          "columns": columns,
          "imageAspectRatio": "rectangle",
          "imageSize": "cover"
        }
      }
    ).catch((e) => {
      console.log(e.originalError.response.data.details)
    });
  }

  replyGameByDate(games, date, token) {
    games = Array.isArray(games) ? games : [games];
    var columns = games.map((game) => {

      var isStarted = typeof game.endTimeUTC === "undefined" ? false : true;
      var description = isStarted ? `Game Ended. Final score: ${game.vTeam.score} : ${game.hTeam.score}` : `Game starts at ${this.UTCtoLocaleTime(game.startTimeUTC)}`;
      description = description.split("GMT")[0] + "\n" + game.playoffs.seriesSummaryText;

      var actions = isStarted ? [{
          "type": "postback",
          "label": `${teams.league.standard[game.hTeam.teamId].nickname} Stats`,
          "data": `type=playersStats&teamId=${game.hTeam.teamId}&gameId=${game.gameId}&date=${date}`
        },
        {
          "type": "postback",
          "label": `${teams.league.standard[game.vTeam.teamId].nickname} Stats`,
          "data": `type=playersStats&teamId=${game.vTeam.teamId}&gameId=${game.gameId}&date=${date}`
        }
      ] : [{
        "type": "postback",
        "label": "Stay Tuned !",
        "data": `type=display`
      }];
      return {
        //"thumbnailImageUrl": "https://example.com/bot/images/item1.jpg",
        "imageBackgroundColor": "#FFFFFF",
        "title": teams.league.standard[game.vTeam.teamId].nickname + " vs. " + teams.league.standard[game.hTeam.teamId].nickname,
        "text": description,
        "actions": actions
      };
    });
    return this.client.replyMessage(
      token, {
        "type": "template",
        "altText": "Games List",
        "template": {
          "type": "carousel",
          "columns": columns,
          "imageAspectRatio": "rectangle",
          "imageSize": "cover"
        }
      }
    ).catch((e) => {
      console.log(e.originalError.response.data.details)
    });
  }

  replyTeamInfo(searchIndex, keyword, replyToken) {
    var urlName = null;
    if (searchIndex == "name") {
      const keys = Object.keys(teams.league.standard);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        if (keyword.toLowerCase() === teams.league.standard[key].fullName.toLowerCase() ||
          keyword.toLowerCase() === teams.league.standard[key].tricode.toLowerCase() ||
          keyword.toLowerCase() === teams.league.standard[key].nickname.toLowerCase()
        ) {
          urlName = teams.league.standard[key].urlName;
          break;
        }
      }
    } else if (searchIndex == "id") {
      urlName = teams.league.standard[keyword].urlName;
    } else {
      throw new SystemException("TEAM_NOT_FOUND", {}, replyToken, this.client);
    }

    if (urlName == null) {
      throw new UserException("TEAM_NOT_FOUND", replyToken, this.client);
    }

    return this.client.replyMessage(
      replyToken, {
        type: 'template',
        altText: 'team query',
        template: {
          type: 'buttons',
          text: 'What do you want to know?',
          actions: [{
              type: 'postback',
              label: 'Team Leaders',
              data: `type=TEAM_LEADERS&urlCode=${urlName}`
            },
            {
              type: 'postback',
              label: 'Team Schedule',
              data: `type=TEAM_SCHEDULE&urlCode=${urlName}`
            },
            {
              type: 'postback',
              label: 'Subscribe',
              data: `type=subscribe&urlCode=${urlName}`
            }
          ],
        },
      }
    ).catch((e) => {
      console.log(e.originalError.response.data.details)
    });

  }


  /* ---------------
   utility function
  -----------------*/

  searchPlayerData(indexType, searchIndex) {
    if (this.players != null) {
      for (let i = 0; i < this.players.length; i++) {
        if (this.players[i][indexType].toLowerCase() === searchIndex.toLowerCase()) {
          return this.players[i];
        }
      }
    } else {
      throw new SystemException("PLAYER_DATA_NOT_INIT", error, replyToken, this.client);
    }
  }

  UTCtoLocaleTime(startTimeUTC) {
    var date = new Date(startTimeUTC);
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
  }

  /* ---------------
    user preferences
  -----------------*/

  updateUserPreference(teamUrlName, userId, replyToken) {
    axios.post(`${API.LineRoot}/user/${userId}/richmenu/${API.RichMenu[teamUrlName]}`, {}, {
        headers: {
          Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`
        }
      })
      .then((response) => {
        Utils.replyText(this.client, replyToken, `You've successfully subscribed team ${teamUrlName}`);
      })
      .catch((error) => {
        throw new SystemException("SUBSCRIBE_ERROR", error, replyToken, this.client);
      });
  }

}

function SystemException(type, error, token, client) {
  switch (type) {
    case "PLAYER_DATA_NOT_INIT":
      console.log("data not init yet")
      return;
    case "FETCH_ERROR":
      var message = error.originalError.response.data.message;
      var detail = error.originalError.response.data.details;
      console.log("fetch error", message, detail)
      return;
    case "UNKNOWN_COMMAND":
      console.log("Unknown Command");
      return;
    case "SUBSCRIBE_ERROR":
      console.log("Subscribe Error");
      return;
    case "INITIAL_ERROR":
      console.log("Initialize Error")
    default:
      console.log("system error: ", error)
      if (token != null) {
        Utils.replyText(client, token, "Oops! We've encountered some bugs. Please try again :(");
      }
  }

}

function UserException(message, token, client) {
  switch (message) {
    case "PLAYER_NOT_FOUND":
      console.log("PLAYER_NOT_FOUND");
      Utils.replyText(client, token, "Cannot find the player.\nPlease try again :(");
      return;
    case "TEAM_NOT_FOUND":
      console.log("TEAM_NOT_FOUND");
      Utils.replyText(client, token, "Cannot find the team.\nPlease try again :(");
      return;
    default:
      console.log("user error: ", message)
  }
}

module.exports.Fetch = Fetch;
