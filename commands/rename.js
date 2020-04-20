const TSCommand = require('../TSCommand.js');
class TSRename extends TSCommand {
    constructor() {
        super('tsrename', {
           aliases: ['tsrename','rename'],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,args) {
      let command=ts.parse_command(message);
      let code=command.arguments.shift()
      if(code)
        code=code.toUpperCase()

      if(!ts.valid_code(code))
        ts.userError("You did not provide a valid level code")

      const level_name=command.arguments.join(" ")

      if(!level_name)
        ts.userError("You didn't give a new level name")


      await ts.gs.loadSheets(["Raw Members","Raw Levels"]); //when everything goes through shellbot 3000 we can do cache invalidation stuff

      const player=await ts.get_user(message);
      var level=ts.getExistingLevel(code)

      if(!(level.Creator==player.Name || player.shelder=="1"))
        ts.userError("You can't rename \""+level["Level Name"]+"\" by "+level.Creator);

      level=ts.gs.query("Raw Levels",{
        filter:{"Code":code},
        update:{"Level Name":level_name},
      })

      if(!level.updated["Level Name"])
        ts.userError("Level name is already \""+level_name+"\"")

      await ts.gs.batchUpdate(level.update_ranges)

      var reply="The level \""+level["Level Name"]+"\" ("+code+") has been renamed to \""+level_name+"\" "+(ts.emotes.bam ? ts.emotes.bam : "")
      message.channel.send(player.user_reply+reply)
    }
}
module.exports = TSRename;