const TSCommand = require('../TSCommand.js');

class login extends TSCommand {
  constructor() {
    super('login', {
      aliases: ['login', 'tslogin'],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    const player = await ts.getUser(message);
    const otp = await ts.generateOtp(ts.discord.getAuthor(message));
    const loginLink = ts.generateLoginLink(otp);
    try {
      await ts.discord.dm(
        ts.discord.getAuthor(message),
        player.userReply +
          ts.message('login.reply', { loginLink: loginLink }),
      );
    } catch (error) {
      // Only log the error if it is not an Unknown Message error
      if (error.code === 50007) {
        ts.userError('login.failedReply');
      }
      throw error;
    }
  }
}
module.exports = login;
