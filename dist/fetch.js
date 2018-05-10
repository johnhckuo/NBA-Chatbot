'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var axios = require('axios');

var _require = require('./data/teams'),
    teams = _require.teams;

var _require2 = require('./utils'),
    Utils = _require2.Utils;

var _require3 = require('./api'),
    API = _require3.API;

var Fetch = function () {
  function Fetch(client) {
    _classCallCheck(this, Fetch);

    this.client = client;
    this.players = null;
    this.SYSTEM_FetchPlayerData();
    this.ComparableStats = {
      'points': "Points",
      "steals": "Steals",
      "totReb": "Rebounds",
      "assists": "Assists",
      "min": "Minutes"
    };
  }

  _createClass(Fetch, [{
    key: 'SYSTEM_FetchPlayerData',
    value: function SYSTEM_FetchPlayerData() {
      var _this = this;

      axios.get(API.RootURI + '/2017/players.json').then(function (response) {
        _this.players = response.data.league.standard;
      }).catch(function (error) {
        console.log(error);
      });
    }
  }, {
    key: 'fetchPlayersStatsByGameId',
    value: function fetchPlayersStatsByGameId(teamId, gameId, date, replyToken) {
      var _this2 = this;

      return axios.get(API.RootURI + '/' + date + '/' + gameId + '_boxscore.json', {
        params: {}
      }).then(function (response) {

        var leaders = {};
        Object.keys(_this2.ComparableStats).map(function (key) {
          leaders[key] = response.data.stats.activePlayers.slice();

          if (key == "min") {
            leaders[key].sort(function (a, b) {
              var a_totalMinutes = a[key].split(":")[0] * 60 + a[key].split(":")[1];
              var b_totalMinutes = b[key].split(":")[0] * 60 + b[key].split(":")[1];
              return b_totalMinutes - a_totalMinutes;
            });
          } else {
            leaders[key].sort(function (a, b) {
              return b[key] - a[key];
            });
          }

          leaders[key] = leaders[key].slice(0, 3);
        });
        return _this2.replyGameLeaders(leaders, replyToken);
      }).catch(function (error) {
        console.log(error);
      });
    }
  }, {
    key: 'fetchPlayerData',
    value: function fetchPlayerData(playerId) {
      if (this.players != null) {
        for (var i = 0; i < this.players.length; i++) {
          if (this.players[i].personId === playerId) {
            return this.players[i];
          }
        }
      } else {
        console.log("Data not initialized");
      }
    }
  }, {
    key: 'transformToLocaleTime',
    value: function transformToLocaleTime(startTimeUTC) {
      var startDate = new Date(startTimeUTC);
      var year = startDate.getFullYear();
      var month = startDate.getMonth() < 10 ? "0" + (startDate.getMonth() + 1).toString() : startDate.getMonth();
      var date = startDate.getDate() < 10 ? "0" + startDate.getDate().toString() : startDate.getDate();
      return [year, month, date];
    }
  }, {
    key: 'fetchGameByDate',
    value: function fetchGameByDate(date, replyToken) {
      var _this3 = this;

      date = date.split("-").join("");
      return axios.get(API.RootURI + '/' + date + '/scoreboard.json', {
        params: {}
      }).then(function (response) {
        return _this3.replyGameByDate(response.data.games, date, replyToken);
      }).catch(function (error) {
        console.log(error);
      });
    }
  }, {
    key: 'replyGameLeaders',
    value: function replyGameLeaders(leaders, token) {
      var _this4 = this;

      return this.client.replyMessage(token, {
        "type": "template",
        "altText": "Function Menu",
        "template": {
          "type": "carousel",
          "columns": Object.keys(leaders).map(function (key) {
            var title = _this4.ComparableStats[key] + ' leader';
            var actions = leaders[key].map(function (leader) {
              var playerData = _this4.fetchPlayerData(leader.personId);
              var playerName = playerData.firstName + " " + playerData.lastName;
              return {
                type: "postback",
                label: playerName + ' ' + leader[key],
                data: 'type=playerDetail&playerId=' + leader.personId + '&queryType=' + key
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
      });
    }
  }, {
    key: 'replyGameByDate',
    value: function replyGameByDate(games, date, token) {
      games = Array.isArray(games) ? games : [games];
      return this.client.replyMessage(token, {
        "type": "template",
        "altText": "Function Menu",
        "template": {
          "type": "carousel",
          "columns": games.map(function (game) {

            var isStarted = typeof game.endTimeUTC === "undefined" ? false : true;
            var description = isStarted ? 'Game Ended. Final score: ' + game.vTeam.score + ' : ' + game.hTeam.score : 'Game starts at ' + startDate.toString();
            description = description.split("GMT")[0] + "\n" + game.playoffs.seriesSummaryText;

            var actions = isStarted ? [{
              "type": "postback",
              "label": teams.league.standard[game.hTeam.teamId].nickname + ' Stats',
              "data": 'type=playersStats&teamId=' + game.hTeam.teamId + '&gameId=' + game.gameId + '&date=' + date
            }, {
              "type": "postback",
              "label": teams.league.standard[game.vTeam.teamId].nickname + ' Stats',
              "data": 'type=playersStats&teamId=' + game.hTeam.teamId + '&gameId=' + game.gameId + '&date=' + date
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