
const GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');
const util = require('util');
const config = require('./config.json');
 
// spreadsheet key is the long id in the sheets URL
const doc = new GoogleSpreadsheet(config.spreadsheetId);
let sheet;
const sheetLogin=util.promisify(doc.useServiceAccountAuth);
const getInfo=util.promisify(doc.getInfo);
const getRows=util.promisify(doc.getRows);



const Discord = require('discord.js');
const client = new Discord.Client();



client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
  if(msg.guild.id!=config.teamshell_discord_id) return false //not in teamshell discord
  if(msg.channel.id === config.botTest1){
    console.log("in bot-test")
  } else if(msg.channel.id === config.shellderShellbot) {
    if (msg.content === '!pending_initiate') {
      const shellcults=await get_cult_members()
      const current_shellcult=msg.guild.roles.get(config.shellcult_id).members.map(m=>m.user.id)
      const missing_shellcults=shellcults.filter(v=> -1 === current_shellcult.indexOf(v))
      let at_str=""
      for(let i=0;i<missing_shellcults.length;i++){
        at_str+="<@"+missing_shellcults[i]+">\n"
      }
      client.channels.get(config.shellderShellbot).send("Currently have not recieved shellcult role in discord: "+(at_str?at_str:"Noone"))
    } else if (msg.content === '!tsinitiate') {
      const shellcults=await get_cult_members()
      const current_shellcult=msg.guild.roles.get(config.shellcult_id).members.map(m=>m.user.id)
      const missing_shellcults=shellcults.filter(v=> -1 === current_shellcult.indexOf(v))
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


(async () => { //main thread
  



  client.login(config.token); 
})();



async function get_sheet_by_name(name){
  if(!doc.isAuthActive()) await sheetLogin(config);
  const info= await getInfo()
  return info.worksheets.find(sheet => sheet.title === name);
}

async function get_rows(sheetName,options){
  const sheet=await get_sheet_by_name("Raw Members")
  const sheetRows=util.promisify(sheet.getRows)
  const rows=await sheetRows()
  return rows
}


async function get_cult_members(){ //return array of discord_ids
  const rows=await get_rows("Raw Members")
  let cultmembers=[]
  for(var i=0;i<rows.length;i++){
    if(rows[i] && rows[i].cultmember=="1" && rows[i].discordid) 
      cultmembers.push(rows[i].discordid);  
  }
  return cultmembers
}
