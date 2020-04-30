'use strict'
const config = require('./config.json');
const argv = require('yargs').argv
const { AkairoClient } = require('discord-akairo');
const TS=require('./TS.js')
const DiscordLog = require('./DiscordLog');
const WebApi=require('./WebApi');
if(argv.test) config.defaultCooldown=0;


const client = new AkairoClient(config, {
    disableEveryone: true
}); 

client.on("guildCreate", async guild => {
  DiscordLog.log(`Joined a new guild: ${guild.name}`,client);
});



client.on("ready", async () => {
  await DiscordLog.log(`${config.botName} has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`,client);
  let Teams = require('./models/Teams')();
  let teams = await Teams.query().select()
  if(!teams) throw `No teams configurations buzzyS`;

  for(let team of teams){
      let guild=await client.guilds.find((guild)=> guild.id==team.guild_id)
      if(
        !argv.test
        || argv.test
        && (
          !  config.AutomatedTest
          || config.AutomatedTest == guild.id
      )){
      if(team==null){

      } else {
        await TS.add(guild.id,team,client)
      }
    }
  }
});

(async () => { //main thread
  let app;
  try {
    await client.login(config.discord_access_token);
    app = await WebApi(config,client);
    await app.listen(config.webPort, () => DiscordLog.log(config.botName+':WebApi now listening on '+config.webPort,client));
 } catch(error) {
   DiscordLog.error(error.stack,client)
 }
})();