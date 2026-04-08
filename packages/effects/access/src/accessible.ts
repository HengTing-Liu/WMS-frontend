import type { Component, DefineComponent } from 'vue';

import type {
  AccessModeType,
  GenerateMenuAndRoutesOptions,
  RouteRecordRaw,
} from '@vben/types';

import { defineComponent, h } from 'vue';
import {
  cloneDeep,
  generateMenus,
  generateRoutesByBackend,
  generateRoutesByFrontend,
  isFunction,
  isString,
  mapTree,
} from '@vben/utils';

/** Vue Router addRoute 会假定 children 为数组；非数组或含脏节点时会读 children[0] 抛错 */
function sanitizeRouteRecord(route: RouteRecordRaw): RouteRecordRaw {
  const r = { ...route } as RouteRecordRaw;
  if (r.children != null) {
    if (!Array.isArray(r.children)) {
      delete r.children;
    } else {
      r.children = r.children
        .filter((c) => c != null && typeof c === 'object')
        .map((c) => sanitizeRouteRecord(c as RouteRecordRaw));
    }
  }
  return r;
}

function sanitizeRouteList(routes: RouteRecordRaw[]): RouteRecordRaw[] {
  if (!Array.isArray(routes)) return [];
  return routes.map((item) => sanitizeRouteRecord(item));
}

function routeNameToKey(name: unknown): string {
  if (name == null) return '';
  if (typeof name === 'symbol') return name.description ?? 'sym';
  return String(name).trim();
}

/**
 * 后端/convertRoutes 后仍可能出现父子同名（如 WmsBase），addRoute 会抛错。
 * 在注册到 Router 前对最终路由树再处理一遍。
 */
