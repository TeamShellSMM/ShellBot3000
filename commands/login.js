const { Command } = require('discord-akairo');
class login extends Command {
    constructor() {
        super('login', {
           aliases: ['login'],
           channelRestriction: 'dm'
        });
    }
    
    async exec(message,args) {
        try{
          var command=ts.parse_command(message);

          await gs.loadSheets(["Raw Members","Raw Levels","Raw Played"]);
          const player=ts.get_user(message);
          var otp=await ts.generateOtp(message.author.id)
          message.channel.send(player.user_reply+" You have requested a login token for the website. copy the code below ```"+otp+"``` This token will only be valid for 30 minutes")
        } catch(error){
            message.reply(ts.getUserErrorMsg(error))
        }
    }
}
module.exports = login;