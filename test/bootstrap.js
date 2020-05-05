'use strict';
const chai = require('chai');
const { AkairoClient } = require('discord-akairo');
const WebApi=require('../WebApi');

global.assert = chai.assert;
global.knex= require('../db/knex');
global.request = require('supertest');
global.config = require('../config.json')['testing']; //force testing config
global.config.defaultCooldown=0;
global.TS=require('../TS.js')
let DiscordLog=require('../DiscordLog');
DiscordLog.log=(obj,client)=>{console.log(obj)}
DiscordLog.error=(obj,client)=>{console.log(obj)}


after(async()=>{
  await client.destroy();
  await ts.knex.destroy();
})

describe('Setup test and check teams registration',function(){

  it('Creating discord connection and sending a message',async function(){
    this.slow(10000);
    global.client=new AkairoClient(config, {
      disableEveryone: true
    });
    await client.login(config.discord_access_token);
    assert.isOk(client,'client is okay')
    global.message=await client.channels.get(config.initTestChannel).send('ShellBotted');
    await global.message.delete()
    assert.isOk(message,'message is sent');
  });

  it('Creating team info and TS',async function(){
    this.slow(10000);
    await knex.raw(`
      SET FOREIGN_KEY_CHECKS = 0; 
      TRUNCATE table teams;
      SET FOREIGN_KEY_CHECKS = 1;
    `);
    global.ts=await TS.create(config.testConfig,client)

    let [teams,fields]=await knex.raw(`SELECT * FROM teams;`);
    assert.lengthOf(teams,1,'Should have created teams');

    assert.isOk(ts,'ts is created')
  });

  it('Creating web api',async function(){
    global.app = await WebApi(config,client);
    assert.isOk(app,'App is created')
  });


  it('Setting up test functions',async function(){
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

    global.ts.clearTable=async(table)=>{
      await knex.raw(`
        SET FOREIGN_KEY_CHECKS = 0; 
        TRUNCATE table ??;
        SET FOREIGN_KEY_CHECKS = 1;
      `,[table]);
    }
  
    const all_tables=['plays','pending_votes','levels','members','tokens'];
    global.ts.clearDb=async()=>{
      for(let table of all_tables){
        await ts.clearTable(table)
      }
    }

    global.acceptReply=()=>{
      let guild=ts.getGuild();
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
    
  });
})