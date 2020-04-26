const TSCommand = require('../TSCommand.js');
const config = require('../config.json');
class AmmendCode extends TSCommand {
  constructor() {
  super('ammendcode', {
    aliases: ['ammendcode'],
    args: [{
      id: 'old_code',
      type: 'string',
      default: ''
    },{
      id: 'new_code',
      type: 'string',
      default: ''
    }],
  });
  }

  async canRun(ts,message){
    if(config.ownerID && config.ownerID.indexOf(message.author.id)!==-1){
      return true;
    }
    if(config.devs && config.devs.indexOf(message.author.id)!==-1){
      return true;
    }
    if(await ts.db.Members.query()
    .where({discord_id:message.author.id})
    .where({is_mod:1})
    .first()){
        return true
    }
    
    return false;
  }

  async tsexec(ts,message, { old_code, new_code }) {
  old_code=old_code.toUpperCase()
  new_code=new_code.toUpperCase()

  if(!ts.valid_code(old_code)){
    ts.userError(ts.message("reupload.invalidOldCode"))
  }
  if(!ts.valid_code(new_code)){
    ts.userError(ts.message("reupload.invalidNewCode"))
  }
  if(old_code==new_code){
    ts.userError(ts.message('reupload.sameCode'))
  }

  await ts.gs.loadSheets(["Competition Winners"]);

  const existing_level=await ts.getExistingLevel(old_code,true)
  const new_code_check=await ts.db.Levels.query().where({code:new_code}).first();
  if(new_code_check){
    ts.userError(ts.message('add.levelExisting',{ level: new_code_check}))
  }
  
  await ts.db.Levels.query()
    .patch({code:new_code})
    .where({code:old_code});
  
  await ts.db.Plays.query()
    .patch({code:new_code})
    .where({code:old_code});
  await ts.db.PendingVotes.query()
    .patch({code:new_code})
    .where({code,old_code});

  let updates=[]
  let winners=ts.gs.query("Competition Winners", {
    filter: {Code:old_code},
    update: {Code:new_code}
  },true);

  if(winners){
    winners=winners.map((level)=>{
    return level.update_ranges[0]
    })
    updates=updates.concat(winners)
  }

  if(updates){
    await ts.gs.batchUpdate(updates);
    await ts.load()
  }
  

  let guild=ts.getGuild();
  let existingChannel=guild.channels.find(channel => channel.name === old_code.toLowerCase() && channel.parent.id == ts.channels.levelDiscussionCategory)
  if(existingChannel){
    await existingChannel.setName(new_code.toLowerCase())
  }
  
  return message.reply(ts.message('ammendCode.success',{ level:existing_level, old_code,new_code}));
  }
}

module.exports = AmmendCode;