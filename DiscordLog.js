'use strict'
//This will send errors to a configured error channel to alert the devs
const config = require('./config.json')[process.env.NODE_ENV || 'development']
module.exports={
  clientCache:null,
  async log(info,discord_client){
    console.log(info)
    if(!this.clientCache) this.clientCache=discord_client
    if(!discord_client && this.clientCache) discord_client=this.clientCache
    if(discord_client && process.env.NODE_ENV==="production" && config.error_channel ){
      let channel=await discord_client.channels.get(config.error_channel)
      let dev=info.channel?" at "+info.channel:""
      info=JSON.stringify(info,null,2).replace(/\\n/g,"\n")
      await channel.send("```bash\n"+info+"```")
    }
  },
  async error(error,discord_client){
    console.error(error)
    if(!this.clientCache) this.clientCache=discord_client
    if(!discord_client && this.clientCache) discord_client=this.clientCache
    if(discord_client && process.env.NODE_ENV==="production" && config.error_channel){
      let channel=await discord_client.channels.get(config.error_channel)
      let dev="<@"+config.devs.join(">,<@")+"> "+(error.channel?" at "+error.channel:"")
      error=JSON.stringify(error,null,2).replace(/\\n/g,"\n")
      channel.send(dev+"```fix\n"+error+"```")
    }
  },
}