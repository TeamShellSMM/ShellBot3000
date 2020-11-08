const TSCommand = require('../TSCommand.js');

class ModMergeMember extends TSCommand {
  constructor() {
    super('modmergemembers', {
      aliases: ['modmergemembers', 'modmergemember'],
      args: [
        {
          id: 'memberKeep',
          description: 'memberToKeep',
          type: 'teammember',
          default: null,
        },
        {
          id: 'memberMerge',
          description: 'memberToMerge',
          type: 'teammember',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args) {
    const { memberKeep, memberMerge } = args;

    if (memberKeep.id === memberMerge.id) {
      ts.userError(await ts.message('modmergemembers.sameMember'));
    }

    // First we go through everything where we can just update the member id
    // We skip all admin_ids because the record will stay in the db anyway and they're not relevant for the users

    // First we transfer all their created races and their entered races
    await ts.db.Races.query()
      .where({ creator_id: memberMerge.id })
      .update({ creator_id: memberKeep.id });

    await ts.db.RaceEntrants.query()
      .where({ member_id: memberMerge.id })
      .update({ member_id: memberKeep.id });

    // Then we migrate their created levels
    await ts.db.Levels.query()
      .where({ creator: memberMerge.id })
      .update({ creator: memberKeep.id });

    // Then we migrate their pending votes
    await ts.db.PendingVotes.query()
      .where({ player: memberMerge.id })
      .update({ player: memberKeep.id });

    // Then their competition wins (we have to check for their guild id manually here because there's no ts.db.CompWinners yet)
    await ts
      .knex('competition_winners')
      .where({ creator: memberMerge.id, guild_id: ts.team.id })
      .update({ creator: memberKeep.id });

    // Finally we finish up the easy stuff with their videos
    await ts.db.Videos.query()
      .where({ submitter_id: memberMerge.id })
      .update({ submitter_id: memberKeep.id });

    // The plays are a bit more complicated, we need to go through all of the merge member's clears separately
    const mergePlays = await ts.knex('plays').where({
      player: memberMerge.id,
    });

    for (const mergePlay of mergePlays) {
      const keepPlay = await ts
        .knex('plays')
        .where({
          player: memberKeep.id,
        })
        .first();

      if (keepPlay) {
        // This is an actual merge if there's a play for both members
        const updateJson = {
          completed: mergePlay.completed || keepPlay.completed,
          liked: mergePlay.liked || keepPlay.liked,
          is_shellder: mergePlay.is_shellder || keepPlay.is_shellder,
        };
        if (!keepPlay.difficulty_vote) {
          updateJson.difficulty_vote = mergePlay.difficulty_vote;
        }

        await ts
          .knex('plays')
          .where({
            id: keepPlay.id,
          })
          .update(updateJson);

        await ts.db.Videos.query()
          .where({ play_id: mergePlay.id })
          .update({ play_id: keepPlay.id });
        await ts.knex('plays').where('id', mergePlay.id).del();
      } else {
        // check if this is their own level
        const newPlayLevel = await ts.db.Levels.query()
          .where({
            id: mergePlay.level_id,
          })
          .first();
        if (newPlayLevel) {
          if (newPlayLevel.creator !== memberKeep.id) {
            // We only move their play over if there is no play and the creator of the play-level isn't the member to keep
            const mergeKeep = await ts
              .knex('plays')
              .where({
                id: mergePlay.id,
              })
              .update({
                player: memberKeep.id,
              });
            // After that we move all the videos from that play over
            await ts.db.Videos.query()
              .where({ play_id: mergePlay.id })
              .update({ play_id: mergeKeep.id });
          }
        }
      }
    }

    // Delete all plays that are now on their own levels
    const playsToRemove = await ts
      .knex('plays')
      .select('plays.id')
      .join('levels', 'plays.code', '=', 'levels.id')
      .where({
        'levels.creator': memberKeep.id,
      });

    await ts
      .knex('plays')
      .whereIn(
        'id',
        playsToRemove.map((x) => x.id),
      )
      .del();

    // If all of this insanity didn't throw an error we're done here, so we just need to remove the merged member and move some data over
    const updateJson = {
      is_mod: memberKeep.is_mod || memberMerge.is_mod,
      is_member: memberKeep.is_member || memberMerge.is_member,
      world_world_count:
        memberKeep.world_world_count || memberMerge.world_world_count,
      world_level_count:
        memberKeep.world_level_count || memberMerge.world_level_count,
      atme: memberKeep.atme || memberMerge.atme,
      maker_id: memberKeep.maker_id
        ? memberKeep.maker_id
        : memberMerge.maker_id,
      maker_name: memberKeep.maker_name
        ? memberKeep.maker_name
        : memberMerge.maker_name,
      world_description: memberKeep.world_description
        ? memberKeep.world_description
        : memberMerge.world_description,
    };

    await ts.db.Members.query()
      .where({ id: memberKeep.id })
      .update(updateJson);

    await ts.db.Members.query()
      .where({ id: memberMerge.id })
      .update({
        discord_id: null,
        name: `${memberMerge.name} (merged)`,
        is_mod: 0,
        is_member: 0,
        clear_score_sum: 0.0,
        levels_created: 0,
        levels_cleared: 0,
        maker_points: 0.0,
        own_score: 0.0,
        world_world_count: 0,
        world_level_count: 0,
        atme: null,
        maker_id: null,
        maker_name: null,
        world_description: null,
      });

    await ts.discord.reply(
      message,
      await ts.message('success.modmergemembers', {
        memberKeepName: memberKeep.name,
        memberMergeName: memberMerge.name,
      }),
    );
  }
}
module.exports = ModMergeMember;
