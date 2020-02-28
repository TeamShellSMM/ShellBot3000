const { Command } = require('discord-akairo');
const channels = require('../channels.json');
class TSApprove extends Command {
    constructor() {
        super('tsapprove', {
           aliases: ['tsapprove', 'tsreject'],
            args: [{
                id: 'code',
                type: 'string',
                default: ''
              },
              {
                id: 'difficulty',
                type: 'string',
                default: ''
              },
              {
                id: 'reason',
                type: 'string',
                default: ''
              }
            ],
           channelRestriction: 'guild'
        });
    }
    
    async exec(message,args) {     
      /*
        Possible command syntax:
        !tsapprove code difficulty reason
        !tsreject code reason

        in channel
        !tsapprove difficulty reason
        !tsreject reason
      */

      var raw_command=message.content.trim();
      raw_command=raw_command.split(" ");
      var sb_command=raw_command.shift().toLowerCase().substring(1);

      var inCodeDiscussionChannel = false;

      //Check if in level discussion channel
      if(inCodeDiscussionChannel){
        inCodeDiscussionChannel = true;
        args.reason = args.difficulty;
        args.difficulty = args.code;
        //Set current code from level sheet where channel id matches
        args.code = "XXX-XXX-XXX";
      }

      if(sb_command === "tsreject"){
        args.reason = args.difficulty;
        //Check args and give error message and return if something isn't right
      } else {
        //Check args and give error message and return if something isn't right
      }


      if(!( 
        message.channel.id === channels.shellderShellbot  //only in bot-test channel
        || inCodeDiscussionChannel //should also work in the discussion channel for that level
      )) return false;

      if(!inCodeDiscussionChannel){
        //Create new channel and set channel id in level sheet
      }

      //Add/Update Approval/Rejection to new sheet 'shellder votes?' + difficulty + reason
    }
}
module.exports = TSApprove;