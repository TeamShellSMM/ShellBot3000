describe('Setup test and check teams registration', function () {
  it('Creating discord connection and sending a message', async function () {
    assert.isOk(TEST.client, 'client is okay');
    assert.isOk(TEST.message, 'message is sent');
  });

  it('Creating team info and TS', async function () {
    const [teams] = await TEST.knex.raw(`SELECT * FROM teams;`);
    assert.lengthOf(teams, 1, 'Should have created teams');
    assert.isOk(TEST.ts, 'ts is created');
  });

  it('Creating web api', async function () {
    assert.isOk(app, 'App is created');
  });
});
