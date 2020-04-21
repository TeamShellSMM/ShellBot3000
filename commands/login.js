const TSCommand = require('../TSCommand.js');
const config = require('../config.json');
class login extends TSCommand {
    constructor() {
        super('login', {
           aliases: ['login','tslogin'],
           cooldown: 5000,
           channelRestriction: 'guild'
        });
        this.defaultMessage({
          "login.reply":" You have requested a login token for the website. click the link below to login.:\n <{{login_link}}> {{bam}}\n If you're on mobile, copy the link and paste it into your preferred browser app. If you open this link in an in-app browser, your login might not be saved properly. {{{buzzyS}}}\n This token will only be valid for 30 minutes"
        })
    }

    async tsexec(ts,message,args) {
      await ts.gs.loadSheets(["Raw Members","Raw Levels"]);
      const player=await ts.get_user(message);
      let otp=await ts.generateOtp(message.author.id)
      let login_link=config.page_url + ts.config.url_slug + "/login/"+otp;
      message.author.send(player.user_reply+ts.message("login.reply",{login_link:login_link}))
    }
}
module.exports = login;