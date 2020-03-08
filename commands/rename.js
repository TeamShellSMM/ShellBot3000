const { Command } = require('discord-akairo');
class TSRename extends Command {
    constructor() {
        super('tsrename', {
           aliases: ['tsrename','rename'],
           channelRestriction: 'guild'
        });
    }
    
    async exec(message,args) {     
         //if(!( 
        //    message.channel.id === ts.channels.shellderShellbot  //only in bot-test channel
        //)) return false;
      try {

        let command=ts.parse_command(message);
        let code=command.arguments.shift()
        if(code)
          code=code.toUpperCase()

        if(!ts.valid_code(code))
          ts.userError("You did not provide a valid level code")

        const level_name=command.arguments.join(" ")

        if(!level_name)
          ts.userError("You didn't give a new level name")

        
        await gs.loadSheets(["Raw Members","Raw Levels","Raw Played"]); //when everything goes through shellbot 3000 we can do cache invalidation stuff
  
        const player=ts.get_user(message);
        var level=gs.select("Raw Levels",{"Code":code})

        if(!level || level && level.Approved!="0" && level.Approved!="1")
          ts.userError("Level code not found");
        
        if(!(level.Creator==player.Name || player.shelder=="1"))
          ts.userError("You can't rename \""+level["Level Name"]+"\" by "+level.Creator);

        level=gs.query("Raw Levels",{
          filter:{"Code":code},
          update:{"Level Name":level_name},
        })

        if(!level.updated["Level Name"])
          ts.userError("Level name is already \""+level_name+"\"")

        await gs.batchUpdate(level.update_ranges)


        var reply="The level \""+level["Level Name"]+"\" ("+code+") has been renamed to \""+level_name+"\" "+ts.emotes.bam
        message.channel.send(player.user_reply+reply)
      } catch (error) {
        message.reply(ts.getUserErrorMsg(error))
      }
    }
}
module.exports = TSRename;