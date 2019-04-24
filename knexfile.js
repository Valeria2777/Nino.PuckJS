// Update with your config settings.

module.exports = {

  development: {
    client: 'mssql',
    connection: {
      server : '127.0.0.1',
      user : 'sa',
      password : 'Tenco1234',
      database : 'PuckJS',
    }
  },

  staging: {
    client: 'mssql',
    connection: {
      server : '127.0.0.1',
      user : 'sa',
      password : 'Tenco1234',
      database : 'PuckJS',
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'mssql',
    connection: {
      server : '127.0.0.1',
      user : 'sa',
      password : 'Tenco1234',
      database : 'PuckJS',
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
