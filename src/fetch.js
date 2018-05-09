const axios = require('axios');
const { teams } = require('./data/teams');
const { Utils } = require('./utils');

class Fetch{
  constructor(client){
    this.client = client;
  }

  fetchPlayersStatsByGameId(teamId, gameId, date, replyToken){
    return axios.get(`http://data.nba.net/prod/v1/${date}/${gameId}_Book.pdf`, {params: {} })
    .then((response)=>{
      return Utils.replyText(this.client, replyToken, response.data.games)
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

  fetchGameByDate(date, replyToken) {
    date = date.split("-").join("");
    return axios.get(`http://data.nba.net/prod/v1/${date}/scoreboard.json`, {
        params: {}
      })
      .then((response)=>{
        return this.replyGameByDate(response.data.games, replyToken)
      })
      .catch((error)=>{
        console.log(error);
      });
  }

  replyGameByDate(games, token){
    games = Array.isArray(games) ? games : [games];
    return this.client.replyMessage(
      token, {
        "type": "template",
        "altText": "Function Menu",
        "template": {
          "type": "carousel",
          "columns": games.map((game) => {
            var startDate = new Date(game.startTimeUTC);

            let year = startDate.getFullYear();
            let month = startDate.getMonth() < 10 ? "0" + (startDate.getMonth()+1).toString() : startDate.getMonth();
            let date = startDate.getDate() < 10 ? "0" + startDate.getDate().toString() : startDate.getDate();

            var isStarted = typeof game.endTimeUTC === "undefined" ? false : true;
            var description = isStarted ?  `Game Ended. Final score: ${game.vTeam.score} : ${game.hTeam.score}` : `Game starts at ${startDate.toString()}`;
            description = description.split("GMT")[0] + "\n"+ game.playoffs.seriesSummaryText;

            var actions = isStarted ?
              [
                {
                  "type": "postback",
                  "label": `${teams.league.standard[game.hTeam.teamId].nickname} Stats`,
                  "data": `type=playersStats&teamId=${game.hTeam.teamId}&gameId=${game.gameId}&date=${year+month+date}`
                },
                {
                  "type": "postback",
                  "label": `${teams.league.standard[game.vTeam.teamId].nickname} Stats`,
                  "data": `type=playersStats&teamId=${game.hTeam.teamId}&gameId=${game.gameId}&date=${year+month+date}`
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
