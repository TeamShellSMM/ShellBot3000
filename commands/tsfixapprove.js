const { Command } = require('discord-akairo');
const Plays = require('../models/Plays');
const PendingVotes = require('../models/PendingVotes');

class TSFixApprove extends Command {
    constructor() {
        super('tsfixapprove', {
           aliases: ['tsfixapprove', 'tsfixreject'],
           split: 'quoted',
            args: [{
                id: 'message',
                type: 'string',
                default: ''
              },
            ],
           channelRestriction: 'guild'
        });
    }

    async exec(message,args) {
      try {
        var ts=get_ts(message.guild.id)
      } catch(error){
        message.reply(error)
        throw error;
      }
      
      try{
      /*
        Possible command syntax:
        !tsapprove code difficulty reason
        !tsreject code reason

        in channel
        !tsapprove difficulty reason
        !tsreject reason
      */
      var command=ts.parse_command(message);
      var inReuploadChannel = false;
      let code = "";

      //Check if in level discussion channel
      if(ts.valid_code(message.channel.name.toUpperCase())){
        inReuploadChannel = true;
        code = message.channel.name.toUpperCase();
      } else {
        //Check the code only if not in discussion channel
      }

      if(!(
        inReuploadChannel //should also work in the discussion channel for that level
      )) return false; //silently fail

      if(code){
        code = code.toUpperCase();
      }

      let approving = false;

      if(command.command==="tsfixapprove"){
        approving = true;
      }

      args.discord_id=message.author.id

      let replyMessage = "";
      if(approving){
        replyMessage = await ts.judge(code, true);
      } else {
        if(args.message){
          replyMessage = await ts.rejectLevelWithReason(code, message.author, args.message);
        } else {
          ts.userError("You have to provide a message to the creator explaining why this was rejected!");
        }
      }

      message.reply(replyMessage);
      } catch(error){
        message.reply(ts.getUserErrorMsg(error))
      }
    }
}
module.exports = TSFixApprove;