const { Command } = require('discord-akairo');
class TSRerate extends Command {
    constructor() {
        super('tsrerate', {
           aliases: ['tsrerate'],
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
    
    async exec(message,args) {
      if(!( 
        message.channel.id === ts.channels.shellderShellbot  //only in bot-test channel
      )) return false;

      if(args.code){        
        args.code = args.code.toUpperCase();
      }

      //Check all the args first
      if(!ts.valid_code(args.code)){
        message.reply("Level Code is invalid! " + ts.emotes.think);
        return false;
      }

      await gs.loadSheets(["Raw Levels", "Raw Members"]);
      const level=gs.select("Raw Levels",{"Code":args.code});

      if(!level){
        message.reply("Level Code was not found! " + ts.emotes.think);
        return false;
      }

      const author = gs.select("Raw Members",{"Name":level.Creator});

      if(!author){
        message.reply("Author was not found in Members List! " + ts.emotes.think);
        return false;
      }

      if(!ts.valid_difficulty(args.difficulty)){
        message.reply("Invalid difficulty format! " + ts.emotes.think);
        return false;
      }

      if(!args.reason){
        message.reply("You need to give a reason for the change (in quotation marks)!");
        return false;
      }

      var oldDiff = level.Difficulty;

      var updateLevel = gs.query("Raw Levels", {
        filter: {"Code":args.code},
        update: {"Difficulty": args.difficulty}
      });
      if(updateLevel.Code == args.code){
        await gs.batchUpdate(updateLevel.update_ranges);
      }
      
      var rerateEmbed = this.client.util.embed()
            .setColor("#17a2b8")
            .setAuthor("Difficulty rating updated from "+oldDiff + " to " + args.difficulty)
            .setTitle(level["Level Name"] + " (" + level.Code + ")")
            .setDescription("made by <@" + author.discord_id + ">")

          rerateEmbed.addField("\u200b","**Reason** :\n```"+args.reason+"```\nRerated by <@" +message.member.id + ">");
          rerateEmbed = rerateEmbed.setTimestamp();
          
          //Send Rejection to #shellder-level-changes
      await this.client.channels.get(ts.channels.shellderLevelChanges).send(rerateEmbed);
      message.reply("Difficulty was successfully changed!");
    }
}
module.exports = TSRerate;