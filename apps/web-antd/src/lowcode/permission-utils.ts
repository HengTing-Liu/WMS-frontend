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

  const prefixPairs: [RegExp, string][] = [
    [/^system:warehouse:/, 'base:warehouse:'],
    [/^base:warehouse:/, 'system:warehouse:'],
    [/^system:warehouseReceiver:/, 'base:warehouseReceiver:'],
    [/^base:warehouseReceiver:/, 'system:warehouseReceiver:'],
  ];
  for (const [from, to] of prefixPairs) {
    if (from.test(trimmed)) {
      out.add(trimmed.replace(from, to));
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
