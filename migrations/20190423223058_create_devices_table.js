
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('devices', function (table) {
       table.increments('id');
       table.string('MAC', 255).notNullable();
       table.string('command', 255).notNullable();
    })
};

exports.down = function(knex, Promise) {
  return knex.schema
      .dropTable("devices")
};
