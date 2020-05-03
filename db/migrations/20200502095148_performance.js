
exports.up = function(knex) {

  return knex.schema
  .alterTable('members', function(t) {
    t.integer('guild_id').notNull().alter()
    t.decimal('maker_points',8,1).notNull().default(0)
    t.decimal('own_score',6,1).notNull().default(0)
    t.integer('free_submissions').notNull().default(0)

    t.foreign('guild_id').references('id').inTable('teams');
  })
  .alterTable('levels', function(t) {
    t.integer('guild_id').notNull().alter()
    t.integer('creator').notNull().alter()
    t.decimal('difficulty',4,1).nullable().alter()
    
    t.integer('likes').notNull().default(0)
    t.integer('clears').notNull().default(0)
    t.integer('num_votes').notNull().default(0)
    t.decimal('average_votes',4,1).notNull().default(0)
    t.decimal('maker_points',8,1).notNull().default(0)
    t.integer('row_num').nullable()
    t.decimal('clear_like_ratio',4,1).notNull().default(0)
    t.boolean('not_default').nullable()

    t.integer('rejects').notNull().default(0)
    t.integer('approves').notNull().default(0)
    t.integer('want_fixes').notNull().default(0)

    t.foreign('guild_id').references('id').inTable('teams');
    t.foreign('creator').references('id').inTable('members');
  })
  .alterTable('pending_votes', function(t) {
    t.integer('guild_id').notNull().alter()
    t.integer('player').notNull().alter()
    t.integer('code').notNull().alter()

    t.foreign('guild_id').references('id').inTable('teams');
    t.foreign('player').references('id').inTable('members');
    t.foreign('code').references('id').inTable('levels');
  })
  .alterTable('plays', function(t) {
    t.integer('guild_id').notNull().alter()
    t.integer('player').notNull().alter()
    t.integer('code').notNull().alter()

    t.index(['guild_id','code','player'])

    t.foreign('guild_id').references('id').inTable('teams');
    t.foreign('player').references('id').inTable('members');
    t.foreign('code').references('id').inTable('levels');
  })

};
exports.down = function(knex) {
  return knex.schema
  .alterTable('plays', function(t) {
    t.dropIndex(['guild_id','code','player'])

    t.dropForeign('guild_id');
    t.dropForeign('player');
    t.dropForeign('code');

    t.string('guild_id',30).alter()
    t.string('player').notNull().alter()
    t.string('code').notNull().alter()
  })
  .alterTable('pending_votes', function(t) {
    t.dropForeign('guild_id');
    t.dropForeign('player');
    t.dropForeign('code');

    t.string('guild_id',30).alter()
    t.string('player').notNull().alter()
    t.string('code').notNull().alter()
  })
  .alterTable('levels', function(t) {
    t.dropForeign('guild_id');
    t.dropForeign('creator');

    t.string('difficulty').nullable().alter()
    t.string('guild_id',30).alter()
    t.string('creator').notNull().alter()

    t.dropColumn('likes')
    t.dropColumn('clears')
    t.dropColumn('num_votes')
    t.dropColumn('average_votes')
    t.dropColumn('maker_points')
    t.dropColumn('row_num')
    t.dropColumn('clear_like_ratio')
    t.dropColumn('not_default')


    t.dropColumn('rejects')
    t.dropColumn('approves')
    t.dropColumn('want_fixes')
  })
  .alterTable('members', function(t) {
    t.dropForeign('guild_id');
    t.dropColumn('free_submission');
    t.dropColumn('own_score');
    t.dropColumn('maker_points');
    t.string('guild_id',30).alter();
  })
};
