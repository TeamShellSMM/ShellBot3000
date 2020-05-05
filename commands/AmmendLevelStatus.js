const TSCommand = require('../TSCommand.js');
const config = require('../config.json')[process.env.NODE_ENV || 'development']
class AmmendLevelStatus extends TSCommand {
  constructor() {
  super('ammendstatus', {
    aliases: ['ammendstatus'],
    args: [{
      id: 'code',
      type: 'uppercase',
      default: null,
    },{
      id: 'status',
      type: 'integer',
      default: null,
    }],
  });
  }

  async canRun(ts,message){
    return ts.modOnly(message.author.id)
  }

  async tsexec(ts,message, { code,status }) {
  
    return "stub";
  }
}

module.exports = AmmendLevelStatus;