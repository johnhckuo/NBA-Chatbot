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

  /* ------------
       Fetch
  --------------*/

  _createClass(Fetch, [{
    key: 'SYSTEM_FetchPlayerData',
    value: function SYSTEM_FetchPlayerData() {
      var _this = this;

      axios.get(API.NBARoot + '/2017/players.json').then(function (response) {
        _this.players = response.data.league.standard;
        console.log("------- player data initialized -------");
      }).catch(function (error) {
        throw new SystemException("INITIAL_ERROR", error, null, _this.client);
      });
    }
  }, {
    key: 'fetchPlayersStatsByGameId',
    value: function fetchPlayersStatsByGameId(teamId, gameId, date, replyToken) {
      var _this2 = this;

      return axios.get(API.NBARoot + '/' + date + '/' + gameId + '_boxscore.json', {
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
        throw new SystemException("FETCH_ERROR", error, replyToken, _this2.client);
      });
    }
  }, {
    key: 'fetchTeamInfo',
    value: function fetchTeamInfo(type, teamUrlCode, replyToken) {
      var _this3 = this;

      return axios.get(API.NBARoot + '/2017/teams/' + teamUrlCode + '/' + type + '.json').then(function (response) {
        if (type == "leaders") {
          var keys = Object.keys(response.data.league.standard);
          var leaders = "";
          for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (typeof Abbrev[key] != "undefined") {
              var playerId = response.data.league.standard[key][0].personId;
              leaders += Abbrev[key] + ' : ' + _this3.searchPlayerData("personId", playerId).firstName + ' ' + _this3.searchPlayerData("personId", playerId).lastName + '\n';
            }
          }
          return Utils.replyText(_this3.client, replyToken, leaders);
        } else if (type == "schedule") {
          var teamInfo = [];
          var rawData = response.data.league.standard;
          var currentTime = new Date();
          for (var i = rawData.length - 1; i >= 0; i--) {
            if (new Date(rawData[i].startTimeUTC) - currentTime >= 0) {
              teamInfo.push(rawData[i]);
            } else {
              continue;
            }
          }

          var content = "";
          if (teamInfo.length == 0) {
            content = 'No schedule for ' + teamUrlCode + ' this season';
          } else {
            teamInfo.map(function (info) {
              content += 'Start Time: ' + _this3.UTCtoLocaleTime(info.startTimeUTC) + '\n' + teams.league.standard[info.hTeam.teamId].nickname + ' vs. ' + teams.league.standard[info.vTeam.teamId].nickname + '\nHome Team: ' + teams.league.standard[info.hTeam.teamId].nickname + '\n----------\n';
            });
          }

          Utils.replyText(_this3.client, replyToken, content);
        } else if (type == "roster") {
          var players = response.data.league.standard.players;

          var playersInfo = players.map(function (player) {
            return _this3.searchPlayerData("personId", player.personId);
          });

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
              "data": 'type=queryPlayer&playerName=' + playersInfo[i].lastName
            });
          }
          _this3.client.replyMessage(replyToken, {
            "type": "template",
            "altText": "Player List",
            "template": {
              "type": "carousel",
              "columns": columns,
              "imageAspectRatio": "rectangle",
              "imageSize": "cover"
            }
          }).catch(function (e) {
            console.log(e.originalError.response.data.details);
          });
        }
      }).catch(function (error) {
        throw new SystemException("FETCH_ERROR", error, replyToken, _this3.client);
      });
    }
  }, {
    key: 'fetchPlayerRecentStats',
    value: function fetchPlayerRecentStats(playerId, replyToken) {
      var _this4 = this;

      return axios.get(API.NBARoot + '/2017/players/' + playerId + '_gamelog.json').then(function (response) {
        return _this4.replyPlayerStats(response.data.league.standard, replyToken);
      }).catch(function (error) {
        throw new SystemException("FETCH_ERROR", error, replyToken, _this4.client);
      });
    }
  }, {
    key: 'fetchGameByDate',
    value: function fetchGameByDate(date, replyToken) {
      var _this5 = this;

      date = date.split("-").join("");
      return axios.get(API.NBARoot + '/' + date + '/scoreboard.json').then(function (response) {
        return _this5.replyGameByDate(response.data.games, date, replyToken);
      }).catch(function (error) {
        throw new SystemException("FETCH_ERROR", error, replyToken, _this5.client);
      });
    }

    /* ------------
         Reply
    --------------*/

  }, {
    key: 'replyPlayerInfo',
    value: function replyPlayerInfo(playerName, replyToken) {
      var player = this.searchPlayerData("lastName", playerName);
      if (player == null) {
        throw new UserException("PLAYER_NOT_FOUND", replyToken, this.client);
      }
      player.teams = player.teams.map(function (team) {
        return {
          team: teams.league.standard[team.teamId].nickname,
          seasonStart: team.seasonStart,
          seasonEnd: team.seasonEnd
        };
      });
      player.draft = Object.assign({}, player.draft, {
        team: teams.league.standard[player.draft.teamId].nickname
      });
      delete player.draft.teamId;
      this.client.replyMessage(replyToken, {
        type: 'template',
        altText: 'team query',
        template: {
          type: 'buttons',
          text: 'What do you want to know?',
          actions: [{
            type: 'postback',
            label: 'Recent game stats',
            data: 'type=RECENT_STATS&playerId=' + player.personId
          }]
        }
      }).catch(function (e) {
        console.log(e.originalError.response.data.details);
      });
    }
  }, {
    key: 'replyTeamList',
    value: function replyTeamList(replyToken) {
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
            "data": 'type=TEAM&teamId=' + keys[i]
          });
        }
      }
      this.client.replyMessage(replyToken, {
        "type": "template",
        "altText": "Team List",
        "template": {
          "type": "carousel",
          "columns": columns,
          "imageAspectRatio": "rectangle",
          "imageSize": "cover"
        }
      }).catch(function (e) {
        console.log(e.originalError.response.data.details);
      });
    }
  }, {
    key: 'replyGameLeaders',
    value: function replyGameLeaders(leaders, token) {
      var _this6 = this;

      return this.client.replyMessage(token, {
        "type": "template",
        "altText": "Game Leaders",
        "template": {
          "type": "carousel",
          "columns": Object.keys(leaders).map(function (key) {
            var title = _this6.ComparableStats[key] + ' leader';
            var actions = leaders[key].map(function (leader) {
              var playerData = _this6.searchPlayerData("personId", leader.personId);
              var playerName = playerData.firstName + " " + playerData.lastName;
              var labelText = playerName + ' ' + leader[key];
              if (labelText.length > API.LabelCharLength) {
                labelText = playerData.lastName + ' ' + leader[key];
              }
              return {
                type: "postback",
                label: labelText,
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
      }).catch(function (e) {
        console.log(e.originalError.response.data.details);
      });
    }
  }, {
    key: 'replyPlayerStats',
    value: function replyPlayerStats(stats, token) {
      var columns = stats.map(function (stat) {
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
            "label": keys[i] + ': ' + stat.stats[keys[i]],
            "data": 'type=display'
          });
        }
        return {
          //"thumbnailImageUrl": "https://example.com/bot/images/item1.jpg",
          "imageBackgroundColor": "#FFFFFF",
          "title": team1 + ' vs. ' + team2,
          "text": description,
          "actions": actions
        };
      });
      this.client.replyMessage(token, {
        "type": "template",
        "altText": "Player Stats",
        "template": {
          "type": "carousel",
          "columns": columns,
          "imageAspectRatio": "rectangle",
          "imageSize": "cover"
        }
      }).catch(function (e) {
        console.log(e.originalError.response.data.details);
      });
    }
  }, {
    key: 'replyGameByDate',
    value: function replyGameByDate(games, date, token) {
      var _this7 = this;

      games = Array.isArray(games) ? games : [games];
      var columns = games.map(function (game) {

        var isStarted = typeof game.endTimeUTC === "undefined" ? false : true;
        var description = isStarted ? 'Game Ended. Final score: ' + game.vTeam.score + ' : ' + game.hTeam.score : 'Game starts at ' + _this7.UTCtoLocaleTime(game.startTimeUTC);
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
          "label": "Stay Tuned !",
          "data": 'type=display'
        }];
        return {
          //"thumbnailImageUrl": "https://example.com/bot/images/item1.jpg",
          "imageBackgroundColor": "#FFFFFF",
          "title": teams.league.standard[game.vTeam.teamId].nickname + " vs. " + teams.league.standard[game.hTeam.teamId].nickname,
          "text": description,
          "actions": actions
        };
      });
      return this.client.replyMessage(token, {
        "type": "template",
        "altText": "Games List",
        "template": {
          "type": "carousel",
          "columns": columns,
          "imageAspectRatio": "rectangle",
          "imageSize": "cover"
        }
      }).catch(function (e) {
        console.log(e.originalError.response.data.details);
      });
    }
  }, {
    key: 'replyTeamInfo',
    value: function replyTeamInfo(searchIndex, keyword, replyToken) {
      var urlName = null;
      if (searchIndex == "name") {
        var keys = Object.keys(teams.league.standard);
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          if (keyword.toLowerCase() === teams.league.standard[key].fullName.toLowerCase() || keyword.toLowerCase() === teams.league.standard[key].tricode.toLowerCase() || keyword.toLowerCase() === teams.league.standard[key].nickname.toLowerCase()) {
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

      return this.client.replyMessage(replyToken, {
        type: 'template',
        altText: 'team query',
        template: {
          type: 'buttons',
          text: 'What do you want to know?',
          actions: [{
            type: 'postback',
            label: 'Team Leaders',
            data: 'type=TEAM_LEADERS&urlCode=' + urlName
          }, {
            type: 'postback',
            label: 'Team Schedule',
            data: 'type=TEAM_SCHEDULE&urlCode=' + urlName
          }, {
            type: 'postback',
            label: 'Subscribe',
            data: 'type=subscribe&urlCode=' + urlName
          }]
        }
      }).catch(function (e) {
        console.log(e.originalError.response.data.details);
      });
    }

    /* ---------------
     utility function
    -----------------*/

  }, {
    key: 'searchPlayerData',
    value: function searchPlayerData(indexType, searchIndex) {
      if (this.players != null) {
        for (var i = 0; i < this.players.length; i++) {
          if (this.players[i][indexType].toLowerCase() === searchIndex.toLowerCase()) {
            return this.players[i];
          }
        }
      } else {
        throw new SystemException("PLAYER_DATA_NOT_INIT", error, replyToken, this.client);
      }
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

    /* ---------------
      user preferences
    -----------------*/

  }, {
    key: 'updateUserPreference',
    value: function updateUserPreference(teamUrlName, userId, replyToken) {
      var _this8 = this;

      axios.post(API.LineRoot + '/user/' + userId + '/richmenu/' + API.RichMenu[teamUrlName], {}, {
        headers: {
          Authorization: 'Bearer ' + process.env.CHANNEL_ACCESS_TOKEN
        }
      }).then(function (response) {
        Utils.replyText(_this8.client, replyToken, 'You\'ve successfully subscribed team ' + teamUrlName);
      }).catch(function (error) {
        throw new SystemException("SUBSCRIBE_ERROR", error, replyToken, _this8.client);
      });
    }
  }]);

  return Fetch;
}();

function SystemException(type, error, token, client) {
  switch (type) {
    case "PLAYER_DATA_NOT_INIT":
      console.log("data not init yet");
      return;
    case "FETCH_ERROR":
      var message = error.originalError.response.data.message;
      var detail = error.originalError.response.data.details;
      console.log("fetch error", message, detail);
      return;
    case "UNKNOWN_COMMAND":
      console.log("Unknown Command");
      return;
    case "SUBSCRIBE_ERROR":
      console.log("Subscribe Error");
      return;
    case "INITIAL_ERROR":
      console.log("Initialize Error");
    default:
      console.log("system error: ", error);
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
      console.log("user error: ", message);
  }
}

module.exports.Fetch = Fetch;