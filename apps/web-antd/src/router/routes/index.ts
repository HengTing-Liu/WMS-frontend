import type { RouteRecordRaw } from 'vue-router';

import { traverseTreeValues } from '@vben/utils';

import { coreRoutes, fallbackNotFoundRoute } from './core';

/** 外部路由列表，可按需扩展 */
const externalRoutes: RouteRecordRaw[] = [];

/** 路由列表：基础路由 + 外部路由 + 404 兜底 */
const routes: RouteRecordRaw[] = [
  ...coreRoutes,
  ...externalRoutes,
  fallbackNotFoundRoute,
];

/** 基础路由列表，这些路由不需要进入权限拦截 */
const coreRouteNames = traverseTreeValues(coreRoutes, (route) => route.name);

/** 权限路由列表：统一使用后端菜单动态生成 */
const accessRoutes: RouteRecordRaw[] = [];

export { accessRoutes, coreRouteNames, routes };
