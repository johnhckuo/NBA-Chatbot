const axios = require('axios');
const { teams } = require('./data/teams');
const { Utils } = require('./utils');

class Fetch{
  constructor(client){
    this.client = client;
    this.players = null;
  }

  fetchPlayersStatsByGameId(teamId, gameId, date, replyToken){
    return axios.get(`http://data.nba.net/prod/v1/${date}/${gameId}_boxscore.json`, {params: {} })
    .then((response)=>{
      // console.log(response.stats.vTeam.leaders)
      response.data.stats.activePlayers.sort((a, b)=>{
         return a.points < b.points;
      })
      return this.replyGameLeaders(response.data.stats.activePlayers.slice(0, 3), response.data.basicGameData, replyToken)
      // return Utils.replyText(this.client, replyToken, response)
    })
    .catch((error)=>{
      console.log(error);
    });
  }

  // fetchPlayerByGameId(id, replyToken) {
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

  // TODO : period Cache
  fetchPlayerData(playerId){
    if (this.players == null){
      return axios.get(`http://data.nba.net/prod/v1/2017/players.json`)
      .then((response)=>{
        this.players = response.data.league.standard;
      })
      .catch((error)=>{
        console.log(error);
      });
    }

    for (let i = 0 ; i < this.players.length ; i++){
      if (this.players[i].personId === playerId){
        return this.players[i];
      }
    }
  }

  transformToLocaleTime(startTimeUTC){
    var startDate = new Date(startTimeUTC);
    let year = startDate.getFullYear();
    let month = startDate.getMonth() < 10 ? "0" + (startDate.getMonth()+1).toString() : startDate.getMonth();
    let date = startDate.getDate() < 10 ? "0" + startDate.getDate().toString() : startDate.getDate();
    return [year, month, date];
  }

  fetchGameByDate(date, replyToken) {
    date = date.split("-").join("");
    return axios.get(`http://data.nba.net/prod/v1/${date}/scoreboard.json`, {
        params: {}
      })
      .then((response)=>{
        return this.replyGameByDate(response.data.games, date, replyToken)
      })
      .catch((error)=>{
        console.log(error);
      });
  }

  replyGameLeaders(players, gameData, token){
    players = Array.isArray(players) ? players : [players];
    var description = this.transformToLocaleTime(gameData.startTimeUTC).join(".");
    var actions = players.map((player) => {
                var playerData = this.fetchPlayerData(player.personId);
                var playerName = playerData.firstName + " " + playerData.lastName;
                return {
                    "type": "postback",
                    "label": `${playerName} : ${player.points} pts`,
                    "data": `type=playerDetail`
                };
            });
    return this.client.replyMessage(
      token, {
        type: "template",
        altText: "Function Menu",
        template: {
            type: 'buttons',
            text: description,
            actions: actions
        },
      }
    );
  }


  replyGameByDate(games, date, token){
    games = Array.isArray(games) ? games : [games];
    return this.client.replyMessage(
      token, {
        "type": "template",
        "altText": "Function Menu",
        "template": {
          "type": "carousel",
          "columns": games.map((game) => {

            var isStarted = typeof game.endTimeUTC === "undefined" ? false : true;
            var description = isStarted ?  `Game Ended. Final score: ${game.vTeam.score} : ${game.hTeam.score}` : `Game starts at ${startDate.toString()}`;
            description = description.split("GMT")[0] + "\n"+ game.playoffs.seriesSummaryText;

            var actions = isStarted ?
              [
                {
                  "type": "postback",
                  "label": `${teams.league.standard[game.hTeam.teamId].nickname} Stats`,
                  "data": `type=playersStats&teamId=${game.hTeam.teamId}&gameId=${game.gameId}&date=${date}`
                },
                {
                  "type": "postback",
                  "label": `${teams.league.standard[game.vTeam.teamId].nickname} Stats`,
                  "data": `type=playersStats&teamId=${game.hTeam.teamId}&gameId=${game.gameId}&date=${date}`
                }
              ]
              :
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
