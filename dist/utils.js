"use strict";

var Utils = {
  replyText: function replyText(client, token, texts) {
    texts = Array.isArray(texts) ? texts : [texts];
    return client.replyMessage(token, texts.map(function (text) {
      return {
        type: 'text',
        text: text
      };
    })).catch(function (e) {
      console.log(e.originalError.response.data.message);
    });
  },
  toObject: function toObject(data) {
    var response = [];
    data.split("&").map(function (subset) {
      response[subset.split("=")[0]] = subset.split("=")[1];
    });
    return response;
  }

};

module.exports.Utils = Utils;