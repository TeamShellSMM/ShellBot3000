const { Command } = require('discord-akairo');
const Discord = require('discord.js');

class TSRefuseFix extends Command {
    constructor() {
        super('tsrefusefix', {
           aliases: ['tsrefusefix'],
            args: [{
              id: 'code',
              type: 'string',
              default: ''
            },
            {
              id: 'message',
              type: 'string',
              default: ''
            }
          ],
           channelRestriction: 'guild'
        });
    }

    async exec(message,args) {
      try{
        if(!ts.valid_code(args.code))
          ts.userError("You did not provide a valid code for the level")

        await gs.loadSheets(["Raw Members","Raw Levels"]); //when everything goes through shellbot 3000 we can do cache invalidation stuff
        const player=await ts.get_user(message);
        var level=ts.getExistingLevel(args.code)

        if(level.Approved!="-10")
          ts.userError("This level is not currently in a fix request!");

        //only creator can use this command
        if(!(level.Creator==player.Name))
          ts.userError("You can only use this command on one of your own levels that currently has an open fix request.");

        //generate judgement embed
        var overviewMessage;
        var discussionChannel;

        let guild=this.getGuild()

        discussionChannel = guild.channels.find(channel => channel.name === level.Code.toLowerCase() && channel.parent.name === "pending-reuploads"); //not sure should specify guild/server

        if(!discussionChannel){
          //Create new channel and set parent to category
          if(guild.channels.get(ts.channels.pendingReuploadCategory).children.size===50){
            ts.userError("Can't handle the request right now because there are already 50 open reupload requests (this should really never happen)!")
          }
          discussionChannel = await guild.createChannel(args.code, {
            type: 'text',
            parent: guild.channels.get(ts.channels.pendingReuploadCategory)
          });
          //Post empty overview post
          overviewMessage = await discussionChannel.send("**The level '" + level["Level Name"] + " (" + level.Code + ") by <@" + author.discord_id + ">' has NOT been reuploaded, please check the fixvotes and decide if this is still acceptable to approve or not (use !tsapprove or !tsreject)");
          overviewMessage = await overviewMessage.pin();
        } else {
          ts.userError("You already sent this reupload request back!");
        }

        await overviewMessage.edit(voteEmbed);

        var replyMessage = "Your vote was added to <#" + discussionChannel.id + ">!";

        message.reply(replyMessage);

      } catch (error){
        message.reply(ts.getUserErrorMsg(error))
      }
    }
}
module.exports = TSRefuseFix;