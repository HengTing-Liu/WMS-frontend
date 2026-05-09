const mysql = require('mysql2/promise');
async function main() {
  const conn = await mysql.createConnection({
    host: '10.201.0.34', port: 3306, user: 'test', password: 'Test123!@#', database: 'wms'
  });

  const [rows] = await conn.query(`SELECT menu_id, menu_name, path, component, parent_id, visible, perms FROM sys_menu WHERE parent_id = 0 AND visible = 0 ORDER BY order_num`);
  console.log('=== Top-level menus (parent_id=0, visible=0) ===');
  rows.forEach(r => console.log(r.menu_id, r.menu_name, r.path, r.component || 'NULL', r.perms || 'NULL'));

  const [all] = await conn.query(`SELECT menu_id, menu_name, path, component FROM sys_menu WHERE menu_name LIKE '%系统%' OR menu_name LIKE '%设置%' ORDER BY menu_id`);
  console.log('\n=== Menus containing 系统 or 设置 ===');
  all.forEach(r => console.log(r.menu_id, r.menu_name, r.path, r.component || 'NULL'));

  const [m1080] = await conn.query(`SELECT menu_id, menu_name, HEX(menu_name) as hex_name FROM sys_menu WHERE menu_id = 1080`);
  console.log('\n=== Menu 1080 ===');
  m1080.forEach(r => console.log(r.menu_id, r.menu_name, r.hex_name));

  await conn.end();
}
main().catch(console.error);
