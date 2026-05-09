/**
 * 低代码操作按钮权限：兼容 meta 与菜单里历史上不一致的 perms 写法。
 * 例如 sys_table_operation 填 system:warehouse:add，而 sys_menu 为 base:warehouse:add。
 * 又如 meta 填 remove，菜单为 delete（或反之）。
 */

/** 展开为可参与匹配的权限码变体 */
export function expandPermissionVariants(code: string): string[] {
  const trimmed = code.trim();
  if (!trimmed) return [];
  const out = new Set<string>([trimmed]);

  // 兼容历史前缀：wms:base:* / wms:system:* 与 base:* / system:* 互通
  if (trimmed.startsWith('wms:')) {
    out.add(trimmed.slice(4));
  } else {
    out.add(`wms:${trimmed}`);
  }

  const prefixPairs: [RegExp, string][] = [
    [/^system:warehouse:/, 'base:warehouse:'],
    [/^base:warehouse:/, 'system:warehouse:'],
    [/^system:warehouseReceiver:/, 'base:warehouseReceiver:'],
    [/^base:warehouseReceiver:/, 'system:warehouseReceiver:'],
    [/^wms:system:warehouse:/, 'wms:base:warehouse:'],
    [/^wms:base:warehouse:/, 'wms:system:warehouse:'],
    [/^wms:system:warehouseReceiver:/, 'wms:base:warehouseReceiver:'],
    [/^wms:base:warehouseReceiver:/, 'wms:system:warehouseReceiver:'],
    // 物料模块兼容：meta 用 sys:material:*，菜单用 wms:base:material:*
    [/^sys:material:/, 'wms:base:material:'],
    [/^wms:sys:material:/, 'wms:base:material:'],
    // 库位模块兼容：meta 用 inv_location:* / inv:location:*，菜单用 wms:base:location:*
    [/^inv_location:/, 'wms:base:location:'],
    [/^inv:location:/, 'wms:base:location:'],
    [/^wms:inv_location:/, 'wms:base:location:'],
    [/^wms:inv:location:/, 'wms:base:location:'],
    // 仓库模块兼容：meta 用 inv_warehouse:* / inv:warehouse:*，菜单用 wms:base:warehouse:*
    [/^inv_warehouse:/, 'wms:base:warehouse:'],
    [/^inv:warehouse:/, 'wms:base:warehouse:'],
    [/^wms:inv_warehouse:/, 'wms:base:warehouse:'],
    [/^wms:inv:warehouse:/, 'wms:base:warehouse:'],
    // 仓库收货人模块兼容
    [/^inv_warehouse_receiver:/, 'wms:base:warehouseReceiver:'],
    [/^inv:warehouseReceiver:/, 'wms:base:warehouseReceiver:'],
    [/^wms:inv_warehouse_receiver:/, 'wms:base:warehouseReceiver:'],
    [/^wms:inv:warehouseReceiver:/, 'wms:base:warehouseReceiver:'],
  ];
  for (const c of [...out]) {
    for (const [from, to] of prefixPairs) {
      if (from.test(c)) {
        out.add(c.replace(from, to));
      }
    }
  }

  // 同模块下常见同义后缀（meta 与 RBAC 菜单 perms 不一致时仍能通过）
  let round = 0;
  while (round < 3) {
    round += 1;
    const snapshot = [...out];
    for (const c of snapshot) {
      if (/:delete$/.test(c)) out.add(c.replace(/:delete$/, ':remove'));
      if (/:remove$/.test(c)) out.add(c.replace(/:remove$/, ':delete'));
      if (/:add$/.test(c)) out.add(c.replace(/:add$/, ':create'));
      if (/:create$/.test(c)) out.add(c.replace(/:create$/, ':add'));
    }
  }

  return [...out];
}

/** 将配置的 permission（可逗号分隔）展开为所有变体 */
export function expandAllPermissionCodes(permission: string | undefined | null): string[] {
  if (!permission?.trim()) return [];
  return permission
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .flatMap(expandPermissionVariants);
}
