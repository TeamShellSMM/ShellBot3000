const { Command } = require('discord-akairo');
const Discord = require('discord.js');
class TSJudge extends Command {
    constructor() {
        super('tsjudge', {
           aliases: ['tsjudge'],
            args: [],
           channelRestriction: 'guild'
        });
    }
    
    async exec(message,args) {     
      try{
      var inCodeDiscussionChannel = false;
      var levelCode;
      //Check if in level discussion channel
      if(ts.valid_code(message.channel.name.toUpperCase())){
        inCodeDiscussionChannel = true;
        levelCode = message.channel.name.toUpperCase();
      }

      if(!( 
        inCodeDiscussionChannel //should also work in the discussion channel for that level
      )) return false;

      //Reload sheets
      await ts.judge(levelCode)


      } catch (error){
        message.reply(ts.getUserErrorMsg(error))
      }
    }
}
module.exports = TSJudge;