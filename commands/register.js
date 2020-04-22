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
      await ts.gs.loadSheets(['Raw Members']);
      const player=ts.gs.selectOne('Raw Members',{'discord_id':message.author.id});
      if(player && player.banned){
        ts.userError(ts.message('register.barred'))
      }
      if(player){
        ts.userError(ts.message('register.already',{ player }))
      }

      let command=ts.parse_command(message);
      let nickname=message.author.username;
      if(command.arguments.length > 0){
        nickname=command.arguments.join(' ');
      }

      nickname=nickname.replace(/\\/g,'');
      ts.gs.select('Raw Members').forEach((member)=>{
          if(member && nickname.toLowerCase()==member.Name.toLowerCase()){
            ts.userError(ts.message('register.nameTaken',{ name:nickname }))
          }
        })
        await ts.gs.insert('Raw Members',{
          'Name':nickname,
          'discord_id':"'"+message.author.id, //insert as string
          'discord_name':"'"+message.author.username,
        });
        message.reply(ts.message('register.succesful',{ name:nickname }))
    }
}
module.exports = TSRegister;