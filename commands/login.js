const TSCommand = require('../TSCommand.js');
const config = require('../config.json');
class login extends TSCommand {
    constructor() {
        super('login', {
           aliases: ['login','tslogin'],
           cooldown: 5000,
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,args) {
      const player=await ts.get_user(message);
      let otp=await ts.generateOtp(message.author.id)
      let login_link=config.page_url + ts.config.url_slug + "/login/"+otp;
      message.author.send(player.user_reply+ts.message("login.reply",{login_link:login_link}))
    }
}
module.exports = login;