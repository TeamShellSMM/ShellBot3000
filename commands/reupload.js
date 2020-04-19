const { Command } = require('discord-akairo');

class tsreupload extends Command {
    constructor() {
        super('tsreupload', {
          aliases: ['tsreupload','reupload'],
          channelRestriction: 'guild'
        });
    }

    async exec(message,args) {
         //if(!(
        //    message.channel.id === ts.channels.shellderShellbot  //only in bot-test channel
        //)) return false;
        try {
          var ts=get_ts(message.guild.id)
        } catch(error){
          message.reply(error)
          throw error;
        }

      try {
        let reply = await ts.reuploadLevel(message);
        message.channel.send(reply)
      } catch (error) {
        message.reply(ts.getUserErrorMsg(error))
      }
    }
}
module.exports = tsreupload;