'use strict';
const chai = require('chai');
const { AkairoClient } = require('discord-akairo');
const WebApi=require('../WebApi');

global.assert = chai.assert;
global.request = require('supertest');
global.config = require('../config.json');
global.config.defaultCooldown=0;
global.TS=require('../TS.js')
let DiscordLog=require('../DiscordLog');
DiscordLog.log=(obj,client)=>{
  console.log(obj)
}
DiscordLog.error=(obj,client)=>{
  console.log(obj)
}

const testTables=["Members","Levels","Plays","PendingVotes","Tokens"]


//initialize test
before(async () => {  
  
  
  global.client=new AkairoClient(config, {
    disableEveryone: true
  });
   
  await client.login(config.discord_access_token);
  global.app = await WebApi(config,client);
  global.ts=await TS.add(config.testConfig.guild_id,config.testConfig,client)


  global.ts.clearDb=async()=>{
    for(let i=0;i<testTables.length;i++){
      await ts.db[testTables[i]].query().select().del()
    }
  }

  global.ts.mockMessage=async (template,{ type , discord_id },args)=>{
    let msg=ts.message(template,args);
    if(type=='userError') return msg+ts.message('error.afterUserDiscord');
    if(type=='registeredSuccess'){
      let user=await ts.get_user(discord_id);
      return user.user_reply+msg;
    }
    return msg;
  }
  

  global.ts.sleep=(ms)=>{
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  global.ts.setupData=async(data)=>{
    await ts.clearDb() 
    for(let i in data){
      for(let j=0;j<data[i].length;j++){
        await ts.db[i].query().insert(data[i][j])
      }
    }
    ts.recalculateAfterUpdate()
  }

  global.message=await client.channels.get(config.initTestChannel).send('ShellBotted');
  await global.message.delete()
  return false
})

global.acceptReply=()=>{
  let guild=ts.getGuild()
  let cache=[]
  function collect_reply(args){
    cache.push(args)
  }
  ts.sendDM=(discord_id,msg)=>{
    collect_reply(msg)
  }
  message.author.send=collect_reply
  guild.channels.forEach((c)=>{
    c.send=collect_reply
    c.reply=collect_reply
  })
  return ()=>{
    if(cache.length==1) cache=cache[0]
    return cache;
  }
}

global.expectReply=()=>{
  return new Promise(function(_fulfill,reject){
    let clearId;
    const result=acceptReply()
    function fulfill(){
      clearTimeout(clearId);
      ts.promisedCallback=null
      _fulfill(result());
    }
    clearId=setTimeout(fulfill,2000)
    ts.promisedCallback=fulfill
    ts.promisedReject=reject
  })
}

global.mockBotSend=async ({ cmd , channel, discord_id })=>{
  let guild=ts.getGuild()
  message.author.id=discord_id;
  message.content = cmd;
  channel=channel || global.ts.channels.modChannel
  if(/[^0-9]/.test(channel)){
    message.channel=await guild.channels.find(c => c.name === channel.toLowerCase())
  } else {
    message.channel=await guild.channels.get(channel)
  }

  const ret=global.expectReply()
  client.emit("message",message)
  return await ret;
}

after(async()=>{
  await client.destroy();
  await ts.knex.destroy();
})


describe('main',function(){
  it('Client,Web server,ts,message loaded',async function(){
    assert.isOk(client,'client is okay')
    assert.isOk(app,'Web Server active')
    assert.isOk(ts,'ts is loaded')
    assert.isOk(message,'send the message');
  });
})