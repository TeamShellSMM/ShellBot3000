describe('Web Apis', function () {
  describe('unauthenticated calls', function () {
    before(async () => {
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
        Levels: [
          {
            level_name: 'EZ GG',
            creator: 2,
            code: 'XXX-XXX-XXX',
            status: 1,
            difficulty: 1,
          },
        ],
        PendingVotes: [
          {
            code: 1,
            player: 1,
            type: 'approve',
            difficulty_vote: 4,
            reason: 'is good',
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
    });
    // TODO:web api, fix competition winners
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

      assert.lengthOf(body.levels, 1, 'one levels in db');

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

      assert.lengthOf(body.levels, 1, 'one levels in db');

      delete body.levels[0].created_at;
      delete body.levels[0].id;
      assert.equal(body.levels[0].code, 'XXX-XXX-XXX');
      assert.equal(body.levels[0].level_name, 'EZ GG');
      assert.equal(body.levels[0].creator, 'Creator');
    });

    it('POST /json, maker details', async function () {
      const { body } = await TEST.request(app)
        .post('/json')
        .send({ url_slug: TEST.ts.url_slug, creator: 'Creator' })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.notEqual(body.status, 'error');

      assert.lengthOf(body.levels, 1, 'one levels in db');

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

    it('POST /json/members ', async function () {
      // const user=await TEST.ts.getUser(discord_id)
      const { body } = await TEST.request(app)
        .post('/json/members')
        .send({ url_slug: TEST.ts.url_slug })
        .expect('Content-Type', /json/)
        .expect(200);

      assert.notEqual(body.status, 'error');
      // For now we stop comparing these
    });

    it('POST /json/makers', async function () {
      // const user=await TEST.ts.getUser(discord_id)
      const { body } = await TEST.request(app)
        .post('/json/makers')
        .send({ url_slug: TEST.ts.url_slug })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.notEqual(body.status, 'error');
      // For now we stop comparing these
    });

    it('POST /json/members membershipStatus=1', async function () {
      // const user=await TEST.ts.getUser(discord_id)
      const { body } = await TEST.request(app)
        .post('/json/members')
        .send({ url_slug: TEST.ts.url_slug, membershipStatus: '1' })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.notEqual(body.status, 'error');
      // For now we stop comparing these
    });

    it('POST /json/members membershipStatus=2', async function () {
      // const user=await TEST.ts.getUser(discord_id)
      const { body } = await TEST.request(app)
        .post('/json/members')
        .send({ url_slug: TEST.ts.url_slug, membershipStatus: '2' })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.notEqual(body.status, 'error');
      // For now we stop comparing these
    });

    it('POST /json/members membershipStatus=4', async function () {
      // const user=await TEST.ts.getUser(discord_id)
      const { body } = await TEST.request(app)
        .post('/json/members')
        .send({ url_slug: TEST.ts.url_slug, membershipStatus: '4' })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.notEqual(body.status, 'error');
      // For now we stop comparing these
    });

    it('POST /json/members membershipStatus=5', async function () {
      // const user=await TEST.ts.getUser(discord_id)
      const { body } = await TEST.request(app)
        .post('/json/members')
        .send({ url_slug: TEST.ts.url_slug, membershipStatus: '5' })
        .expect('Content-Type', /json/)
        .expect(200);
      assert.notEqual(body.status, 'error');
      // For now we stop comparing these
    });

    for (let i = 1; i <= 4; i += 1) {
      for (let j = 1; j <= 4; j += 1) {
        it(`POST /json/members timePeriod=${i},timePeriod2=${j} @curr`, async function () {
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
          // For now we stop comparing these
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

    it('POST /random', async function () {
      const done = TEST.acceptReply();
      await TEST.request(app)
        .post('/json/random')
        .send({ url_slug: TEST.ts.url_slug });
      // .expect('Content-Type', /json/)
      // .expect(403)
      done();
    });
  });

  describe('authenticated calls', function () {
    before(async () => {
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
        ],
        Levels: [
          {
            level_name: 'EZ GG',
            creator: 2,
            code: 'XXX-XXX-XXX',
            status: 1,
            difficulty: 1,
          },
        ],
        PendingVotes: [
          {
            code: 1,
            player: 1,
            type: 'approve',
            reason: 'yes',
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
      // For now we stop comparing these
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

      assert.lengthOf(body.levels, 1, 'one levels in db');

      delete body.levels[0].created_at;
      delete body.levels[0].id;
      assert.equal(body.levels[0].code, 'XXX-XXX-XXX');
      assert.equal(body.levels[0].level_name, 'EZ GG');
      assert.equal(body.levels[0].creator, 'Creator');
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

      assert.lengthOf(body.levels, 1, 'one levels in db');

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

      assert.lengthOf(body.levels, 1, 'one levels in db');

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
          message: 'yes',
        })
        .expect('Content-Type', /json/)
        .expect(200);
      const reply = done();
      assert.match(reply, /\*\*\[[0-9a-f]+\]\*\*\n> yes/);
      assert.deepEqual(body, {
        status: 'successful',
        url_slug: 'makerteam',
      });
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
  });
});
