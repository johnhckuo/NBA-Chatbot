"use strict";

var axios = require("axios");

var _require = require("./data/MenuTemplate"),
    getRichMenuTemplate = _require.getRichMenuTemplate;

var _require2 = require('./api'),
    API = _require2.API;

var _require3 = require('./data/teams'),
    teams = _require3.teams;

var fs = require('fs');

var INIT = {
	start: function start() {
		var keys = Object.keys(teams.league.standard);
		for (var i = 0; i < keys.length; i++) {
			if (teams.league.standard[keys[i]].isNBAFranchise == false) {
				continue;
			}
			var urlName = teams.league.standard[keys[i]].urlName;
			var RichMenuTemplate = getRichMenuTemplate(urlName);
			(function (RichMenuTemplate, urlName) {
				axios.post(API.LineRoot + "/richmenu", JSON.stringify(RichMenuTemplate), {
					headers: { "Authorization": "Bearer " + process.env.CHANNEL_ACCESS_TOKEN, "Content-Type": "application/json" }
				}).then(function (response) {
					console.log(urlName + ": \"" + response.data.richMenuId + "\",");
				}).catch(function (error) {
					console.log(error.response.data.details);
				});
			})(RichMenuTemplate, urlName);
		}
	},
	fetchList: function fetchList() {
		axios.get(API.LineRoot + "/richmenu/list", {}, {
			headers: { Authorization: "Bearer " + process.env.CHANNEL_ACCESS_TOKEN }
		}).then(function (response) {
			console.log(response);
		}).catch(function (error) {
			console.log(error);
		});
	},
	uploadImage: function uploadImage() {
		fs.readFile('./menu.jpg', function (err, image) {
			if (err) {
				console.log(err);
				return;
			}

			var keys = Object.keys(API.RichMenu);
			for (var i = 0; i < keys.length; i++) {
				(function (richMenuId) {
					console.log(API.LineRoot + "/richmenu/" + richMenuId + "/content");
					axios.post(API.LineRoot + "/richmenu/" + richMenuId + "/content", image, {
						headers: { Authorization: "Bearer " + process.env.CHANNEL_ACCESS_TOKEN, "Content-Type": "image/jpeg" }
					}).then(function (response) {
						console.log(response);
					}).catch(function (error) {
						console.log(error.response.data.message);
					});
				})(API.RichMenu[keys[i]]);
			}
		});
	}
};

module.exports.INIT = INIT;