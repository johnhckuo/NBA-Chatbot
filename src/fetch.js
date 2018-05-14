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

  SYSTEM_FetchPlayerData() {
    axios.get(`${API.RootURI}/2017/players.json`)
      .then((response) => {
        this.players = response.data.league.standard;
        console.log("------- player data initialized -------")
      })
      .catch((error) => {
        console.log(error);
      });
  }

  fetchPlayersStatsByGameId(teamId, gameId, date, replyToken) {
    return axios.get(`${API.RootURI}/${date}/${gameId}_boxscore.json`, {
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
        console.log(error);
      });
  }

  fetchTeamInfo(type, teamUrlCode, replyToken) {
    return axios.get(`${API.RootURI}/2017/teams/${teamUrlCode}/${type}.json`)
      .then((response) => {
        var keys = Object.keys(response.data.league.standard);
        var leaders = "";
        for (var i = 0 ; i < keys.length ; i++){
          var key = keys[i];
          if (typeof Abbrev[key] != "undefined"){
            var playerId = response.data.league.standard[key][0].personId;
            leaders += `${Abbrev[key]} : ${this.fetchPlayerData(playerId).firstName} ${this.fetchPlayerData(playerId).lastName}\n`;
          }
        }
        return Utils.replyText(
          this.client,
          replyToken,
          leaders
        )
      })
      .catch((error) => {
        console.log(error);
      });
  }

  fetchPlayerData(playerId) {
    if (this.players != null) {
      for (let i = 0; i < this.players.length; i++) {
        if (this.players[i].personId === playerId) {
          return this.players[i];
        }
      }
    } else {
      console.log("Data not initialized");
    }
  }
  getTeam(teamName, replyToken) {
    const keys = Object.keys(teams.league.standard);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      if (teamName.toLowerCase() === teams.league.standard[key].fullName.toLowerCase() ||
        teamName.toLowerCase() === teams.league.standard[key].tricode.toLowerCase() ||
        teamName.toLowerCase() === teams.league.standard[key].nickname.toLowerCase()
      ) {
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
                  data: `type=TEAM_LEADERS&urlCode=${teams.league.standard[key].urlName}`
                },
                {
                  type: 'postback',
                  label: 'Team Schedule',
                  data: `type=TEAM_SCHEDULE&urlCode=${teams.league.standard[key].urlName}`
                }
              ],
            },
          }
        );
      }
    }
    return Utils.replyText(this.client, replyToken, `Unknown team ${teamName}`);

  }

  getTeamList(replyToken) {

    return this.client.replyMessage(
      replyToken, {
        "type": "template",
        "altText": "Function Menu",
        "template": {
          "type": "carousel",
          "columns": Object.keys(teams.league.standard).map((key) => {
            var actions = [];
            if (teams.league.standard[key].isNBAFranchise == true) {
              actions.push({
                "type": "postback",
                "label": teams.league.standard[key].fullName,
                "data": `type=teamList`
              });
            }

            var actions = [{
              "type": "postback",
              "label": 'test',
              "data": `type=playersStats`
            }];
            return {
              //"thumbnailImageUrl": "https://example.com/bot/images/item1.jpg",
              "imageBackgroundColor": "#FFFFFF",
              "title": teams.league.standard[key].fullName,
              "text": "ff",
              "actions": actions
            };
          }),
          "imageAspectRatio": "rectangle",
          "imageSize": "cover"
        }
      }
    );



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

  fetchGameByDate(date, replyToken) {
    date = date.split("-").join("");
    return axios.get(`${API.RootURI}/${date}/scoreboard.json`, {
        params: {}
      })
      .then((response) => {
        return this.replyGameByDate(response.data.games, date, replyToken)
      })
      .catch((error) => {
        console.log(error);
      });
  }

  replyGameLeaders(leaders, token) {
    return this.client.replyMessage(
      token, {
        "type": "template",
        "altText": "Function Menu",
        "template": {
          "type": "carousel",
          "columns": Object.keys(leaders).map((key) => {
            var title = `${this.ComparableStats[key]} leader`;
            var actions = leaders[key].map((leader) => {
              var playerData = this.fetchPlayerData(leader.personId);
              var playerName = playerData.firstName + " " + playerData.lastName;
              return {
                type: "postback",
                label: `${playerName} ${leader[key]}`,
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
    );
  }


  replyGameByDate(games, date, token) {
    games = Array.isArray(games) ? games : [games];
    return this.client.replyMessage(
      token, {
        "type": "template",
        "altText": "Function Menu",
        "template": {
          "type": "carousel",
          "columns": games.map((game) => {

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
              "label": "Subscribe",
              "data": `type=gamble`
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
      }
    );
  }

}

module.exports.Fetch = Fetch;
