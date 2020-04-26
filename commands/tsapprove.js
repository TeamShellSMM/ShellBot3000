const TSCommand = require('../TSCommand.js');

class TSApprove extends TSCommand {
    constructor() {
        super('tsapprove', {
           aliases: ['tsapprove', 'tsreject', 'tsapprove+c', 'tsapprove+cl', 'tsapprove+lc', 'tsfix', 'tsfix+c', 'tsfix+cl', 'tsfix+lc',
           'approve', 'reject', 'approve+c', 'approve+cl', 'approve+lc', 'fix', 'fix+c', 'fix+cl', 'fix+lc'],
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

    async tsexec(ts,message,args) {
      /*
        Possible command syntax:
        !tsapprove code difficulty reason
        !tsreject code reason

        in channel
        !tsapprove difficulty reason
        !tsreject reason
      */
      const clearCommands = ['tsapprove+c', 'tsapprove+cl', 'tsapprove+lc', 'tsfix+c', 'tsfix+cl', 'tsfix+lc',
      'approve+c', 'approve+cl', 'approve+lc', 'fix+c', 'fix+cl', 'fix+lc'];
      const likeCommands =  ['tsapprove+cl', 'tsapprove+lc', 'tsfix+cl', 'tsfix+lc',
      'approve+cl', 'approve+lc', 'fix+cl', 'fix+lc'];

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
        message.channel.id === ts.channels.modChannel  //only in shellder-bot channel
        || message.channel.id === ts.channels.pendingShellbot  //or in pending-shellbot channel
        || inCodeDiscussionChannel //should also work in the discussion channel for that level
      )) return false; //silently fail

      if(command.command.indexOf("reject") !== -1){
        //Difficulty doesn't exist in reject, so it get replaced by reason
        args.reason = args.difficulty;
        args.difficulty = "";
      }

      if(args.code){
        args.code = args.code.toUpperCase();
      }

      //Then Check the other args
      if(command.command.indexOf("approve") !== -1 || command.command.indexOf("fix") !== -1 || clearCommands.indexOf(command.command) !== -1){
        //We only check difficulty in tsapprove mode
        if(!ts.valid_difficulty(args.difficulty)){
          ts.userError(ts.message('approval.invalidDifficulty'));
        }
      }

      if(command.command.indexOf("reject") !== -1){
        args.type = "reject";
      } else if (command.command.indexOf("fix") !== -1){
        args.type = "fix";
      } else {
        args.type = "approve";
      }

      args.discord_id=message.author.id
      var replyMessage=await ts.approve(args)
      message.reply(replyMessage);

      //clear
      if(clearCommands.indexOf(command.command) !== -1){
          args.completed=1;
        if(likeCommands.indexOf(command.command) !==-1)
          args.like=1;
        var clearMessage=await ts.clear(args)
        this.client.channels.get(ts.channels.commandFeed).send(clearMessage)
      }
    }
}
module.exports = TSApprove;