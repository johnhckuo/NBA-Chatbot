const Utils = {
  replyText : function(client, token, texts){
    texts = Array.isArray(texts) ? texts : [texts];
    return client.replyMessage(
      token,
      texts.map((text) => ({
        type: 'text',
        text
      }))
    );
  },
  toObject : function(data){
    var response = [];
    data.split("&").map((subset)=>{
      response[subset.split("=")[0]] = subset.split("=")[1];
    });
    return response;
  },

}

module.exports.Utils = Utils;
