const { Command } = require('discord-akairo');
const Plays = require('../models/Plays');
const PendingVotes = require('../models/PendingVotes');




class TSApprove extends Command {
    constructor() {
        super('tsapprove', {
           aliases: ['tsapprove', 'tsreject', 'tsapprove+c', 'tsapprove+cl', 'tsapprove+lc'],
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
              }
            ],
           channelRestriction: 'guild'
        });
    }

    async exec(message,args) {
      try{
      /*
        Possible command syntax:
        !tsapprove code difficulty reason
        !tsreject code reason

        in channel
        !tsapprove difficulty reason
        !tsreject reason
      */



      const clearCommands = ['tsapprove+c', 'tsapprove+cl', 'tsapprove+lc'];
      const likeCommands =  ['tsapprove+cl', 'tsapprove+lc'];

      var command=ts.parse_command(message);
      var inCodeDiscussionChannel = false;

      //Check if in level discussion channel
      if(ts.valid_code(message.channel.name.toUpperCase())){
        inCodeDiscussionChannel = true;
        args.reason = args.difficulty;
        args.difficulty = args.code;
        args.code = message.channel.name.toUpperCase();
      } else {
        //Check the code only if not in discussion channel
        if(!ts.valid_code(args.code.toUpperCase())){
          ts.userError("Level Code is invalid! ")
        }
      }

      if(!(
        message.channel.id === ts.channels.shellderShellbot  //only in shellder-bot channel
        || inCodeDiscussionChannel //should also work in the discussion channel for that level
      )) return false;

      if(command.command == "tsreject"){
        //Difficulty doesn't exist in reject, so it get replaced by reason
        args.reason = args.difficulty;
        args.difficulty = "";
      }

      if(args.code){
        args.code = args.code.toUpperCase();
      }

      //Then Check the other args
      if(command.command == "tsapprove" || clearCommands.indexOf(command.command) !== -1){
        //We only check difficulty in tsapprove mode
        if(!ts.valid_difficulty(args.difficulty)){
          ts.userError("Invalid difficulty format!");
        }
      }

      args.type=command.command==="tsreject"?"reject":"approve"
      args.discord_id=message.author.id
      var replyMessage=await ts.approve(args)
      const shellder=await ts.get_user(args.discord_id);
      
      if(clearCommands.indexOf(command.command) !== -1){
        //Add a clear to the level if it's not already there
        var played = await Plays.query()
          .where('code', '=', args.code)
          .where('player', '=', shellder.Name)
          .first();

        if(played){
          //Update

            await Plays.query()
              .findById(played.id)
              .patch({
              liked: likeCommands.indexOf(command.command) !== -1 ? 1 : 0,
              difficulty_vote: args.difficulty
            });

          replyMessage += " You also updated your clear and community vote on this level!";

          if(likeCommands.indexOf(command.command) !== -1){
            replyMessage += " You also liked the level " + ts.emotes.love + "!";
          }
        } else {
          //Insert
          await Plays.query().insert({
            "code": level.Code,
            "player": shellder.Name,
            "completed": "1",
            "is_shellder": "1",
            "liked": likeCommands.indexOf(command.command) !== -1 ? 1 : 0,
            "difficulty_vote": args.difficulty
          });

          replyMessage += " You also added a clear and community vote on this level!";

          if(likeCommands.indexOf(command.command) !== -1){
            replyMessage += " You also liked the level " + ts.emotes.love + "!";
          }
        }
      }
        message.reply(replyMessage);

      } catch(error){
        message.reply(ts.getUserErrorMsg(error))
      }
    }
}
module.exports = TSApprove;