function fixAncestorRouteNames(
  routes: RouteRecordRaw[],
  ancestorNames = new Set<string>(),
): RouteRecordRaw[] {
  if (!Array.isArray(routes)) return [];
  return routes.map((raw, index) => {
    const route = { ...raw } as RouteRecordRaw;
    let nameKey = routeNameToKey(route.name);
    if (!nameKey) {
      const slug =
        String(route.path ?? '')
          .replace(/^\//, '')
          .replace(/[^a-zA-Z0-9]+/g, '_') || `r${index}`;
      nameKey = `Auto_${slug}_${index}`;
      route.name = nameKey;
    }

    let unique = nameKey;
    let n = 0;
    const pathSlug =
      String(route.path ?? '')
        .replace(/\//g, '_')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'p';
    while (ancestorNames.has(unique)) {
      n += 1;
      unique = `${nameKey}_${pathSlug}_${n}`;
    }
    route.name = unique as RouteRecordRaw['name'];

    const next = new Set(ancestorNames);
    next.add(unique);

    if (Array.isArray(route.children) && route.children.length > 0) {
      route.children = fixAncestorRouteNames(
        route.children as RouteRecordRaw[],
        next,
      );
    } else if (route.children != null && !Array.isArray(route.children)) {
      delete route.children;
    }

    return route;
  });
}

async function generateAccessible(
  mode: AccessModeType,
  options: GenerateMenuAndRoutesOptions,
) {
  const { router } = options;

  options.routes = cloneDeep(options.routes);
  // 生成路由
  let accessibleRoutes = await generateRoutes(mode, options);
  accessibleRoutes = sanitizeRouteList(accessibleRoutes);
  accessibleRoutes = fixAncestorRouteNames(accessibleRoutes);

  const root = router.getRoutes().find((item) => item.path === '/');

  // 持久化恢复或异常数据可能导致 children 非数组，Vue Router addRoute 内部会读 children[0] 报错
  if (root && !Array.isArray(root.children)) {
    root.children = [];
  }

  // 获取已有的路由名称列表
  const names = root?.children?.map((item) => item.name) ?? [];

  // 动态添加到router实例内
  accessibleRoutes.forEach((rawRoute) => {
    const route = sanitizeRouteRecord(rawRoute);
    if (root && !route.meta?.noBasicLayout) {
      // 为了兼容之前的版本用法，如果包含子路由，则将component移除，以免出现多层BasicLayout
      // 如果你的项目已经跟进了本次修改，移除了所有自定义菜单首级的BasicLayout，可以将这段if代码删除
      if (Array.isArray(route.children) && route.children.length > 0) {
        delete route.component;
      }
      // 根据router name判断，如果路由已经存在，则不再添加
      if (names?.includes(route.name)) {
        // 找到已存在的路由索引并更新，不更新会造成切换用户时，一级目录未更新，homePath 在二级目录导致的404问题
        const index = root.children?.findIndex(
          (item) => item.name === route.name,
        );
        if (index !== undefined && index !== -1 && root.children) {
          root.children[index] = route;
        }
      } else {
        root.children?.push(route);
      }
    } else {
      router.addRoute(route);
    }
  });

  if (root) {
    if (Array.isArray(root.children)) {
      root.children = sanitizeRouteList(root.children as RouteRecordRaw[]);
    }
    if (root.name) {
      router.removeRoute(root.name);
    }
    router.addRoute(root);
  }

  // 生成菜单
  const accessibleMenus = generateMenus(accessibleRoutes, options.router);
  // console.log(accessibleMenus, 'accessibleMenus--菜单');
  // console.log(accessibleRoutes, 'accessibleRoutes--路由');

  return { accessibleMenus, accessibleRoutes };
}

/**
 * Generate routes
 * @param mode
 * @param options
 */
async function generateRoutes(
  mode: AccessModeType,
  options: GenerateMenuAndRoutesOptions,
) {
  const { forbiddenComponent, roles, routes } = options;

  let resultRoutes: RouteRecordRaw[] = routes;
  switch (mode) {
    case 'backend': {
   
      resultRoutes = await generateRoutesByBackend(options);
      break;
    }
    case 'frontend': {
      resultRoutes = await generateRoutesByFrontend(
        routes,
        roles || [],
        forbiddenComponent,
      );
      break;
    }
    case 'mixed': {
      const [frontend_resultRoutes, backend_resultRoutes] = await Promise.all([
        generateRoutesByFrontend(routes, roles || [], forbiddenComponent),
        generateRoutesByBackend(options),
      ]);

      resultRoutes = [...frontend_resultRoutes, ...backend_resultRoutes];
      break;
    }
  }

  /**
   * 调整路由树，做以下处理：
   * 1. 对未添加redirect的路由添加redirect
   * 2. 将懒加载的组件名称修改为当前路由的名称（如果启用了keep-alive的话）
   */
  resultRoutes = mapTree(resultRoutes, (route) => {
    // 重新包装component，使用与路由名称相同的name以支持keep-alive的条件缓存。
    if (
      route.meta?.keepAlive &&
      isFunction(route.component) &&
      route.name &&
      isString(route.name)
    ) {
      const originalComponent = route.component as () => Promise<{
        default: Component | DefineComponent;
      }>;
      route.component = async () => {
        const component = await originalComponent();
        if (!component.default) return component;
        return defineComponent({
          name: route.name as string,
          setup(props, { attrs, slots }) {
            return () => h(component.default, { ...props, ...attrs }, slots);
          },
        });
      };
    }

    // 如果有 redirect 或没有有效子路由数组，则直接返回（children 可能是持久化后的非数组脏数据）
    if (
      route.redirect ||
      !Array.isArray(route.children) ||
      route.children.length === 0
    ) {
      return route;
    }
    const firstChild = route.children[0];

    // 如果子路由不是以/开头，则直接返回,这种情况需要计算全部父级的path才能得出正确的path，这里不做处理
    if (!firstChild?.path || !firstChild.path.startsWith('/')) {
      return route;
    }

    route.redirect = firstChild.path;
    return route;
  });
  return resultRoutes;
}

export { generateAccessible };
