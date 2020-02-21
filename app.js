const async = require('async');
const util = require('util');
const config = require('./config.json');
const GS=require('./GS.js')
let gs=new GS(config);
 
// spreadsheet key is the long id in the sheets URL
const Discord = require('discord.js');
const client = new Discord.Client();



client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});



client.on('message', async msg => {
  if(msg.author.bot) return; //maybe can reply to shellbot 2000
  msg.content=msg.content.trim()
  if(msg.guild.id!=config.teamshell_discord_id) return false //not in teamshell discord
  if(msg.channel.id === config.botTest1){
    console.log("in bot-test")
    if (msg.content === '!pending_initiate') {
      await gs.loadSheets(["Raw Members"]); //when everything goes through shellbot 3000 we can do cache invalidation stuff
      const shellcults=get_cult_members()
      const current_shellcult=msg.guild.roles.get(config.shellcult_id).members.map(m=>m.user.id)
      let loaded_guild=await msg.guild.fetchMembers()
      let missing_shellcults=shellcults.filter(v=> -1 === current_shellcult.indexOf(v))
      missing_shellcults=missing_shellcults.filter(v=> loaded_guild.members.has(v))
      let at_str=""
      for(let i=0;i<missing_shellcults.length;i++){
        at_str+="<@"+missing_shellcults[i]+">\n"
      }
      client.channels.get(config.botTest1).send("Currently have not recieved shellcult role in discord: "+(at_str?at_str:"Noone"))
    }
    const command=process_msg(msg.content)
    console.log(msg)
    if(command){

    } 
  } else if(msg.channel.id === config.shellderShellbot) {
    if (msg.content === '!pending_initiate') {
      await gs.loadSheets(["Raw Members"]); //when everything goes through shellbot 3000 we can do cache invalidation stuff
      const shellcults=get_cult_members()
      const current_shellcult=msg.guild.roles.get(config.shellcult_id).members.map(m=>m.user.id)
      
      let loaded_guild=await msg.guild.fetchMembers()
      let missing_shellcults=shellcults.filter(v=> -1 === current_shellcult.indexOf(v))
      missing_shellcults=missing_shellcults.filter(v=> loaded_guild.members.has(v))

      let at_str=""
      for(let i=0;i<missing_shellcults.length;i++){
        at_str+="<@"+missing_shellcults[i]+">\n"
      }
      client.channels.get(config.shellderShellbot).send("Currently have not recieved shellcult role in discord: "+(at_str?at_str:"Noone"))
    } else if (msg.content === '!tsinitiate') {
      await gs.loadSheets(["Raw Members"]); //when everything goes through shellbot 3000 we can do cache invalidation stuff
      const shellcults=get_cult_members()
      const current_shellcult=msg.guild.roles.get(config.shellcult_id).members.map(m=>m.user.id)
      
      let loaded_guild=await msg.guild.fetchMembers()
      let missing_shellcults=shellcults.filter(v=> -1 === current_shellcult.indexOf(v))
      missing_shellcults=missing_shellcults.filter(v=> loaded_guild.members.has(v))

      if(missing_shellcults.length>0){
        let at_str=""
        for(let i=0;i<missing_shellcults.length;i++){
          at_str+="<@"+missing_shellcults[i]+">\n"
        }
        client.channels.get(config.initiateChannel).send("<a:ts_2:632758958284734506><a:ts_2:632758958284734506><a:ts_1:632758942992302090>\n<:SpigLove:628057762449850378> **We welcome these initates into the shell cult. **<:PigChamp:628055057690132481>\n\n"+at_str+"\n\n **Let the shells flow free**\n<a:ts_2:632758958284734506><a:ts_2:632758958284734506><a:ts_1:632758942992302090> <:bam:628731347724271647>")
      } else {
        client.channels.get(config.shellderShellbot).send("There is no one that needs initiating")
      }
    }
  }
  return false
});


//teamshell sheets
const static_vars=[
"TeamShell Variable","Points","TeamShell Ranks","Seasons", //static vars
'Raw Members','Raw Levels','Raw Played' //play info
]; //initial vars to be loaded on bot load
const play_infos =['Raw Members','Raw Levels','Raw Played']; //to be loaded on every command? will

(async () => { //main thread
  const response=await gs.loadSheets(static_vars) //loading initial sheets
  client.login(config.token); 
})();

function process_msg(str){
  str=str.trim()
  if(str.charAt(0)!="!") return false
  str=str.split(" ")
  const command=str.shift()
  return {command:command.substring(1),parameters:str}
}

function process_points(){

}


function get_cult_members(){ //return array of discord_ids
  const rows=gs.select("Raw Members")
  let cultmembers=[]
  for(var i=0;i<rows.length;i++){
    if(rows[i] && rows[i].cult_member=="1" && rows[i].discord_id) 
      cultmembers.push(rows[i].discord_id);  
  }
  return cultmembers
}
