const { Command } = require('discord-akairo');
const channels = require('../channels.json');
const emotes = require('../emotes.json');
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
        message.channel.id === channels.shellderShellbot  //only in bot-test channel
      )) return false;

      //Check all the args first
      if(!ts.valid_code(args.code)){
        message.reply("Level Code is invalid! " + emotes.think);
        return false;
      }

      await gs.loadSheets(["Raw Levels", "Raw Members"]);
      const level=gs.select("Raw Levels",{"Code":args.code});

      if(!level){
        message.reply("Level Code was not found! " + emotes.think);
        return false;
      }

      const author = gs.select("Raw Members",{"Name":level.Creator});

      if(!author){
        message.reply("Author was not found in Members List! " + emotes.think);
        return false;
      }

      if(!ts.valid_difficulty(args.difficulty)){
        message.reply("Invalid difficulty format! " + emotes.think);
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
        console.log(await gs.batchUpdate(updateLevel.update_ranges));
      }
      
      this.client.channels.get(channels.shellderLevelChanges).send(level["Level Name"] + " (" + level.Code + ") by <@" + author.discord_id + ">: Difficulty changed by <@" +message.member.id + "> - " + oldDiff + " to " + args.difficulty + " (Reason: " + args.reason + ")");
      message.reply("Difficulty was successfully changed!");
    }
}
module.exports = TSRerate;