const TSCommand = require('../TSCommand.js');
class TSAddtags extends TSCommand {
    constructor() {
        super('tsaddtags', {
           aliases: [
            'tsaddtags','addtags','tsaddtag','addtag',
            'tsremovetags','removetags','tsrmemovetag','removetag',
           ],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,args) {
        const addCommands=['tsaddtags','addtags','tsaddtag','addtag']

        let command=ts.parse_command(message);
        let code=command.arguments.shift()
        if(code)
          code=code.toUpperCase()

        if(!ts.valid_code(code))
          ts.userError(ts.message("error.invalidCode"))

        let new_tags=command.arguments.join(" ")
        if(!new_tags)
          ts.userError(ts.message("tags.noTags"))
        new_tags=new_tags.split(/[,\n]/)

        const player=await ts.get_user(message);
        var level=await ts.getExistingLevel(code)
        //First we get all available tags
        var all_tags = [];
        let _levels=await ts.db.Levels.query().select()
        
        _levels.forEach((level)=>{
          if(level.tags){
            level.tags.split(",").forEach((tag)=>{
              if(all_tags.indexOf(tag)===-1)
                  all_tags.push(tag);
            })
          }
        });

        //Then we trim the new tags, check if they exist in all tags (lower cased, without spaces inbetween) and if they do we use that writing style instead
      for(var i = 0; i < new_tags.length; i++){
        new_tags[i] = new_tags[i].trim();
        all_tags.forEach((existing_tag)=>{
          if(new_tags[i].toLowerCase().replace(/[^a-z0-9]/g, "") == existing_tag.toLowerCase().replace(/[^a-z0-9]/g, "")){ //replacing space with all non alphanumeric characters
            new_tags[i] = existing_tag;
          }
        })
      }
        let filteredTags=new_tags
        let old_tags=level.tags?level.tags.split(","):[]


        if(addCommands.indexOf(command.command)!=-1){ //adding
          let locked_tags=[]
          ts.gs.select("tags").forEach((tag)=>{
            if(tag && tag.add_lock){
              locked_tags.push(tag.Tag)
            }
          })

          new_tags=[]
          filteredTags.forEach((tag)=>{
            if(locked_tags.indexOf(tag)!=-1 && ts.is_mod(player))
              ts.userError(ts.message("tags.cantAdd",{tag}))
            if(old_tags.indexOf(tag)==-1){
              new_tags.push(tag)
            }
          })
          if(new_tags.length==0)
            ts.userError("No new tags added for \""+level.level_name+"\" by "+level.creator+"\nCurrent tags:```\n"+old_tags.join("\n")+"```")
          old_tags=old_tags.concat(new_tags)
          var reply="Tags added for  \""+level.level_name+"\" ("+code+")"+ts.emotes.bam+"\nCurrent tags:```\n"+old_tags.join("\n")+"```"
        } else { // removing
          if(!(level.creator==player.name || ts.is_mod(player)))
            ts.userError("You can't remove tags from  \""+level.level_name+"\" by "+level.creator);

          let locked_tags=[]
          ts.gs.select("tags").forEach((tag)=>{
            if(tag && tag.remove_lock){
              locked_tags.push(tag.Tag)
            }
          })


          new_tags=[]
          let notRemoved=true
          old_tags.forEach((tag)=>{
            if(locked_tags.indexOf(tag)!=-1 && !ts.is_mod(player))
              ts.userError("You can't remove the tag \""+tag+"\"")
            if(filteredTags.indexOf(tag)==-1){
              new_tags.push(tag)
            } else {
              notRemoved=false
            }
          })
          if(notRemoved)
            ts.userError("No tags have been removed for \""+level.level_name+"\" ("+code+")\nCurrent Tags:```\n"+old_tags.join("\n")+"```")
          old_tags=new_tags
          var reply="Tags removed for  \""+level.level_name+"\" ("+code+")"+(ts.emotes.bam ? ts.emotes.bam : "")+"\nCurrent tags:```\n"+old_tags.join("\n")+"```"
        }

        await ts.db.Levels.query()
          .patch({tags:old_tags.join(',')})
          .where({code})

        message.channel.send(player.user_reply+reply)
    }
}
module.exports = TSAddtags;