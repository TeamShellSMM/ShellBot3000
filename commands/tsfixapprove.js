const TSCommand = require('../TSCommand.js');
class TSFixApprove extends TSCommand {
    constructor() {
        super('tsfixapprove', {
           aliases: ['tsfixapprove', 'tsfixreject', 'fixapprove', 'fixreject'],
           split: 'quoted',
            args: [{
                id: 'reason',
                type: 'string',
                default: null
              },
            ],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,{ reason }) {
      /*
        Possible command syntax:
        !tsapprove code difficulty reason
        !tsreject code reason

        in channel
        !tsapprove difficulty reason
        !tsreject reason
      */
      var command=ts.parse_command(message);
      var inReuploadChannel = false;
      let code = "";

      //Check if in level discussion channel
      if(ts.valid_code(message.channel.name.toUpperCase())){
        inReuploadChannel = true;
        code = message.channel.name.toUpperCase();
      } else {
        //Check the code only if not in discussion channel
      }

      if(!(
        inReuploadChannel //should also work in the discussion channel for that level
      )) return false; //silently fail

      if(code){
        code = code.toUpperCase();
      }

      let approving = false;

      if(command.command==="tsfixapprove" || command.command==="fixapprove"){
        approving = true;
      }

      let replyMessage = "";
      if(approving){
        await ts.approve({
          discord_id:message.author.id,
          code,
          type:'approve',
          reason,
          skip_update:true,
        })
        replyMessage = await ts.judge(code, true);
      } else {
        if(args.message){
          replyMessage = await ts.rejectLevelWithReason(code, message.author, args.message);
        } else {
          ts.userError(ts.message('fixApprove.noReason'));
        }
      }

      await message.reply(replyMessage);
    }
}
module.exports = TSFixApprove;