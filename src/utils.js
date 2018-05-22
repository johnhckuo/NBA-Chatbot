const Utils = {
  replyText : function(client, token, texts){
    texts = Array.isArray(texts) ? texts : [texts];
    return client.replyMessage(
      token,
      texts.map((text) => ({
        type: 'text',
        text
      }))
    ).catch((e)=>{
      console.log(e.originalError.response.data.message)
    });
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
