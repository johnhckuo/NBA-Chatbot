'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var axios = require('axios');

var _require = require('./data/teams'),
    teams = _require.teams;

var _require2 = require('./utils'),
    Utils = _require2.Utils;

var Fetch = function () {
  function Fetch(client) {
    _classCallCheck(this, Fetch);

    this.client = client;
  }

  _createClass(Fetch, [{
    key: 'fetchPlayersStatsByGameId',
    value: function fetchPlayersStatsByGameId(teamId, gameId, date, replyToken) {
      var _this = this;

      return axios.get('http://data.nba.net/prod/v1/' + date + '/' + gameId + '_Book.pdf', { params: {} }).then(function (response) {
        return Utils.replyText(_this.client, replyToken, response.data.games);
      }).catch(function (error) {
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

  }, {
    key: 'fetchGameByDate',
    value: function fetchGameByDate(date, replyToken) {
      var _this2 = this;

      date = date.split("-").join("");
      return axios.get('http://data.nba.net/prod/v1/' + date + '/scoreboard.json', {
        params: {}
      }).then(function (response) {
        return _this2.replyGameByDate(response.data.games, replyToken);
      }).catch(function (error) {
        console.log(error);
      });
    }
  }, {
    key: 'replyGameByDate',
    value: function replyGameByDate(games, token) {
      games = Array.isArray(games) ? games : [games];
      return this.client.replyMessage(token, {
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
              "data": 'type=gamble'
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
    }
  }]);

  return Fetch;
}();

module.exports.Fetch = Fetch;