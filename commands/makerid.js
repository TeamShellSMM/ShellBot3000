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

      if(!code) ts.userError(ts.message('makerid.noCode'));

      const player=await ts.get_user(message);

    

      code=code.toUpperCase();
      if(!ts.valid_code(code)){
        ts.userError(ts.message('error.invalidMakerCode',{ code }))
      }

      let existing_member=await ts.db.Members.query().where({maker_id:code}).first()
      if(existing_member){
        if(existing_member.discord_id!=player.discord_id){
            ts.userError(ts.message("makerid.existing",{ code , name:existing_member.name }))
        } else if(existing_member.maker_id==code) {
            ts.userError(ts.message("makerid.already",{ code }))
        }
      }


      await ts.db.Members
        .query()
        .patch({maker_id:code})
        .where({discord_id:message.author.id})
      
      
      await message.channel.send(player.user_reply+ts.message("makerid.success",{ code }))
    }
}
module.exports = MakerId;