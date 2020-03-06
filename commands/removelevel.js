const { Command } = require('discord-akairo');

class tsremove extends Command {
    constructor() {
        super('tsremove', {
           aliases: ['tsremove','tsremovelevel','remove'],
           channelRestriction: 'guild'
        });
    }
    
    async exec(message,args) {     
         //if(!( 
        //    message.channel.id === ts.channels.shellderShellbot  //only in bot-test channel
        //)) return false;
      try {
        await gs.loadSheets(["Raw Members","Raw Levels","Raw Played"]); //when everything goes through shellbot 3000 we can do cache invalidation stuff
  
        const player=ts.get_user(message);
        var command=ts.parse_command(message) 

        var level_code=command.arguments.shift().toUpperCase();
        var reason=command.arguments.join(" ")

        if(!ts.valid_code(level_code))
          ts.userError("You did not provide a valid code for the level")

        if(!reason)
          ts.userError("You did not provide a reason to remove this level. If you want to reupload, we recommend using the `!tsreupload` command. If you want to remove it now and reupload it later make sure __you don't lose the old code__")

        var level=gs.select("Raw Levels",{"Code":level_code}) //old level to be reuploadd
        if(!level)
          ts.userError("Level not found");

        if(level.Approved!="0" && level.Approved!="1") 
          ts.userError("\""+level["Level Name"]+"\" by "+level.Creator+" has already been removed");

        //only creator and shellder can reupload a level
        if(!(level.Creator==player.Name || player.shelder=="1"))
          ts.userError("You can't remove \""+level["Level Name"]+"\" by "+level.Creator);
  
        const approvedStr=level.Approved=="1"?2: (level.Creator!=player.Name && player.shelder=="1"?-2:-1); //tsremove run by shellders and not their own levels get -2
        level=gs.query("Raw Levels",{
          filter:{"Code":level_code},
          update:{"Approved":approvedStr},
        })


        //combine all the updates into one array to be passed to gs.batchUpdate
        var batch_updates=level.update_ranges
        await gs.batchUpdate(batch_updates)


        var removeEmbed = this.client.util.embed()
            .setColor("#dc3545")
            .setAuthor("This level has been removed by "+player.Name)
            .setTitle(level["Level Name"] + " (" + level.Code + ")")
            .setDescription("made by [" + level.Creator + "](https://teamshell.net/levels/?creator=" + encodeURIComponent(level.Creator) + ")")

          removeEmbed.addField("\u200b","**Reason for removal** :```"+reason+"```-<@" +player.discord_id + ">");
          removeEmbed = removeEmbed.setTimestamp();
          //Send updates to to #shellbot-level-update
      
        if(level.Creator!=player.Name){ //moderation
          const creator=gs.select("Raw Members",{"Name":level.Creator})
          var mention = "**<@" + creator.discord_id + ">, we got some news for you: **";
          await this.client.channels.get(ts.channels.shellderLevelChanges).send(mention);
        }

        var reply="You have removed \""+level["Level Name"]+"\" by "+level.Creator+" "+ts.emotes.buzzyS
        await this.client.channels.get(ts.channels.shellderLevelChanges).send(removeEmbed);
        await message.channel.send(player.user_reply+reply)
      } catch (error) {
        message.reply(ts.getUserErrorMsg(error))
      }
    }
}
module.exports = tsremove;