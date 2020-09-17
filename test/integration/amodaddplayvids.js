describe('!modadd/remove vids', () => {
  beforeEach(async () => {
    await TEST.setupData({
      Members: [
        {
          name: 'Mod',
          discord_id: '128',
          is_mod: 1,
        },
        {
          name: 'Creator',
          discord_id: '256',
        },
        {
          name: 'Other',
          discord_id: '512',
        },
        {
          name: 'Mod2',
          discord_id: '1024',
          is_mod: 1,
        },
        {
          name: 'Other2',
          discord_id: '2048',
        },
      ],
      Levels: [
        {
          level_name: 'approved level',
          creator: 2,
          code: 'XXX-XXX-XXX',
          status: 1,
          difficulty: 1,
        },
        {
          level_name: 'pending level',
          creator: 2,
          code: 'XXX-XXX-XX2',
          status: 0,
          difficulty: 0,
          videos: 'https://youtube.com,https://twitch.tv',
        },
      ],
      Plays: [
        {
          code: 1,
          player: 3,
          completed: 1,
        },
        {
          code: 1,
          player: 1,
          completed: 1,
        },
      ],
      Videos: [
        {
          level_id: 2,
          url: 'https://youtube.com',
          type: 'youtube',
        },
        {
          level_id: 2,
          url: 'https://twitch.tv',
          type: 'twitch',
        },
        {
          level_id: 1,
          play_id: 2,
          url: 'https://clips.twitch.tv/alreadyused',
          type: 'twitch',
        },
        {
          level_id: 1,
          play_id: 2,
          url: 'https://clips.twitch.tv/alreadyused2',
          type: 'twitch',
        },
        {
          level_id: 1,
          url: 'https://clips.twitch.tv/alreadyused3',
          type: 'twitch',
        },
      ],
    });
  });

  it('!modaddplayvid', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd:
          '!modaddplayvids Other XXX-XXX-XXX https://clips.twitch.tv/12345',
        channel: TEST.ts.channels.modChannel,
        discord_id: '1024',
      }),
      '<@1024> Clear videos added for "approved level" by "Creator" \nYour current videos:```\nhttps://clips.twitch.tv/12345```',
    );
  });

  it('!modaddplayvid no clear', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd:
          '!modaddplayvids Other2 XXX-XXX-XXX https://clips.twitch.tv/12345',
        channel: TEST.ts.channels.modChannel,
        discord_id: '1024',
      }),
      "You haven't submitted a clear for this level yet, try using `!clear XXX-XXX-XXX` before trying to add a video. ",
    );
  });

  it('!modaddplayvid disallowed site', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd:
          '!modaddplayvids Other XXX-XXX-XXX https://clips.othersite.tv/12345',
        channel: TEST.ts.channels.modChannel,
        discord_id: '1024',
      }),
      'The following urls are not from allowed video hosting websites: ```https://clips.othersite.tv/12345```\nCurrently we only allow videos from twitter, youtube, twitch, imgur, streamable and reddit. ',
    );
  });

  it('!modaddplayvid already used clearvid', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd:
          '!modaddplayvids Other XXX-XXX-XXX https://clips.twitch.tv/alreadyused',
        channel: TEST.ts.channels.modChannel,
        discord_id: '1024',
      }),
      'The following url is already used as a clearvid for another member: ```https://clips.twitch.tv/alreadyused``` ',
    );
  });

  it('!modremoveplayvids', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd:
          '!modremoveplayvids Mod XXX-XXX-XXX https://clips.twitch.tv/alreadyused2',
        channel: TEST.ts.channels.modChannel,
        discord_id: '1024',
      }),
      '<@1024> Clear videos removed for "approved level" by "Creator" \nCurrent videos:```\nhttps://clips.twitch.tv/alreadyused```',
    );
  });
});
