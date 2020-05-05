const TSCommand = require('../TSCommand.js');
const config = require('../config.json')[process.env.NODE_ENV || 'development']
class ResetLevelStatus extends TSCommand {
  constructor() {
  super('resetstatus', {
    aliases: ['resetstatus'],
    args: [{
      id: 'code',
      type: 'uppercase',
      default: null,
    }],
  });
  }

  async canRun(ts,message){
    return ts.modOnly(message.author.id)
  }

  async tsexec(ts,message, { code }) {
    if(!code) ts.userError(ts.message('error.noCode'))

    const level=await ts.getExistingLevel(code,true)
    if(!level.status===ts.LEVEL_STATUS.PENDING) ts.userError(ts.message('resetStatus.alreadyPending'))
    await ts.db.Levels.query().patch({status:ts.LEVEL_STATUS.PENDING}).where({code})
    await message.reply(ts.message('resetStatus.succesful',level))
  }
}

module.exports = ResetLevelStatus;