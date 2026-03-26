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

function convertRoutes(
  routes: RouteRecordStringComponent[],
  layoutMap: ComponentRecordType,
  pageMap: ComponentRecordType,
): RouteRecordRaw[] {
  return mapTree(routes, (node) => {
    const route = node as unknown as RouteRecordRaw;
    const { component, name, redirect } = node;

    if (!name) {
      console.error('route name is required', route);
    }

    // 处理 redirect 字段
    if (redirect && typeof redirect === 'string') {
      route.redirect = redirect;
    }

    // 处理 component 为 null、undefined 或 "#" 的情况
    if (!component || component === '#' || component === '') {
      // 如果有子菜单，说明是目录，不设置 component
      // 如果没有子菜单，设置为 404
      if (!route.children || route.children.length === 0) {
        route.component = pageMap['/_core/fallback/not-found.vue'];
      }
      return route;
    }

    // layout转换 - 支持 "Layout" 映射到 BasicLayout
    if (component === 'Layout' || component === 'BasicLayout') {
      if (layoutMap['BasicLayout']) {
        route.component = layoutMap['BasicLayout'];
      } else if (layoutMap['Layout']) {
        route.component = layoutMap['Layout'];
      }
    } else if (component && layoutMap[component]) {
      route.component = layoutMap[component];
      // 页面组件转换
    } else if (typeof component === 'string' && component) {
      // 处理 #/views/... 路径
      const normalizedPath = normalizeViewPath(component);
      const pageKey = normalizedPath.endsWith('.vue')
        ? normalizedPath
        : `${normalizedPath}.vue`;
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

function normalizeViewPath(path: unknown): string {
  if (typeof path !== 'string') return '';
  // 处理 #/views/... 这种路径格式
  const pathWithoutHash = path.replace(/^#/, '');

  // 去除相对路径前缀
  const normalizedPath = pathWithoutHash.replace(/^(\.\/|\.\.\/)+/, '');

  // 确保路径以 '/' 开头
  const viewPath = normalizedPath.startsWith('/')
    ? normalizedPath
    : `/${normalizedPath}`;

  // 这里耦合了vben-admin的目录结构
  return viewPath.replace(/^\/views/, '');
}
export { generateRoutesByBackend };
