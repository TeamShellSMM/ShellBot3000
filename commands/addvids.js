const TSCommand = require('../TSCommand.js');
const validUrl = require('valid-url');
class TSAddvids extends TSCommand {
    constructor() {
        super('tsaddvids', {
           aliases: [
            'tsaddvids','addvids','tsaddvid','addvid',
            'tsremovevids','removevids','tsrmemovevid','removevid',
           ],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,args) {
        const addCommands=['tsaddvids','addvids','tsaddvid','addvid']

        let command=ts.parse_command(message);
        let code=command.arguments.shift()
        if(code)
          code=code.toUpperCase()

        if(!ts.valid_code(code))
          ts.userError("You did not provide a valid level code")

        let new_vids=command.arguments.join(" ")
        if(!new_vids)
          ts.userError("You didn't give any links")
        new_vids=new_vids.split(/[, \n]/)
        let filteredUrl=[]
        let not_urls=[]
        new_vids.forEach((url)=>{
          if(url){
            if(validUrl.isWebUri(url)){
              filteredUrl.push(url)
            } else {
              not_urls.push(url)
            }
          }
        })
        if(not_urls.length){
          ts.userError("The links below didn't look like urls: ```\n"+not_urls.join("\n")+"```")
        }

        const player=await ts.get_user(message);
        var level=await ts.getExistingLevel(code)

        let old_vids=level.videos?level.videos.split(","):[]


        if(addCommands.indexOf(command.command)!=-1){ //adding
          new_vids=[]
          filteredUrl.forEach((url)=>{
            if(old_vids.indexOf(url)==-1){
              new_vids.push(url)
            }
          })
          if(new_vids.length==0)
            ts.userError("No new clear video added for \""+level.level_name+"\" by "+level.creator+"\nCurrent Videos:```\n"+old_vids.join("\n")+"```")
          old_vids=old_vids.concat(new_vids)
          var reply="Clear videos added for  \""+level.level_name+"\" ("+code+")"+(ts.emotes.bam ? ts.emotes.bam : "")+"\nCurrent Videos:```\n"+old_vids.join("\n")+"```"
        } else { // removing
          if(!(level.creator==player.name || player.is_mod=='1'))
            ts.userError("You can't remove videos from  \""+level.level_name+"\" by "+level.creator);

          new_vids=[]
          let notRemoved=true
          old_vids.forEach((url)=>{
            if(filteredUrl.indexOf(url)==-1){
              new_vids.push(url)
            } else {
              notRemoved=false
            }
          })
          if(notRemoved)
            ts.userError("No clear videos have been removed for \""+level.level_name+"\" ("+code+")\nCurrent Videos:```\n"+old_vids.join("\n")+"```")
          old_vids=new_vids
          var reply="Clear videos removed for  \""+level.level_name+"\" ("+code+")"+(ts.emotes.bam ? ts.emotes.bam : "")+"\nCurrent Videos:```\n"+old_vids.join("\n")+"```"
        }


  
      await ts.db.Levels.query()
        .patch({videos:old_vids.join(',')})
        .where({code})

      await message.channel.send(player.user_reply+reply)
    }
}
module.exports = TSAddvids;