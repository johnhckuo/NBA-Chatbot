const axios = require("axios");
const {
  getRichMenuTemplate
} = require("./data/MenuTemplate");
const {
  API
} = require('./api');
const {
  teams
} = require('./data/teams');
const fs = require('fs');

const INIT = {
	start: ()=>{
		var keys = Object.keys(teams.league.standard)
		for (var i = 0 ; i < keys.length ; i++){
			if (teams.league.standard[keys[i]].isNBAFranchise == false) {
				continue;
			}
			var urlName = teams.league.standard[keys[i]].urlName;
			var RichMenuTemplate = getRichMenuTemplate(urlName);
			(function(RichMenuTemplate, urlName){
				axios.post(`${API.LineRoot}/richmenu`, JSON.stringify(RichMenuTemplate), {
		          headers:{ "Authorization": `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`, "Content-Type":"application/json"},
		        })
		        .then(function (response) {
		          console.log(urlName+": \""+response.data.richMenuId+"\",");
		        })
		        .catch(function (error) {
		          console.log(error.response.data.details);
		        });	
			})(RichMenuTemplate, urlName);
		}
	},
	fetchList: ()=>{
		axios.get(`${API.LineRoot}/richmenu/list`, {}, {
          headers:{ Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`},
        })
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
	},
	uploadImage: ()=>{
		fs.readFile('./menu.jpg', function(err, image) {
		  	if (err){
		  		console.log(err);
		  		return;
		  	} 

			var keys = Object.keys(API.RichMenu);
			for (var i = 0 ; i < keys.length ; i++){
				(function(richMenuId){
					console.log(`${API.LineRoot}/richmenu/${richMenuId}/content`)
					axios.post(`${API.LineRoot}/richmenu/${richMenuId}/content`, image, {
			          headers:{ Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`, "Content-Type":"image/jpeg"},
			        })
			        .then(function (response) {
			          console.log(response);
			        })
			        .catch(function (error) {
			          console.log(error.response.data.message);
			        });
				})(API.RichMenu[keys[i]]);

			}

		});
	}
}

module.exports.INIT = INIT;