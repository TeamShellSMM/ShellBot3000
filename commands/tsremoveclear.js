const { Command } = require('discord-akairo');
const Plays = require('../models/Plays');

class TSRemoveclear extends Command {
    constructor() {
        super('tsremoveclear', {
           aliases: ['tsremoveclear',"removeclear"],
            args: [{
                    id: 'code',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }

    async exec(message,args) {
        try{

          args.code=args.code.toUpperCase();
          if(!ts.valid_code(args.code))
            ts.userError("You did not provide a valid code for the level");

          await gs.loadSheets(["Raw Members","Raw Levels"]);
          const player=await ts.get_user(message);
          var level=ts.getExistingLevel(args.code)

          var existing_play = await Plays.query()
            .where('code','=',args.code)
            .where('player','=',player.Name)
            .first();

          if(!existing_play || existing_play && existing_play.completed!="1")
            ts.userError("You haven't submitted a clear for \""+level["Level Name"]+" by "+level.Creator)

          await Plays.query()
            .findById(existing_play.id)
            .patch({
              completed: 0,
              liked: 0,
              difficulty_vote: null
            });

          var msg="You have removed your clear for "+level["Level Name"]+" by "+level.Creator+" "+ts.emotes.bam
          message.channel.send(player.user_reply+msg)
        } catch(error){
            message.reply(ts.getUserErrorMsg(error))
        }
    }
}
module.exports = TSRemoveclear;