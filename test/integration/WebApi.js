describe('Web Apis', function () {
  describe('unauthenticated calls', function () {
    beforeEach(async () => {
      await TEST.setupData({
        Members: [
          {
            name: 'Mod',
            discord_id: '128',
          },
          {
            name: 'Creator',
            discord_id: '256',
            maker_id: '111-111-111',
            is_member: 1,
            maker_name: 'SMM2',
            world_description: 'Super Maker World',
            world_world_count: 5,
            world_level_count: 5,
          },
          {
            name: 'Banned',
            discord_id: '-1',
            is_banned: 1,
          },
        ],
        Tokens: [
          {
            discord_id: '128',
            token: '123',
            authenticated: 1,
          },
        ],
      });

      await TEST.setupKnex({
        seasons: [
          {
            guild_id: 1,
            admin_id: 1,
            name: 'Season 1',
          },
        ],
        competition_groups: [
          {
            guild_id: 1,
            name: 'Competition 1',
            competition_tag: 'competition1',
            description: 'Competition One',
            rules: '',
          },
        ],
        competitions: [
          {
            guild_id: 1,
            competition_group_id: 1,
            comp_number: 1,
            description: '#1 theme',
            rules: '',
          },
        ],
        tags: [
          {
            guild_id: 1,
            name: 'seperate',
            is_seperate: 1,
            type: 'dark',
          },
        ],
        levels: [
          {
            guild_id: 1,
            level_name: 'EZ GG',
            creator: 2,
            code: 'XXX-XXX-XXX',
            status: 1,
            difficulty: 1,
          },
          {
            guild_id: 1,
            level_name: 'seperate',
            creator: 2,
            code: 'XXX-XXX-XX2',
            status: 1,
            difficulty: 1,
            tags: 'seperate',
          },
        ],
        pending_votes: [
          {
            guild_id: 1,
            code: 1,
            player: 1,
            type: 'approve',
            difficulty_vote: 4,
            reason: 'is good',
          },
        ],
        plays: [
          {
            guild_id: 1,
            code: 1,
            player: 1,
            completed: 1,
            liked: 1,
          },
          {
            guild_id: 1,
            code: 1,
            player: 3,
            completed: 1,
            liked: 0,
          },
        ],
        competition_winners: [
          {
            admin_id: 1,
            guild_id: 1,
            code: 1,
            creator: 2,
            competition_id: 1,
            details: 'winner',
            rank: 1,
          },
        ],
      });
      await TEST.ts.load();
    });

    it('POST /json', async function () {
      const { body } = await TEST.request(app)
        .post('/json')
        .send({ url_slug: TEST.ts.url_slug })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.notEqual(
        body.status,
        'error',
        'Should not return error',
      );

      assert.equal(body.levels[0].code, 'XXX-XXX-XXX');
      assert.equal(body.levels[0].level_name, 'EZ GG');
      assert.equal(body.levels[0].creator, 'Creator');
    });

    it('POST /json unknown slug', async function () {
      const { body } = await TEST.request(app)
        .post('/json')
        .send({ url_slug: 'unknown_slug' })
        .expect('Content-Type', /json/);
      // .expect(200);

      assert.deepInclude(body, {
        status: 'error',
        message: 'Error: "unknown_slug" not found',
      });
    });

    it('POST /json w dashboard', async function () {
      const { body } = await TEST.request(app)
        .post('/json')
        .send({ url_slug: TEST.ts.url_slug, dashboard: 1 })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.exists(body.dashboard);
      assert.equal(body.levels[0].code, 'XXX-XXX-XXX');
      assert.equal(body.levels[0].level_name, 'EZ GG');
      assert.equal(body.levels[0].creator, 'Creator');
    });

    it('POST /json/login', async function () {
      const { body } = await TEST.request(app)
        .post('/json/login')
        .send({ url_slug: TEST.ts.url_slug, otp: 'wrong token' })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.deepEqual(body, {
        status: 'error',
        message:
          "Your one time password was incorrect. You can run !login in AutoTest's discord server to get another code",
      });
    });

    it('POST /json, level details', async function () {
      const { body } = await TEST.request(app)
        .post('/json')
        .send({ url_slug: TEST.ts.url_slug, code: 'XXX-XXX-XXX' })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.notEqual(body.status, 'error');

      delete body.levels[0].created_at;
      delete body.levels[0].id;
      assert.equal(body.levels[0].code, 'XXX-XXX-XXX');
      assert.equal(body.levels[0].level_name, 'EZ GG');
      assert.equal(body.levels[0].creator, 'Creator');
    });

    it('POST /json, maker details', async function () {
      const getMember = sinon.stub(TEST.ts.discord, 'getMember');
      getMember.returns({
        hexColor: '#000',
        user: {
          avatarURL: 'have',
        },
      });

      const { body } = await TEST.request(app)
        .post('/json')
        .send({ url_slug: TEST.ts.url_slug, name: 'Creator' })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.notEqual(body.status, 'error');

      delete body.levels[0].created_at;
      delete body.levels[0].id;
      assert.equal(body.levels[0].code, 'XXX-XXX-XXX');
      assert.equal(body.levels[0].level_name, 'EZ GG');
      assert.equal(body.levels[0].creator, 'Creator');
    });

    it('POST /json, maker details no avatar', async function () {
      const getMember = sinon.stub(TEST.ts.discord, 'getMember');
      getMember.returns({
        hexColor: '#000',
        user: {
          avatarURL: null,
        },
      });

      const { body } = await TEST.request(app)
        .post('/json')
        .send({ url_slug: TEST.ts.url_slug, name: 'Creator' })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.notEqual(body.status, 'error');

      delete body.levels[0].created_at;
      delete body.levels[0].id;
      assert.equal(body.levels[0].code, 'XXX-XXX-XXX');
      assert.equal(body.levels[0].level_name, 'EZ GG');
      assert.equal(body.levels[0].creator, 'Creator');
    });

    it('POST /json/worlds all', async function () {
      const { body } = await TEST.request(app)
        .post('/json/worlds')
        .send({ url_slug: TEST.ts.url_slug })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.notEqual(body.status, 'error');

      assert.exists(body.data);
      assert.lengthOf(body.data, 1);
      assert.equal(body.data[0].world_name, 'Super Maker World');
    });

    it('POST /json/worlds members', async function () {
      const { body } = await TEST.request(app)
        .post('/json/worlds')
        .send({
          url_slug: TEST.ts.url_slug,
          membershipStatus: '1',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.notEqual(body.status, 'error');

      assert.exists(body.data);
      assert.lengthOf(body.data, 1);
      assert.equal(body.data[0].world_name, 'Super Maker World');
    });

    it('POST /json/worlds mods', async function () {
      const { body } = await TEST.request(app)
        .post('/json/worlds')
        .send({
          url_slug: TEST.ts.url_slug,
          membershipStatus: '2',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.notEqual(body.status, 'error');

      assert.exists(body.data);
      assert.lengthOf(body.data, 0);
    });

    it('POST /json/worlds unoffical', async function () {
      const { body } = await TEST.request(app)
        .post('/json/worlds')
        .send({
          url_slug: TEST.ts.url_slug,
          membershipStatus: '4',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.notEqual(body.status, 'error');

      assert.exists(body.data);
      assert.lengthOf(body.data, 0);
      // assert.equal(body.data[0].world_name,'Super Maker World');
    });

    it('POST /json/members', async function () {
      // const user=await TEST.ts.getUser(discord_id)
      const { body } = await TEST.request(app)
        .post('/json/members')
        .send({ url_slug: TEST.ts.url_slug })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.notEqual(body.status, 'error');
      // TODO: do more comprehensive checks of the data
    });

    it('POST /json/members competitionWinners', async function () {
      const { body } = await TEST.request(app)
        .post('/json/members')
        .send({
          url_slug: TEST.ts.url_slug,
          timePeriod: 1,
          timePeriod2: 1,
        })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.notEqual(body.status, 'error');
      assert.deepInclude(body[1].wonComps[0], {
        name: 'winner',
        rank: 1,
      });
      // TODO: do more comprehensive checks of the data
    });

    it('POST /json/makers', async function () {
      // const user=await TEST.ts.getUser(discord_id)
      const { body } = await TEST.request(app)
        .post('/json/makers')
        .send({ url_slug: TEST.ts.url_slug })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.notEqual(body.status, 'error');
      // TODO: do more comprehensive checks of the data
    });

    it('POST /json/makers membershipStatus=1', async function () {
      // const user=await TEST.ts.getUser(discord_id)
      const { body } = await TEST.request(app)
        .post('/json/makers')
        .send({ url_slug: TEST.ts.url_slug, membershipStatus: '1' })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.notEqual(body.status, 'error');
      // TODO: do more comprehensive checks of the data
    });

    it('POST /json/makers membershipStatus=2', async function () {
      // const user=await TEST.ts.getUser(discord_id)
      const { body } = await TEST.request(app)
        .post('/json/makers')
        .send({ url_slug: TEST.ts.url_slug, membershipStatus: '2' })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.notEqual(body.status, 'error');
      // TODO: do more comprehensive checks of the data
    });

    it('POST /json/makers membershipStatus=4', async function () {
      // const user=await TEST.ts.getUser(discord_id)
      const { body } = await TEST.request(app)
        .post('/json/makers')
        .send({ url_slug: TEST.ts.url_slug, membershipStatus: '4' })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.notEqual(body.status, 'error');
      // TODO: do more comprehensive checks of the data
    });

    it('POST /json/members membershipStatus=1', async function () {
      // const user=await TEST.ts.getUser(discord_id)
      const { body } = await TEST.request(app)
        .post('/json/members')
        .send({ url_slug: TEST.ts.url_slug, membershipStatus: '1' })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.notEqual(body.status, 'error');
      // TODO: do more comprehensive checks of the data
    });

    it('POST /json/members membershipStatus=2', async function () {
      // const user=await TEST.ts.getUser(discord_id)
      const { body } = await TEST.request(app)
        .post('/json/members')
        .send({ url_slug: TEST.ts.url_slug, membershipStatus: '2' })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.notEqual(body.status, 'error');
      // TODO: do more comprehensive checks of the data
    });

    it('POST /json/members membershipStatus=4', async function () {
      // const user=await TEST.ts.getUser(discord_id)
      const { body } = await TEST.request(app)
        .post('/json/members')
        .send({ url_slug: TEST.ts.url_slug, membershipStatus: '4' })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.notEqual(body.status, 'error');
      // TODO: do more comprehensive checks of the data
    });

    it('POST /json/members membershipStatus=5', async function () {
      // const user=await TEST.ts.getUser(discord_id)
      const { body } = await TEST.request(app)
        .post('/json/members')
        .send({ url_slug: TEST.ts.url_slug, membershipStatus: '5' })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.notEqual(body.status, 'error');
      // TODO: do more comprehensive checks of the data
    });

    for (let i = 1; i <= 4; i += 1) {
      for (let j = 1; j <= 4; j += 1) {
        it(`POST /json/members timePeriod=${i},timePeriod2=${j}`, async function () {
          const { body } = await TEST.request(app)
            .post('/json/members')
            .send({
              url_slug: TEST.ts.url_slug,
              timePeriod: i,
              timePeriod2: j,
            })
            .expect('Content-Type', /json/)
            .expect(200);
          assert.notEqual(body.status, 'error');
          // TODO: do more comprehensive checks of the data
        });
      }
    }

    it('POST /random', async function () {
      const { body } = await TEST.request(app)
        .post('/random')
        .send({ url_slug: TEST.ts.url_slug })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.notEqual(body.status, 'error');
      assert.exists(body.level);
      assert.equal(body.level.code, 'XXX-XXX-XXX'); // only level in the db right now
      assert.isNull(body.player); // only level in the db right now
    });

    it('POST /clear', async function () {
      await TEST.request(app)
        .post('/clear')
        .send({ url_slug: TEST.ts.url_slug });
      // .expect('Content-Type', /json/)
      // .expect(403)
    });

    it('POST /approve', async function () {
      await TEST.request(app)
        .post('/json/random')
        .send({ url_slug: TEST.ts.url_slug });
      // .expect('Content-Type', /json/)
      // .expect(403)
    });
  });

  describe('authenticated calls', function () {
    beforeEach(async () => {
      await TEST.setupData({
        Members: [
          {
            name: 'Mod',
            discord_id: '128',
          },
          {
            name: 'Creator',
            discord_id: '256',
            maker_id: '111-111-111',
            maker_name: 'SMM2',
            world_description: 'Super Maker World',
            world_world_count: 5,
            world_level_count: 5,
          },
          {
            name: 'Banned',
            discord_id: '-1',
            is_banned: 1,
          },
          {
            name: 'Mod2',
            discord_id: '512',
          },
        ],
        Levels: [
          {
            level_name: 'EZ GG',
            creator: 2,
            code: 'XXX-XXX-XXX',
            status: 1,
            difficulty: 1,
          },
          {
            level_name: 'pending',
            creator: 2,
            code: 'XXX-XXX-XX2',
            status: 0,
            difficulty: 0,
          },
        ],
        PendingVotes: [
          {
            code: 2,
            player: 4,
            type: 'approve',
            reason: 'true',
            difficulty_vote: 4,
          },
        ],
        Tokens: [
          {
            discord_id: '128',
            token: '123',
            authenticated: 1,
          },
        ],
      });

      await TEST.setupKnex({
        seasons: [
          {
            guild_id: 1,
            admin_id: 1,
            name: 'Season 1',
          },
        ],
        competition_groups: [
          {
            guild_id: 1,
            name: 'Competition 1',
            competition_tag: 'competition1',
            description: 'Competition One',
            rules: '',
          },
        ],
        competitions: [
          {
            guild_id: 1,
            competition_group_id: 1,
            comp_number: 1,
            description: '#1 theme',
            rules: '',
          },
        ],
        competition_winners: [
          {
            admin_id: 1,
            guild_id: 1,
            code: 1,
            creator: 2,
            competition_id: 1,
            details: 'winner',
            rank: 1,
          },
        ],
        tags: [
          {
            guild_id: 1,
            name: 'seperate',
            is_seperate: 1,
          },
          {
            guild_id: 1,
            name: 'normal',
          },
        ],
      });
    });

    it('POST /random', async function () {
      const { body } = await TEST.request(app)
        .post('/random')
        .send({ url_slug: TEST.ts.url_slug, token: '123' })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.notEqual(body.status, 'error');
      assert.exists(body.level);
      assert.equal(body.level.code, 'XXX-XXX-XXX'); // only level in the db right now
      assert.deepInclude(body.player, {
        id: 1,
        updated_at: null,
        deleted_at: null,
        guild_id: 1,
        discord_id: '128',
        name: 'Mod',
      }); // only level in the db right now
    });

    it('POST /json/members ', async function () {
      // const user=await TEST.ts.getUser(discord_id)
      const { body } = await TEST.request(app)
        .post('/json/members')
        .send({ url_slug: TEST.ts.url_slug, token: '123' })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.notEqual(body.status, 'error');
      // TODO: do more comprehensive checks of the data
    });

    it('POST /json', async function () {
      const { body } = await TEST.request(app)
        .post('/json')
        .send({ url_slug: TEST.ts.url_slug, token: '123' })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.notEqual(
        body.status,
        'error',
        'Should not return error',
      );

      delete body.levels[0].created_at;
      delete body.levels[0].id;
      assert.equal(body.levels[0].code, 'XXX-XXX-XXX');
      assert.equal(body.levels[0].level_name, 'EZ GG');
      assert.equal(body.levels[0].creator, 'Creator');
    });

    it('POST /json see pending votes', async function () {
      await TEST.ts.db.Members.query()
        .patch({ is_mod: 1 })
        .where({ discord_id: '128' });
      const { body } = await TEST.request(app)
        .post('/json')
        .send({
          url_slug: TEST.ts.url_slug,
          token: '123',
          code: 'XXX-XXX-XX2',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.notEqual(
        body.status,
        'error',
        'Should not return error',
      );

      assert.equal(body.levels[0].code, 'XXX-XXX-XX2');
      assert.exists(body.pending_comments);
      assert.deepInclude(body.pending_comments[0], {
        id: 1,
        guild_id: 1,
        player: 'Mod2',
        code: 'XXX-XXX-XX2',
        is_shellder: 0,
        type: 'approve',
        difficulty_vote: 4,
        reason: 'true',
        player_id: 4,
        level_id: 2,
      });
    });

    it('POST /json with name', async function () {
      const { body } = await TEST.request(app)
        .post('/json')
        .send({
          url_slug: TEST.ts.url_slug,
          token: '123',
          name: 'Creator',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.notEqual(
        body.status,
        'error',
        'Should not return error',
      );

      delete body.levels[0].created_at;
      delete body.levels[0].id;
      assert.equal(body.levels[0].code, 'XXX-XXX-XXX');
      assert.equal(body.levels[0].level_name, 'EZ GG');
      assert.equal(body.levels[0].creator, 'Creator');
    });

    it('POST /json with code', async function () {
      const { body } = await TEST.request(app)
        .post('/json')
        .send({
          url_slug: TEST.ts.url_slug,
          token: '123',
          code: 'xxx-xxx-xxx',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.notEqual(
        body.status,
        'error',
        'Should not return error',
      );

      delete body.levels[0].created_at;
      delete body.levels[0].id;
      assert.equal(body.levels[0].code, 'XXX-XXX-XXX');
      assert.equal(body.levels[0].level_name, 'EZ GG');
      assert.equal(body.levels[0].creator, 'Creator');
    });

    it('POST /feedback', async function () {
      const done = TEST.acceptReply();
      const { body } = await TEST.request(app)
        .post('/feedback')
        .send({
          url_slug: TEST.ts.url_slug,
          token: '123',
          message: 'true',
        })
        .expect('Content-Type', /json/)
        .expect(200);
      const reply = done();
      assert.match(reply, /\*\*\[[0-9a-f]+\]\*\*\n> true/);
      assert.deepInclude(body, {
        status: 'successful',
        url_slug: 'makerteam',
      });
    });

    it('POST /approve no token', async function () {
      const done = TEST.acceptReply();
      const { body } = await TEST.request(app)
        .post('/approve')
        .send({
          url_slug: TEST.ts.url_slug,
        })
        .expect('Content-Type', /json/)
        .expect(200);
      done();
      assert.deepEqual(body, {
        status: 'error',
        message: 'No token sent',
      });
    });

    it('POST /approve not mod', async function () {
      const done = TEST.acceptReply();
      const { body } = await TEST.request(app)
        .post('/approve')
        .send({
          url_slug: TEST.ts.url_slug,
          token: '123',
        })
        .expect('Content-Type', /json/)
        .expect(200);
      done();
      assert.deepEqual(body, {
        status: 'error',
        message: 'forbidden',
      });
    });

    it('POST /approve', async function () {
      await TEST.knex('members')
        .update({ is_mod: 1 })
        .where({ discord_id: '128' });
      const done = TEST.acceptReply();
      const { body } = await TEST.request(app)
        .post('/approve')
        .send({
          url_slug: TEST.ts.url_slug,
          token: '123',
          code: 'XXX-XXX-XX2',
          reason: 'not bad',
          type: 'approve',
        })
        .expect('Content-Type', /json/)
        .expect(200);
      done();
      assert.match(body.msg, /Your vote was added to <#[0-9]+>!/);
      assert.equal(body.status, 'successful');
      assert.equal(body.url_slug, 'makerteam');
    });

    it('POST /approve w clear', async function () {
      await TEST.knex('members')
        .update({ is_mod: 1 })
        .where({ discord_id: '128' });
      const done = TEST.acceptReply();
      const { body } = await TEST.request(app)
        .post('/approve')
        .send({
          url_slug: TEST.ts.url_slug,
          token: '123',
          code: 'XXX-XXX-XX2',
          reason: 'not bad',
          type: 'approve',
          completed: 1,
        })
        .expect('Content-Type', /json/)
        .expect(200);
      done();
      assert.match(body.msg, /Your vote was added to <#[0-9]+>!/);
      assert.equal(body.status, 'successful');
      assert.equal(body.url_slug, 'makerteam');
    });

    it('POST /clear', async function () {
      await TEST.knex('members')
        .update({ is_mod: 1 })
        .where({ discord_id: '128' });
      const done = TEST.acceptReply();
      const { body } = await TEST.request(app)
        .post('/clear')
        .send({
          url_slug: TEST.ts.url_slug,
          token: '123',
          code: 'XXX-XXX-XX2',
          completed: 1,
        })
        .expect('Content-Type', /json/)
        .expect(200);
      const reply = done();
      assert.equal(
        reply,
        "Mod \n ‣You have cleared 'pending'  by Creator \n ‣This level is still pending",
      );
      assert.equal(
        body.msg,
        "Mod \n ‣You have cleared 'pending'  by Creator \n ‣This level is still pending",
      );
      assert.equal(body.status, 'successful');
      assert.equal(body.url_slug, 'makerteam');
    });

    it('POST /feedback no token', async function () {
      const done = TEST.acceptReply();
      const { body } = await TEST.request(app)
        .post('/feedback')
        .send({
          url_slug: TEST.ts.url_slug,
        })
        .expect('Content-Type', /json/)
        .expect(200);
      done();
      assert.deepEqual(body, {
        status: 'error',
        message: 'No token sent',
      });
    });

    it('POST /feedback no message', async function () {
      const done = TEST.acceptReply();
      const { body } = await TEST.request(app)
        .post('/feedback')
        .send({
          token: '123',
          url_slug: TEST.ts.url_slug,
        })
        .expect('Content-Type', /json/)
        .expect(200);
      done();
      assert.deepEqual(body, {
        status: 'error',
        message: 'No message was sent!',
      });
    });

    it('POST /feedback message too long', async function () {
      const done = TEST.acceptReply();
      const { body } = await TEST.request(app)
        .post('/feedback')
        .send({
          token: '123',
          url_slug: TEST.ts.url_slug,
          message:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla posuere dapibus consequat. In ut lacus nunc. Sed tellus arcu, vestibulum sit amet lectus quis, scelerisque consectetur elit. In hac habitasse platea dictumst. Cras pellentesque efficitur mauris at pellentesque. Donec ante ante, efficitur quis nisl sit amet, vehicula tempus nulla. Duis aliquet posuere nulla ut sodales. Donec quis mauris purus. Duis sed nisi placerat, sodales turpis id, vestibulum lectus. Sed varius risus lectus, vitae aliquam leo tincidunt et. Nulla elementum dapibus elit, sed dapibus velit. Cras sodales dictum lorem vitae laoreet. Maecenas eu augue et sapien lobortis dignissim et eget arcu. Suspendisse placerat, ipsum et facilisis fermentum, ipsum metus sagittis massa, non faucibus leo justo quis est. Aliquam at purus sed eros efficitur feugiat nec ac purus. Suspendisse eget lorem id risus porta vehicula. Integer ex augue, tempor id semper fringilla, vehicula a mauris. Mauris sollicitudin turpis ante turpis.',
        })
        .expect('Content-Type', /json/)
        .expect(200);
      done();
      assert.deepEqual(body, {
        status: 'error',
        message:
          'The supplied message is too long, please keep it lower than 1000 characters!',
      });
    });

    it('POST /teams/settings', async () => {
      const teamAdmin = sinon.stub(TEST.ts, 'teamAdmin');
      teamAdmin.returns(true);
      const done = TEST.acceptReply();
      const { body } = await TEST.request(app)
        .post('/teams/settings')
        .send({
          token: '123',
          url_slug: TEST.ts.url_slug,
        })
        .expect('Content-Type', /json/)
        .expect(200);
      done();
      assert.exists(body.settings);
      assert.isTrue(body.teamAdmin);

      const result2 = await TEST.request(app)
        .put('/teams/settings')
        .send({
          token: '123',
          url_slug: TEST.ts.url_slug,
          data: body.settings,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.deepInclude(result2.body, {
        status: 'successful',
        url_slug: 'makerteam',
        teamAdmin: true,
      });

      const result3 = await TEST.request(app)
        .put('/teams/settings')
        .send({
          token: '123',
          url_slug: TEST.ts.url_slug,
          data: body.settings,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.deepInclude(result3.body, {
        status: 'successful',
        url_slug: 'makerteam',
        teamAdmin: true,
      });
      // randomEmote
      teamAdmin.restore();
    });

    it('POST /teams/tags', async () => {
      const teamAdmin = sinon.stub(TEST.ts, 'teamAdmin');
      teamAdmin.returns(true);
      const done = TEST.acceptReply();
      const { body } = await TEST.request(app)
        .post('/teams/tags')
        .send({
          token: '123',
          url_slug: TEST.ts.url_slug,
        })
        .expect('Content-Type', /json/)
        .expect(200);
      done();
      assert.exists(body.data);
      assert.isTrue(body.teamAdmin);

      const result2 = await TEST.request(app)
        .put('/teams/tags')
        .send({
          token: '123',
          url_slug: TEST.ts.url_slug,
          data: body.data,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.equal(result2.body.data, 'tags updated');

      const result3 = await TEST.request(app)
        .put('/teams/tags')
        .send({
          token: '123',
          url_slug: TEST.ts.url_slug,
          data: body.data,
        })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.equal(result3.body.data, 'No tags updated');

      const result4 = await TEST.request(app)
        .put('/teams/tags')
        .send({
          token: '123',
          url_slug: TEST.ts.url_slug,
          data: [
            ...body.data,
            {
              name: 'normal',
            },
          ],
        })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.deepEqual(result4.body, {
        status: 'error',
        message: 'There were duplicate tags for normal',
      });

      const result5 = await TEST.request(app)
        .put('/teams/tags')
        .send({
          token: '123',
          url_slug: TEST.ts.url_slug,
          data: [
            ...body.data,
            {
              name: 'new-tag',
            },
          ],
        })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.equal(result5.body.data, 'tags updated');

      teamAdmin.restore();
    });

    it('PUT /teams/tags empty', async () => {
      const teamAdmin = sinon.stub(TEST.ts, 'teamAdmin');
      teamAdmin.returns(true);
      const done = TEST.acceptReply();
      const { body } = await TEST.request(app)
        .put('/teams/tags')
        .send({
          token: '123',
          url_slug: TEST.ts.url_slug,
        })
        .expect('Content-Type', /json/)
        .expect(200);
      done();
      assert.deepEqual(body, {
        status: 'error',
        message: 'No data sent',
      });
      teamAdmin.restore();
    });
  });
});
