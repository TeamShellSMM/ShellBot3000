const db = {
  client: 'mysql',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true,
  },
  migrations: {
    directory: './db/migrations',
    tableName: 'knex_migrations',
  },
};
module.exports = {
  development: db,
  test: db,
  production: db,
};
