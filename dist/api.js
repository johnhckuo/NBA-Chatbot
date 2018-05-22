"use strict";

var API = {
   LineRoot: "https://api.line.me/v2/bot",
   NBARoot: "http://data.nba.net/prod/v1",
   API_Table: "http://data.nba.net/10s/prod/v1/today.json",
   RichMenu: {
      suns: "richmenu-becfa7f0e60b8cc5b7474f7c931e6899",
      pistons: "richmenu-30bc8e135936b116713822638b14ac10",
      timberwolves: "richmenu-c8ad06fc802454b7813f75041bef5802",
      raptors: "richmenu-cc5ebbf24e2effbda44b0f792596d9c7",
      rockets: "richmenu-ac6084bc969e86fb8835a37fc8fdb34a",
      heat: "richmenu-7f3e79aef550b62050d0fc7ff5704c58",
      thunder: "richmenu-d7c42bb5ec8982a69e8ff59d437f2ff3",
      warriors: "richmenu-a422a86c18543f8b09b168e6ea3e1dde",
      cavaliers: "richmenu-3fe42578eccdbf13a25f6e6353b9545b",
      nets: "richmenu-ed312857c35f8e246a01470db230386c",
      kings: "richmenu-e4e21f744e3b08999737946cdeed12aa",
      spurs: "richmenu-2a54d760d71986bf6cc943b40b2ee6df",
      knicks: "richmenu-55220d47c5f2631a67f2a2f9c0156f60",
      wizards: "richmenu-a439989db7708d1fbb21b0750a220388",
      bulls: "richmenu-7ce9555166281ccc6d47c725437a72ee",
      bucks: "richmenu-395839560971d735f048c9d3d48bb619",
      sixers: "richmenu-c571422a453604be99cbe01385ecc791",
      pacers: "richmenu-523c901954dcb996ccd8fce0557dafc9",
      clippers: "richmenu-f932c0b6763c0d44dc5abaf13091887e",
      magic: "richmenu-cae2693cd24026fded0f80a3f5fb6fec",
      grizzlies: "richmenu-ca27500cb96ab5815e3b55da3ddf26eb",
      mavericks: "richmenu-490efdd827f0a0370ef7d82068090948",
      nuggets: "richmenu-8e05bf0052d542a9ab7f1ccc269e2179",
      hawks: "richmenu-08b7b34f949261e96327d48b43a8ea4f",
      lakers: "richmenu-d052b40205eabe5e51ddf574b984dac5",
      hornets: "richmenu-e2d61762a31fb440af6e7fafbc5882b7",
      pelicans: "richmenu-9cb3d712c231a063693cdeb047aa93d9",
      blazers: "richmenu-81b0e03046c5fa8b9ede225d616fa362",
      jazz: "richmenu-d387c1d9f46f9ac268f3860923abed23",
      celtics: "richmenu-9df2afa14ad11ca5474dfb89470c6d97"
   },
   ActionsPerPage: 3,
   LabelCharLength: 20
};

module.exports.API = API;