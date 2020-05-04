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
        var reason=command.arguments.join(" ")

        if(!reason)
          ts.userError(ts.userError(ts.message('removeLevel.noReason')))

        const player=await ts.get_user(message);
        var level=await ts.getExistingLevel(code,true)

        if(level.status!= ts.LEVEL_STATUS.PENDING && level.status!=ts.LEVEL_STATUS.APPROVED)
          ts.userError(ts.message('removeLevel.alreadyRemoved',level));

        //only creator and shellder can reupload a level
        if(!(level.creator==player.name || player.is_mod))
          ts.userError(ts.message('removeLevel.cant',level))

        //tsremove run by shellders and not their own levels get -2
        const approvedStr=level.status= ts.LEVEL_STATUS.APPROVED? ts.LEVEL_STATUS.REUPLOADED: (
          level.creator!=player.name && player.is_mod? ts.LEVEL_STATUS.REMOVED : ts.LEVEL_STATUS.REJECTED); 
        
        await ts.db.Levels.query().patch({status:approvedStr})
          .where({code})

        await ts.recalculateAfterUpdate({code})


        var removeEmbed=ts.levelEmbed(level,1)
            .setColor("#dc3545")
            .setAuthor("This level has been removed by "+player.name);

        if(ts.emotes.buzzyS){
          removeEmbed.setThumbnail(ts.getEmoteUrl(ts.emotes.buzzyS));
        }

        removeEmbed.addField("\u200b","**Reason for removal** :```"+reason+"```-<@" +player.discord_id + ">");
        removeEmbed = removeEmbed.setTimestamp();
        //Send updates to to #shellbot-level-update

        if(level.creator!=player.name){ //moderation
          const creator=await ts.db.Members.query().where({name:level.creator}).first()
          var mention = "**<@" + creator.discord_id + ">, we got some news for you: **";
          await this.client.channels.get(ts.channels.levelChangeNotification).send(mention);
        }

        await ts.deleteDiscussionChannel(level.code,"Level has been removed via !tsremove")

        var reply=ts.message('removeLevel.success',level)
        await this.client.channels.get(ts.channels.levelChangeNotification).send(removeEmbed);
        await message.channel.send(player.user_reply+reply)
    }
}
module.exports = tsremove;