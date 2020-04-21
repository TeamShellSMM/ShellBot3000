const TSCommand = require('../TSCommand.js');
class TSRerate extends TSCommand {
    constructor() {
        super('tsrerate', {
           aliases: ['tsrerate', 'rerate'],
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
            }],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,args) {
      if(!(
        message.channel.id === ts.channels.shellderShellbot  //only in bot-test channel
      )) return false;

      if(args.code){
        args.code = args.code.toUpperCase();
      }

      //Check all the args first
      if(!ts.valid_code(args.code))
        ts.userError("Level Code is invalid!")

      if(!ts.valid_difficulty(args.difficulty))
          ts.userError("Invalid difficulty format!");

      await ts.gs.loadSheets(["Raw Levels", "Raw Members"]);
      const level=ts.getExistingLevel(args.code);
      const author = ts.gs.select("Raw Members",{"Name":level.Creator});

      if(level.Approved!=="1")
        ts.userError("Level is not an approved level")


      if(!args.reason)
        ts.userError("You need to give a reason for the change (in quotation marks)!");

      var oldDiff = level.Difficulty;

      var updateLevel = ts.gs.query("Raw Levels", {
        filter: {"Code":args.code},
        update: {"Difficulty": args.difficulty}
      });

      if(!updateLevel.updated["Difficulty"])
        ts.userError("\""+level["Level Name"]+"\" is already rated "+args.difficulty)

      if(updateLevel.Code == args.code){
        await ts.gs.batchUpdate(updateLevel.update_ranges);
      }

      var rerateEmbed = ts.levelEmbed(level)
            .setColor("#17a2b8")
            .setAuthor("Difficulty rating updated from "+oldDiff + " to " + args.difficulty)
            .addField("\u200b","**Reason** :\n```"+args.reason+"```Rerated by <@" +message.member.id + ">")

      var levelChangeChannel=await this.client.channels.get(ts.channels.shellderLevelChanges)

      if(author){ //edge case of no discord_id
        var mention = "**<@" + author.discord_id + ">, we got some news for you: **";
        await levelChangeChannel.send(mention);
      }
      await levelChangeChannel.send(rerateEmbed);
      message.reply("Difficulty was successfully changed!");
  }
}
module.exports = TSRerate;