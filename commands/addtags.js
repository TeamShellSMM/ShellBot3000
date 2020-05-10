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
      /* istanbul ignore next */
      const setTags=ts.gs.select("tags") || [];
      let command=ts.parse_command(message);
      let code=command.arguments.shift()
      if(code){
        code=code.toUpperCase()
      } else {
        ts.userError(ts.message('error.noCode'));
      }

      let new_tags=command.arguments.join(" ")
      if(!new_tags){
        ts.userError(ts.message("tags.noTags"))
      }
      new_tags=new_tags.split(/[,\n]/)

      const player=await ts.get_user(message);
      const level=await ts.getExistingLevel(code)
      //First we get all available tags
      let all_tags = [];
      let _levels=await ts.getLevels()
      _levels.forEach((level)=>{
        if(level.tags){
          level.tags.split(",").forEach((tag)=>{
            if(all_tags.indexOf(tag)===-1)all_tags.push(tag);
          })
        }
      });

    //Then we trim the new tags, check if they exist in all tags (lower cased, without spaces inbetween) and if they do we use that writing style instead
    for(let i = 0; i < new_tags.length; i++){
      new_tags[i] = new_tags[i].trim();
      all_tags.forEach((existing_tag)=>{
        if(new_tags[i].toLowerCase().replace(/[^a-z0-9]/g, "") == existing_tag.toLowerCase().replace(/[^a-z0-9]/g, "")){ //replacing space with all non alphanumeric characters
          new_tags[i] = existing_tag;
        }
      })
    }

    let filteredTags=new_tags
    let old_tags=level.tags?level.tags.split(","):[]
    let reply;

    if(addCommands.indexOf(command.command)!=-1){ //adding
      let locked_tags=[]
      setTags.forEach((tag)=>{
        if(tag && tag.add_lock){
          locked_tags.push(tag.Tag)
        }
      })

      new_tags=[]
      filteredTags.forEach((tag)=>{
        if(locked_tags.includes(tag) && !player.is_mod) ts.userError(ts.message("tags.cantAdd",{tag}));
        if(!old_tags.includes(tag)){
          new_tags.push(tag)
        }
      })
      
      if(new_tags.length===0) ts.userError(ts.message('tags.noNew',level)+ts.message('tags.currentTags',{tags_str:old_tags.join("\n")}));

      old_tags=old_tags.concat(new_tags)
      reply=ts.message('tags.haveNew',level)+ts.message('tags.currentTags',{tags_str:old_tags.join("\n")})

    } else { // removing
      if(!(level.creator==player.name || player.is_mod)) ts.userError(ts.message('tags.noPermission',level));

      let locked_tags=[]
      setTags.forEach((tag)=>{
        if(tag && tag.remove_lock){
          locked_tags.push(tag.Tag)
        }
      })

      new_tags=[]
      filteredTags.forEach((tag)=>{
        if(locked_tags.includes(tag) && !player.is_mod) ts.userError(ts.message('tags.cantRemove',{tag}));
      })

      old_tags.forEach((tag)=>{
        if(!filteredTags.includes(tag)){
          new_tags.push(tag)
        }
      })

      if(old_tags.length===new_tags.length) ts.userError(ts.message('tags.noRemoved',level)+ts.message('tags.currentTags',{tags_str:old_tags.join("\n")}));
      old_tags=new_tags
      reply=ts.message('tags.haveRemoved',level)+ts.message('tags.currentTags',{tags_str:old_tags.join("\n")})
    }

    await ts.db.Levels.query().patch({tags:old_tags.join(',')})
      .where({code})

    await message.channel.send(player.user_reply+reply)
  }
}
module.exports = TSAddtags;