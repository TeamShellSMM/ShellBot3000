const { Command } = require('discord-akairo');
const channels = require('../channels.json');
class TSJudge extends Command {
    constructor() {
        super('tsjudge', {
           aliases: ['tsjudge'],
            args: [],
           channelRestriction: 'guild'
        });
    }
    
    async exec(message,args) {     
      var inCodeDiscussionChannel = false;

      //Check if in level discussion channel
      if(inCodeDiscussionChannel){
        inCodeDiscussionChannel = true;
        //Set current code from level sheet where channel id matches
        args.code = "XXX-XXX-XXX";
      }


      if(!( 
        message.channel.id === channels.shellderShellbot  //only in bot-test channel
        && inCodeDiscussionChannel //should also work in the discussion channel for that level
      )) return false;

      var raw_command=message.content.trim();
      raw_command=raw_command.split(" ");
      var sb_command=raw_command.shift().toLowerCase().substring(1);

      //Count Approval and Rejection Votes
      var approvalVotes = 0;
      var rejectVotes = 0;

      if(rejectVotes >= 3){
        //Reject Level and post shellder rejection reasons in channels.shellderLevelChanges + all reasons
        //Remove Discussion Channel
      } else if (approvalVotes >= 3){
        //Approve Level and post difficulty reasons in channels.shellderLevelChanges (use highest difficulty vote + all reasons by each shellder?)
        //Remove Discussion Channel
      }
    }
}
module.exports = TSJudge;