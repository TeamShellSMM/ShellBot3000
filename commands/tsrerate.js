const TSCommand = require('../TSCommand.js');
class TSRerate extends TSCommand {
    constructor() {
        super('tsrerate', {
           aliases: ['tsrerate', 'rerate'],
           split: 'quoted',
            args: [{
              id: 'code',
              type: 'string',
              default: ''
            },
            {
              id: 'difficulty',
              type: 'string',
              default: ''
            },
            {
              id: 'reason',
              type: 'string',
              default: ''
            }],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,{ code , difficulty, reason }) {
      if(!(
        message.channel.id === ts.channels.modChannel  //only in bot-test channel
      )) return false;

      if(code){
        code = code.toUpperCase();
      } else {
        ts.userError(ts.message('error.noCode'))
      }

      //Check all the args first
      if(!ts.valid_difficulty(difficulty)) ts.userError("Invalid difficulty format!");
      if(!reason) ts.userError(ts.message('difficulty.noReason'));

      const level=await ts.getExistingLevel(code);
      if(level.status!== ts.LEVEL_STATUS.APPROVED) ts.userError(ts.message('error.notApproved'));

      
      
      const author = await ts.db.Members.query().where({name:level.creator}).first();

      if(level.difficulty==difficulty) ts.userError("\""+level.level_name+"\" is already rated "+difficulty);

      await ts.db.Levels.query()
        .patch({difficulty})
        .where({code})

      await ts.recalculateAfterUpdate({code})
        

      var rerateEmbed = ts.levelEmbed(level)
            .setColor("#17a2b8")
            .setAuthor(ts.message('difficulty.updated',{ 
              old_difficulty:level.difficulty,
              new_difficulty:difficulty,
            }))
            .addField("\u200b","**Reason** :\n```"+reason+"```Rerated by <@" +message.member.id + ">")

      var levelChangeChannel=await this.client.channels.get(ts.channels.levelChangeNotification)

      if(author){ //edge case of no discord_id
        var mention = "**<@" + author.discord_id + ">, we got some news for you: **";
        await levelChangeChannel.send(mention);
      }
      await levelChangeChannel.send(rerateEmbed);
      await message.reply(ts.message('difficulty.success'));
  }
}
module.exports = TSRerate;