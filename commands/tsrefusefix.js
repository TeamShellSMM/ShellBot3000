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
        if(args.code){
          args.code == args.code.toUpperCase();
        }

        if(!ts.valid_code(args.code))
          ts.userError("You did not provide a valid code for the level")

        if(!args.message){
          ts.userError("Please provide a little message to the shellders for context at the end of the command (in quotes)")
        }

        await gs.loadSheets(["Raw Members","Raw Levels"]); //when everything goes through shellbot 3000 we can do cache invalidation stuff
        const player=await ts.get_user(message);
        var level=gs.select("Raw Levels",{"Code":args.code});
        const author = gs.select("Raw Members",{"Name":level.Creator});

        if(level.Approved!="-10")
          ts.userError("This level is not currently in a fix request!");

        //only creator can use this command
        if(!(level.Creator==player.Name))
          ts.userError("You can only use this command on one of your own levels that currently has an open fix request.");

        //generate judgement embed
        var overviewMessage;
        var discussionChannel;

        let guild=ts.getGuild()

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
          await discussionChannel.send("Reupload Request for <@" + author.discord_id + ">'s level with message: " + args.message);
          let voteEmbed = await ts.makePendingReuploadEmbed(level, author, true);
          overviewMessage = await discussionChannel.send(voteEmbed);
          overviewMessage = await overviewMessage.pin();

        } else {
          ts.userError("You already sent this reupload request back!");
        }

        var replyMessage = "Your level was put in the pending reupload queue, we'll get back to you in a bit!";

        message.reply(replyMessage);

      } catch (error){
        message.reply(ts.getUserErrorMsg(error))
      }
    }
}
module.exports = TSRefuseFix;