const { Command } = require('discord-akairo');
const Plays = require('../models/Plays');

class tslike extends Command {
    constructor() {
        super('tslike', {
           aliases: ['tslike','like','tsunlike','unlike'],
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
          const likeCommands=["tslike","like"];

          args.code=args.code.toUpperCase();

          var command=ts.parse_command(message);
          if(!ts.valid_code(args.code))
            ts.userError("You did not provide a valid code for the level");

          await gs.loadSheets(["Raw Members","Raw Levels"]);
          const player=await ts.get_user(message);
          var level=ts.getExistingLevel(args.code)

          if(level.Creator==player.Name)
            ts.userError("You can't submit a like for your own level")

          var existing_play = await Plays.query()
            .where("code", "=", args.code)
            .where("player", "=", args.player);

          if(!existing_play || existing_play && existing_play.completed!="1")
            ts.userError("You haven't submitted a clear for \""+level["Level Name"]+" by "+level.Creator)

          var creator_str=ts.creator_str(level) //will return discord id if wants to be atted

          if(likeCommands.indexOf(command.command)!=-1){
            var likeVal=1
            var alreadyError="You have already liked \""+level["Level Name"]+" by "+level.Creator;
            var msg="You have liked \""+level["Level Name"]+"\"  by "+creator_str+" "+ts.emotes.love
          } else {
            var likeVal=0
            var alreadyError="You have not liked \""+level["Level Name"]+" by "+level.Creator;
            var msg="You have unliked \""+level["Level Name"]+"\"  by "+creator_str+" "+ts.emotes.bam
          }

          if(!existing_play.liked == likeVal)
            ts.userError(alreadyError)

          await Plays.query()
            .findById(existing_play.id)
            .patch({
              liked, likeVal
            });

          message.channel.send(player.user_reply+msg)
        } catch(error){
            message.reply(ts.getUserErrorMsg(error))
        }
    }
}
module.exports = tslike;