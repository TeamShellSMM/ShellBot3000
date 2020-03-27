const { Command } = require('discord-akairo');
const config = require('../config.json');
class login extends Command {
    constructor() {
        super('login', {
           aliases: ['login'],
           cooldown: 5000
        });
    }

    async exec(message,args) {
        try{
          let command=ts.parse_command(message);
          await gs.loadSheets(["Raw Members","Raw Levels"]);
          const player=await ts.get_user(message);
          let otp=await ts.generateOtp(message.author.id)
          message.author.send(player.user_reply+" You have requested a login token for the website. click the link below to login:\n <"+config.login_url+otp+">\n This token will only be valid for 30 minutes")
        } catch(error){
            message.reply(ts.getUserErrorMsg(error))
        }
    }
}
module.exports = login;