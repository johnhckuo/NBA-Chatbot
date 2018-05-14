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

var _require4 = require('./data/abbrev'),
    Abbrev = _require4.Abbrev;

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
    console.log("------- initialized -------");
  }

  _createClass(Fetch, [{
    key: 'SYSTEM_FetchPlayerData',
    value: function SYSTEM_FetchPlayerData() {
      var _this = this;

      axios.get(API.RootURI + '/2017/players.json').then(function (response) {
        _this.players = response.data.league.standard;
        console.log("------- player data initialized -------");
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
        var players = response.data.stats.activePlayers.filter(function (player) {
          return player.teamId === teamId;
        });
        var leaders = {};
        Object.keys(_this2.ComparableStats).map(function (key) {
          leaders[key] = players.slice();

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
    key: 'fetchTeamInfo',
    value: function fetchTeamInfo(type, teamUrlCode, replyToken) {
      var _this3 = this;

      return axios.get(API.RootURI + '/2017/teams/' + teamUrlCode + '/' + type + '.json').then(function (response) {
        var keys = Object.keys(response.data.league.standard);
        var leaders = "";
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          if (typeof Abbrev[key] != "undefined") {
            var playerId = response.data.league.standard[key][0].personId;
            leaders += Abbrev[key] + ' : ' + _this3.fetchPlayerData(playerId).firstName + ' ' + _this3.fetchPlayerData(playerId).lastName + '\n';
          }
        }
        return Utils.replyText(_this3.client, replyToken, leaders);
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
    key: 'getTeam',
    value: function getTeam(teamName, replyToken) {
      var keys = Object.keys(teams.league.standard);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (teamName.toLowerCase() === teams.league.standard[key].fullName.toLowerCase() || teamName.toLowerCase() === teams.league.standard[key].tricode.toLowerCase() || teamName.toLowerCase() === teams.league.standard[key].nickname.toLowerCase()) {
          return this.client.replyMessage(replyToken, {
            type: 'template',
            altText: 'team query',
            template: {
              type: 'buttons',
              text: 'What do you want to know?',
              actions: [{
                type: 'postback',
                label: 'Team Leaders',
                data: 'type=TEAM_LEADERS&urlCode=' + teams.league.standard[key].urlName
              }, {
                type: 'postback',
                label: 'Team Schedule',
                data: 'type=TEAM_SCHEDULE&urlCode=' + teams.league.standard[key].urlName
              }]
            }
          });
        }
      }
      return Utils.replyText(this.client, replyToken, 'Unknown team ' + teamName);
    }
  }, {
    key: 'getTeamList',
    value: function getTeamList(replyToken) {

      return this.client.replyMessage(replyToken, {
        "type": "template",
        "altText": "Function Menu",
        "template": {
          "type": "carousel",
          "columns": Object.keys(teams.league.standard).map(function (key) {
            var actions = [];
            if (teams.league.standard[key].isNBAFranchise == true) {
              actions.push({
                "type": "postback",
                "label": teams.league.standard[key].fullName,
                "data": 'type=teamList'
              });
            }

            var actions = [{
              "type": "postback",
              "label": 'test',
              "data": 'type=playersStats'
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
      });
    }
  }, {
    key: 'UTCtoLocaleTime',
    value: function UTCtoLocaleTime(startTimeUTC) {
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
  }, {
    key: 'fetchGameByDate',
    value: function fetchGameByDate(date, replyToken) {
      var _this4 = this;

      date = date.split("-").join("");
      return axios.get(API.RootURI + '/' + date + '/scoreboard.json', {
        params: {}
      }).then(function (response) {
        return _this4.replyGameByDate(response.data.games, date, replyToken);
      }).catch(function (error) {
        console.log(error);
      });
    }
  }, {
    key: 'replyGameLeaders',
    value: function replyGameLeaders(leaders, token) {
      var _this5 = this;

      return this.client.replyMessage(token, {
        "type": "template",
        "altText": "Function Menu",
        "template": {
          "type": "carousel",
          "columns": Object.keys(leaders).map(function (key) {
            var title = _this5.ComparableStats[key] + ' leader';
            var actions = leaders[key].map(function (leader) {
              var playerData = _this5.fetchPlayerData(leader.personId);
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
      var _this6 = this;

      games = Array.isArray(games) ? games : [games];
      return this.client.replyMessage(token, {
        "type": "template",
        "altText": "Function Menu",
        "template": {
          "type": "carousel",
          "columns": games.map(function (game) {

            var isStarted = typeof game.endTimeUTC === "undefined" ? false : true;
            var description = isStarted ? 'Game Ended. Final score: ' + game.vTeam.score + ' : ' + game.hTeam.score : 'Game starts at ' + _this6.UTCtoLocaleTime(game.startTimeUTC);
            description = description.split("GMT")[0] + "\n" + game.playoffs.seriesSummaryText;

            var actions = isStarted ? [{
              "type": "postback",
              "label": teams.league.standard[game.hTeam.teamId].nickname + ' Stats',
              "data": 'type=playersStats&teamId=' + game.hTeam.teamId + '&gameId=' + game.gameId + '&date=' + date
            }, {
              "type": "postback",
              "label": teams.league.standard[game.vTeam.teamId].nickname + ' Stats',
              "data": 'type=playersStats&teamId=' + game.vTeam.teamId + '&gameId=' + game.gameId + '&date=' + date
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