const TSCommand = require('../TSCommand.js');
class MakerId extends TSCommand {
    constructor() {
        super('makerid', {
           aliases: ['makerid'],
            args: [{
                    id: 'code',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,{ code }) {
      await ts.gs.loadSheets(["Raw Members"]);
      const player=await ts.get_user(message);

      code=code.toUpperCase();
      if(!ts.valid_code(code)){
        ts.userError(ts.message("error.invalidMakerCode",{ code }))
      }

      let existing_member=ts.gs.select("Raw Members",{"maker_id":code})
      if(existing_member.length>0){
        if(existing_member[0].discord_id!=player.discord_id){
            ts.userError(ts.message("makerid.existing",{ code , name:existing_member[0].Name }))
        } else if(existing_member[0].maker_id==code) {
            ts.userError(ts.message("makerid.already",{ code }))
        }
      }

      let member=ts.gs.query("Raw Members",{
        filter:{"discord_id":message.author.id},
        update:{"maker_id":code}
      })

      await ts.gs.batchUpdate(member.update_ranges)
      message.channel.send(player.user_reply+ts.message("makerid.success",{ code }))
    }
}
module.exports = MakerId;