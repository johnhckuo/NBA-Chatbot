"use strict";

var API = {
	LineRoot: "https://api.line.me/v2/bot",
	NBARoot: "http://data.nba.net/prod/v1",
	API_Table: "http://data.nba.net/10s/prod/v1/today.json",
	RichMenu: {
		hawks: "richmenu-fd71eb6f3cc6355a01744af213575882",
		heat: "richmenu-4a1e4247b29ef131676b178aa4252e10",
		kings: "richmenu-728875f2ee2eb0bf68fc0fdfe01239c6",
		clippers: "richmenu-ada4eb66627668ae080aa07681a527b7",
		mavericks: "richmenu-00d9a22ab640388c9166874e6450fe51",
		thunder: "richmenu-73a06fdd4f4cbd934a36c983c73ee47f",
		suns: "richmenu-f099745119ea2fc90d758fbfcde6fd78",
		pacers: "richmenu-b0a4e859021883d0972f434f01003b97",
		cavaliers: "richmenu-e921b1f6faf9b47f6dfd69940d096377",
		warriors: "richmenu-88508fe77a649a3d09e0441d8cf34b04",
		sixers: "richmenu-e3685b2592445ed181db56fdf378ffc1",
		hornets: "richmenu-754329f6e55fd3760bc17c3061588147",
		blazers: "richmenu-f6dda44e2e2f53752bc3c41fec2849c0",
		celtics: "richmenu-48556ba0900999a83ac2e7f16c1b6b07",
		wizards: "richmenu-a9c21004d8f7ee12572d1bc211208f56",
		bulls: "richmenu-9aeffdebaf0daeb6a7655a3f9f8a4116",
		raptors: "richmenu-03dee7937a9400494252a578919c2fed",
		jazz: "richmenu-584147dc6ed9b7ce9bdd7ad36528aff4",
		lakers: "richmenu-89166e3c7d8874b909fc5cae4a82bf84",
		grizzlies: "richmenu-e4e635400fd461f9c79336770027d69d",
		bucks: "richmenu-78b27a9780b6ef767af433aaa8fee1dd",
		rockets: "richmenu-4168c0f00f745eb889e0dd89e3efb111",
		spurs: "richmenu-a8be71c1d2f0d75aa06b4deade2f478d",
		pistons: "richmenu-4371aead8232c78a6b0d9bf7cf56290c",
		magic: "richmenu-2c2c91b463df2305f8c65b30119653ac",
		knicks: "richmenu-31732133f94a57f2b11a1342cf804619",
		nets: "richmenu-bf0927b80015db7009bd915788b8ca09",
		nuggets: "richmenu-75cb638bcf903c88d5b4b7ce78788f33",
		pelicans: "richmenu-24c557c709903db69cac5af1cf47ccc6",
		timberwolves: "richmenu-fa441849698dd5508a97ef0c38b7afc3"
	},
	ActionsPerPage: 3,
	LabelCharLength: 20
};

module.exports.API = API;