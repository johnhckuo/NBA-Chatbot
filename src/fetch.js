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
  }

  SYSTEM_FetchPlayerData() {
    axios.get(`${API.RootURI}/2017/players.json`)
      .then((response) => {
        this.players = response.data.league.standard;
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

  fetchTeamList(replyToken){
    var actions = [];
    Object.keys(teams.league.standard).map((key)=>{
      if (teams.league.standard[key].isNBAFranchise == true){
        actions.push(
          {
            "type": "postback",
            "label": `${teams.league.standard[key].fullName)}`,
            "data": `type=teamList`
          }
      }
    })
    return {
      //"thumbnailImageUrl": "https://example.com/bot/images/item1.jpg",
      "imageBackgroundColor": "#FFFFFF",
      "title": teams.league.standard[game.vTeam.teamId].nickname + " vs. " + teams.league.standard[game.hTeam.teamId].nickname,
      "text": description,
      "actions": actions
    };
  }

  transformToLocaleTime(startTimeUTC) {
    var startDate = new Date(startTimeUTC);
    let year = startDate.getFullYear();
    let month = startDate.getMonth() < 10 ? "0" + (startDate.getMonth() + 1).toString() : startDate.getMonth();
    let date = startDate.getDate() < 10 ? "0" + startDate.getDate().toString() : startDate.getDate();
    return [year, month, date];
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
            var description = isStarted ? `Game Ended. Final score: ${game.vTeam.score} : ${game.hTeam.score}` : `Game starts at ${startDate.toString()}`;
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
              ] :
              [{
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
