const TSCommand = require('../TSCommand.js');

class login extends TSCommand {
  constructor() {
    super('login', {
      aliases: ['login', 'tslogin'],
      cooldown: 5000,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    const player = await ts.getUser(message);
    const otp = await ts.generateOtp(message.author.id);
    const loginLink = ts.generateLoginLink(otp);
    await message.author.send(
      player.user_reply +
        ts.message('login.reply', { loginLink: loginLink }),
    );
  }
}
module.exports = login;
