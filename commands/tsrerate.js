const { Command } = require('discord-akairo');
const channels = require('../channels.json');
const emotes = require('../emotes.json');
class TSRerate extends Command {
    constructor() {
        super('tsrerate', {
           aliases: ['tsrerate'],
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

      await gs.loadSheets(["Raw Levels"]);
      const level=gs.select("Raw Levels",{"Code":args.code});

      console.log("tsrerate log 1:", level);

      await gs.loadSheets(["Raw Members"]); //when everything goes through shellbot 3000 we can do cache invalidation stuff
      const author = gs.select("Raw Members",{"Name":level.creator});

      console.log("tsrerate log 2:", author);

      var oldDiff = level.Difficulty;

      level.Difficulty = args.difficulty;
      var updateLevel = gs.query("Raw Levels", {
        filters: {"Code":args.code},
        update: {"Difficulty": args.difficulty}
      });
      gs.batchUpdate([updateLevel.update_ranges]);
      
      this.client.channels.get(channels.initiateChannel).send(level["Level Name"] + " (" + level.Code + ") by <@" + author.discord_id + ">: Difficulty change by <@" +message.member.id + "> - " + oldDiff + " to " + args.difficulty + " (Reason: " + args.reason + ")");
    }
}
module.exports = TSRerate;