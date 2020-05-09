const TSCommand = require('../TSCommand.js');
/* istanbul ignore next */
const config = require('../config.json')[process.env.NODE_ENV || 'development']
class AmmendCode extends TSCommand {
  constructor() {
  super('ammendcode', {
    aliases: ['ammendcode'],
    args: [{
      id: 'old_code',
      type: 'uppercase',
      default: null
    },{
      id: 'new_code',
      type: 'uppercase',
      default: null
    }],
  });
  }

  async canRun(ts,message){
    return ts.modOnly(message.author.id)
  }

  async tsexec(ts,message, { old_code, new_code }) {

  if(!old_code) ts.userError(ts.message("reupload.noOldCode"));
  if(!new_code) ts.userError(ts.message("reupload.noNewCode"));

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
  const new_code_check=await ts.getLevels().where({code:new_code}).first();
  if(new_code_check){
    ts.userError(ts.message('add.levelExisting',{ level: new_code_check}))
  }
  
  await ts.db.Levels.query().patch({code:new_code})
    .where({code:old_code});


  //For now not testing GS stuff as we're deprecating it soon
  /* istanbul ignore if */
  if(process.env.NODE_ENV!=='test'){
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
      await ts.gs.loadSheets(["Competition Winners"]);
    }
  } 
  

  let guild=ts.getGuild();
  let existingChannel=guild.channels.find(channel => channel.name === old_code.toLowerCase() && channel.parentID == ts.channels.levelDiscussionCategory)
  if(existingChannel){
    await existingChannel.setName(new_code.toLowerCase())
  }
  
  return await message.reply(ts.message('ammendCode.success',{ level:existing_level, old_code,new_code}));
  }
}

module.exports = AmmendCode;