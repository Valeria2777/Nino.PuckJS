
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('commands', function (table) {
      table.increments('id');
      table.string('name', 255).notNullable();
      table.string('command', 255).notNullable();
      table.integer('device_id').unsigned().index().references('id').inTable('devices')
    })
};

exports.down = function(knex, Promise) {
  return knex.schema
      .dropTable("commands")
      .dropForeign('device_id', 'Devices.id')
};
