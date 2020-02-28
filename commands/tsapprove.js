const { Command } = require('discord-akairo');
const channels = require('../channels.json');
class TSApprove extends Command {
    constructor() {
        super('tsapprove', {
           aliases: ['tsapprove', 'tsreject'],
           split: 'quoted',
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

      

      var inCodeDiscussionChannel = false;

      //Check if in level discussion channel
      if(ts.valid_code(message.channel.name)){
        inCodeDiscussionChannel = true;
        args.reason = args.difficulty;
        args.difficulty = args.code;
        args.code = message.channel.name;
      } else {
        //Check the code only if not in discussion channel
        if(!ts.valid_code(args.code)){
          message.reply("Level Code is invalid! " + emotes.think);
          return false;
        }
      }

      if(!( 
        message.channel.id === channels.shellderShellbot  //only in bot-test channel
        || inCodeDiscussionChannel //should also work in the discussion channel for that level
      )) return false;

      //Then Check the other args
      if(!ts.valid_difficulty(args.difficulty)){
        message.reply("Invalid difficulty format! " + emotes.think);
        return false;
      }

      if(!args.reason){
        message.reply("You need to give a reason for the change (in quotation marks)!");
        return false;
      }

      await gs.loadSheets(["Raw Levels"]);
      const level=gs.select("Raw Levels",{"Code":args.code});

      if(!level){
        message.reply("Level Code was not found! " + emotes.think);
        return false;
      }

      var raw_command=message.content.trim();
      raw_command=raw_command.split(" ");
      var sb_command=raw_command.shift().toLowerCase().substring(1);
      
      var discussionChannel;
      if(!inCodeDiscussionChannel){
        //Check if channel already exists
        discussionChannel = message.guild.channels.find(channel => channel.name === args.code);
        if(!discussionChannel){
          //Create new channel and set parent to category
          discussionChannel = await message.guild.createChannel(args.code, {
            type: 'text',
            parent: this.client.channels.get(channels.levelDiscussionCategory )
          });
          discussionChannel.send("**The Judgement for " + level["Level Name"] + " (" + level.Code + ") by <@" + author.discord_id + "> has now begun!**\n\nCurrent Votes for approving the level:\nNone\n\nCurrent votes for rejecting the level:\nNone");
        }
      }

      //Add/Update Approval/Rejection to new sheet 'shellder votes?' + difficulty + reason
      //Update/Post Overview post in discussion channel
    }
}
module.exports = TSApprove;