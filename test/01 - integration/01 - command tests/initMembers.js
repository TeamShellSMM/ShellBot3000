describe('initMembers', () => {
  before(async () => {
    await TEST.clearDb();
  });

  it('!success', async () => {
    let members = await TEST.ts.db.Members.query().select();
    assert.equal(members.length, 0);

    const teamAdmin = sinon.stub(TEST.ts, 'teamAdmin');
    teamAdmin.returns(true);
    const botIdStub = sinon.stub(TEST.ts.discord, 'botId');
    botIdStub.returns('fake-id');
    let result = await TEST.mockBotSend({
      cmd: '!initMembers',
      channel: 'general',
      discord_id: '128',
    });
    members = await TEST.ts.db.Members.query().select();
    assert(
      members.length > 0,
      'there should be some members registered',
    );
    assert.match(
      result,
      /[0-9]+ members have been registered with their discord name, [0-9]+ have been skipped because they were already registered./,
    );

    result = await TEST.mockBotSend({
      cmd: '!initMembers',
      channel: 'general',
      discord_id: '128',
    });

    assert.match(
      result,
      /0 members have been registered with their discord name, [0-9]+ have been skipped because they were already registered./,
    );

    sinon.restore();
  });
});
