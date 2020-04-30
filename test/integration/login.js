describe('registration', function () {
  before(async () => {
    await ts.setupData({
      Members: [{
        name: 'Mod',
        discord_id: '128',
      }, {
        name: 'Creator',
        discord_id: '256',
      }, {
        name: 'Banned',
        discord_id: '-1',
        is_banned:1,
      }],
      Levels: [{
        level_name: 'EZ GG',
        creator: 'Creator',
        code: 'XXX-XXX-XXX',
        status: 1,
        difficulty: 1,
      }],
    });
  });

  it('!points not registered', async function () {
    result = await mockBotSend({
      cmd: '!points',
      channel: 'general',
      discord_id: '512',
    })
    assert.deepEqual(result,await ts.mockMessage('error.notRegistered',{type:'userError'},{name:'Creator'}))
  })
  it('!points for banned', async function () {
    result = await mockBotSend({
      cmd: '!points',
      channel: 'general',
      discord_id: '-1',
    })
    assert.deepEqual(result,await ts.mockMessage('error.userBanned',{type:'userError'}))
  })
  it('!register already', async function () {
    result = await mockBotSend({
      cmd: '!register',
      channel: 'general',
      discord_id: '256',
    })
    assert.deepEqual(result,await ts.mockMessage('register.already',{type:'userError'},{name:'Creator'}),)
  })
  it('try registering as someone else', async function () {
    result = await mockBotSend({
      cmd: '!register Mod',
      channel: 'general',
      discord_id: '512',
    })
    assert.deepEqual(result,await ts.mockMessage('register.nameTaken',{type:'userError'},{name:'Mod'}))
  })
  it('succesful registration without argument', async function () {
    result = await mockBotSend({
      cmd: '!register',
      channel: 'general',
      discord_id: '512',
    })
    const dbResult=await ts.db.Members.query().where({discord_id:'512'})
    assert.lengthOf(dbResult,1,"Should only have one item")
    assert.equal(dbResult[0].name,client.user.username,'name is stored')
    assert.deepEqual(result,await ts.mockMessage('register.success',{},{name:await client.user.username}),'message is correct')
  })
  it('succesful registration with supplied nickname', async function () {
    result = await mockBotSend({
      cmd: '!register my_name',
      channel: 'general',
      discord_id: '1024',
    })
    const dbResult=await ts.db.Members.query().where({discord_id:'1024'})
    assert.lengthOf(dbResult,1,"Should only have one item")
    assert.equal(dbResult[0].name,'my_name','name is stored')
    assert.deepEqual(result,await ts.mockMessage('register.success',{},{name:'my_name'}))
  })
  let otp;
  let discord_id;
  it('!login, check OTP', async function () {
    discord_id='1024';
    result = await mockBotSend({
      cmd: '!login',
      channel: 'general',
      discord_id: '1024',
    })
    const dbResult=await ts.db.Tokens.query().where({discord_id})
    assert.lengthOf(dbResult,1,"Should only have one item")
    assert.equal(dbResult[0].authenticated,0,"shouldn't be logged in yet")
    assert.lengthOf(dbResult[0].token,16,'check length of token')
    otp=dbResult[0].token
    assert.deepEqual(result,await ts.mockMessage('login.reply',{discord_id,type:'registeredSuccess'},{login_link:ts.generateLoginLink(otp)}))
  })

  /*
app.post('/json/login', web_ts(async (ts,req) => {
      let returnObj={}
      if(!req.body.otp)
        ts.userError(ts.message("login.noOTP"));

      let token=await ts.db.Tokens.query()
        .where('token','=',req.body.otp)

      if(token.length){
        token=token[0]
        let tokenExpireAt=moment(token.created_at).add(30,'m').valueOf()
        let now=moment().valueOf()
        if(tokenExpireAt<now)
          ts.userError(ts.message("login.expiredOTP"))
        let user=await ts.get_user(token.discord_id);
        let bearer=await ts.login(token.discord_id,token.id)
        returnObj={status:"logged_in",type:"bearer","discord_id":user.discord_id,"token":bearer,"user_info":user}
      } else {
        ts.userError(ts.message("login.invalidToken"))
      }

      return returnObj
  }));
  */
  it('POST /json/login no data', async function () {
    const { body }=await request(app)
      .post('/json/login')
      .expect('Content-Type', /json/)
      .expect(200);
    const dbResult=await ts.db.Tokens.query().where({discord_id})
    assert.lengthOf(dbResult,1,"Should only have one item")
    assert.equal(dbResult[0].authenticated,0,"shouldn't be logged in yet")
    assert.lengthOf(dbResult[0].token,16,'check length of token')
    otp=dbResult[0].token
    assert.deepEqual(body,{"status":"error","message":TS.message('api.noslug')},'Error with no slug')
  })

  it('POST /json/login errors', async function () {
    await request(app)
      .post('/json/login')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({"status":"error","message":TS.message('api.noslug')});

    await request(app)
      .post('/json/login')
      .send({ url_slug:'wrong_slug' })
      .expect('Content-Type', /json/)
      .expect(404)
      .expect({"status":"error","message":TS.message('api.slugNotFound')});

    await request(app)
      .post('/json/login')
      .send({ url_slug:ts.url_slug, otp })
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({"status":"error","message":TS.message('api.noslug')});
    })

    let token;
    it('POST /json/login succesful', async function (){
      const discordDm=acceptReply()
      const user=await ts.get_user(discord_id)
      const { body } = await request(app)
        .post('/json/login')
        .send({ url_slug:ts.url_slug, otp })
        .expect('Content-Type', /json/)
        .expect(200)
      token=await ts.db.Tokens.query().where({ discord_id })
      assert.lengthOf(token,1,'only has one record')
      token=token[0].token
      assert.deepEqual(body,{
        status:"logged_in",
        type:"bearer",
        "discord_id":user.discord_id,
        token,
        "user_info":user
      },"returned login details")
    })

    it('POST /json logged in', async function (){
      const user=await ts.get_user(discord_id)
      const { body } = await request(app)
        .post('/json')
        .send({ url_slug:ts.url_slug, token })
        .expect('Content-Type', /json/)
        .expect(200)
      assert.deepEqual(body,{
        status:"logged_in",
        type:"bearer",
        discord_id,
        token,
      },"returned login details")
    })
})
