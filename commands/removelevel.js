const TSCommand = require('../TSCommand.js');

class tsremove extends TSCommand {
    constructor() {
        super('tsremove', {
           aliases: ['tsremove','tsremovelevel','remove','removelevel'],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,{command}) {
      var code=command.arguments.shift();
      if(!code) ts.userError(ts.message('error.noCode'))
      code=code.toUpperCase()
      const reason=command.arguments.join(" ")

      if(!reason) ts.userError(ts.userError(ts.message('removeLevel.noReason')));

      const player=await ts.get_user(message);
      var level=await ts.getExistingLevel(code,true)

      if(ts.REMOVED_LEVELS.includes(level.status)) ts.userError(ts.message('removeLevel.alreadyRemoved',level));

      //only creator and shellder can reupload a level
      if(!(level.creator==player.name || player.is_mod)) ts.userError(ts.message('removeLevel.cant',level));

      //tsremove run by shellders and not their own levels get REMOVED
      const newStatus= level.creator!=player.name && player.is_mod ? ts.LEVEL_STATUS.REMOVED : ts.LEVEL_STATUS.USER_REMOVED; 
      
      await ts.db.Levels.query().patch({status:newStatus,old_status:level.status}).where({code})
      await ts.recalculateAfterUpdate({code})

      await ts.deleteDiscussionChannel(level.code,"!tsremove")
    
      //Send updates to to #shellbot-level-update
      const removeEmbed=ts.levelEmbed(level,ts.embedStyle["remove"],{name:player.name})
      removeEmbed.addField("\u200b","**Reason for removal** :```"+reason+"```-<@" +player.discord_id + ">");
      if(level.creator!=player.name){ //moderation
        const creator=await ts.db.Members.query().where({name:level.creator}).first()
        const mention = "**<@" + creator.discord_id + ">, we got some news for you: **";
        await this.client.channels.get(ts.channels.levelChangeNotification).send(mention);
      }
      await this.client.channels.get(ts.channels.levelChangeNotification).send(removeEmbed);

      if(!message.channel.deleted){
        const reply=ts.message('removeLevel.success',level)
        await message.channel.send(player.user_reply+reply)
      }
    }
}
module.exports = tsremove;