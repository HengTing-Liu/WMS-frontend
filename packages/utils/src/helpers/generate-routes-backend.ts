import type { RouteRecordRaw } from 'vue-router';

import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
  RouteRecordStringComponent,
} from '@vben-core/typings';

import { mapTree } from '@vben-core/shared/utils';

/**
 * 动态生成路由 - 后端方式
 */
async function generateRoutesByBackend(
  options: GenerateMenuAndRoutesOptions,
): Promise<RouteRecordRaw[]> {
  const { fetchMenuListAsync, layoutMap = {}, pageMap = {} } = options;

  try {
    // 备注：此处通过 options.fetchMenuListAsync 统一获取菜单：
    // - 登录时：实际请求后端，并写入缓存
    // - 刷新时：优先返回缓存，避免重复请求
    const menuRoutes = await fetchMenuListAsync?.();

    if (!menuRoutes) {
      return [];
    }
    const normalizePageMap: ComponentRecordType = {};

    for (const [key, value] of Object.entries(pageMap)) {
      normalizePageMap[normalizeViewPath(key)] = value;
    }
    const routes = convertRoutes(menuRoutes, layoutMap, normalizePageMap);

    return routes;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/** 后端菜单常漏传 name（如 ParentView/RouteView 父级），Vue Router 动态 addRoute 会异常，需兜底生成 */
function ensureRouteName(node: RouteRecordStringComponent, route: RouteRecordRaw): string {
  const existing = (node as any).name ?? (route as any).name;
  if (existing != null && String(existing).trim() !== '') {
    return String(existing);
  }
  const pathStr = String((node as any).path ?? '').trim();
  const slug = pathStr
    .replace(/^\//, '')
    .replace(/:([^/]+)/g, '_$1')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const generated = slug ? `Auto_${slug}` : `Auto_route_${Math.random().toString(36).slice(2, 11)}`;
  (route as any).name = generated;
  return generated;
}

function convertRoutes(
  routes: RouteRecordStringComponent[],
  layoutMap: ComponentRecordType,
  pageMap: ComponentRecordType,
): RouteRecordRaw[] {
  return mapTree(routes, (node) => {
    const route = node as unknown as RouteRecordRaw;
    const { component } = node;

    ensureRouteName(node, route);

    // layout转换
    if (component && layoutMap[component]) {
      route.component = layoutMap[component];
      // 页面组件转换
    } else if (component) {
      const normalizePath = normalizeViewPath(component);
      const pageKey = normalizePath.endsWith('.vue')
        ? normalizePath
        : `${normalizePath}.vue`;
      if (pageMap[pageKey]) {
        route.component = pageMap[pageKey];
      } else {
        console.error(`route component is invalid: ${pageKey}`, route);
        route.component = pageMap['/_core/fallback/not-found.vue'];
      }
    }

    return route;
  });
}

function normalizeViewPath(path: string): string {
  // 去除相对路径前缀
  const normalizedPath = path.replace(/^(\.\/|\.\.\/)+/, '');

  // 确保路径以 '/' 开头
  const viewPath = normalizedPath.startsWith('/')
    ? normalizedPath
    : `/${normalizedPath}`;

  // 这里耦合了vben-admin的目录结构
  return viewPath.replace(/^\/views/, '');
}
export { generateRoutesByBackend };
