const TSCommand = require('../TSCommand.js');
class TSRegister extends TSCommand {
    constructor() {
        super('tsregister', {
           aliases: ['tsregister','register'],
            args: [{
                    id: 'nickname',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,args) {
      const player=await ts.db.Members.query().where({discord_id:message.author.id}).first();
      if(player && player.is_banned){
        ts.userError(ts.message('error.userBanned'))
      }
      if(player){
        ts.userError(ts.message('register.already',{ ...player }))
      }

      let command=ts.parse_command(message);
      let nickname=message.author.username;
      if(command.arguments.length > 0){
        nickname=command.arguments.join(' ');
      }

      nickname=nickname.replace(/\\/g,'');
      if(await ts.db.Members.query().whereRaw('lower(name) = ?',[ nickname.toLowerCase() ]).first()){
        ts.userError(ts.message('register.nameTaken',{ name:nickname }));
      }

      await ts.db.Members.query().insert({
        name:nickname,
        discord_id:message.author.id, //insert as string
        discord_name:message.author.username,
      })
        
      message.reply(ts.message('register.success',{ name:nickname }))
    }
}
module.exports = TSRegister;