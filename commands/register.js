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
      await ts.gs.loadSheets(["Raw Members"]);
      const player=ts.gs.select("Raw Members",{"discord_id":message.author.id});
      if(player && player.banned){
        ts.userError(ts.message("register.barred"))
      }
      if(player){
        ts.userError(ts.message("register.already",{ player }))
      }

      let command=ts.parse_command(message);
      let nickname=message.author.username;
      if(command.arguments.length > 0){
        nickname=command.arguments.join(" ");
      }

      nickname=nickname.replace(/\\/g,'');
      ts.gs.select("Raw Members",{},true).forEach((member)=>{
          if(member && nickname.toLowerCase()==member.Name.toLowerCase()){
            ts.userError(ts.message("register.nameTaken",{ name:nickname }))
          }
        })

      var row={
        "Name":nickname,
        "discord_id":message.author.id,
        "discord_name":message.author.username,
      }

        await ts.gs.insert("Raw Members",row);
        message.reply(ts.message("register.succesful",{ name:nickname }))
    }
}
module.exports = TSRegister;