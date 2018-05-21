const axios = require("axios");
const {
  RichMenuTemplate
} = require("./data/MenuTemplate");
const {
  API
} = require('./api');

const INIT = {
	start: ()=>{
        axios.post(`${API.LineRoot}/richmenu`, JSON.stringify(RichMenuTemplate), {
          headers:{ "Authorization": `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`, "Content-Type":"application/json"},
        })
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error.response.data.details);
        });

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
		axios.get(`${API.LineRoot}/richmenu/{richMenuId}/content`, {}, {
          headers:{ Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`, "Content-Type":"image/jpeg"},
        })
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
	}


}

module.exports.INIT = INIT;