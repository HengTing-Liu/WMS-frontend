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

// 记录 backend 模式下添加的动态路由，用于清理
const dynamicRouteNames = new Set<string>();

async function generateAccessible(
  mode: AccessModeType,
  options: GenerateMenuAndRoutesOptions,
) {
  const { router } = options;

  options.routes = cloneDeep(options.routes);
  // 生成路由
  const accessibleRoutes = await generateRoutes(mode, options);

  // backend 模式下，先清理之前添加的动态路由
  if (mode === 'backend') {
    dynamicRouteNames.forEach((name) => {
      if (router.hasRoute(name)) {
        router.removeRoute(name);
      }
    });
    dynamicRouteNames.clear();
  }

  // 获取根路由
  const root = router.getRoutes().find((item) => item.path === '/');

  // 获取已有的路由名称列表
  const existingNames = root?.children?.map((item) => item.name) ?? [];

  // 添加路由
  accessibleRoutes.forEach((route) => {
    // 检查 component 是否有效
    if (!route.component && !route.children) {
      console.error('路由缺少 component:', route.path, route.name);
    }
    
    if (mode === 'backend') {
      // backend 模式：使用 addRoute 直接添加，不检查重复
      if (!route.meta?.noBasicLayout && root) {
        // 删除顶级路由的 component，避免 Layout 嵌套
        // root 本身已经是 BasicLayout，子路由不需要再包装 Layout
        const routeToAdd = { ...route };
        if (routeToAdd.children && routeToAdd.children.length > 0) {
          delete routeToAdd.component;
        }
        router.addRoute(root.name as string, routeToAdd);
      } else {
        router.addRoute(route);
      }
      // 记录添加的路由
      if (route.name) {
        dynamicRouteNames.add(route.name as string);
      }
    } else {
      // frontend/mixed 模式：原逻辑，检查重复
      if (root && !route.meta?.noBasicLayout) {
        if (route.children && route.children.length > 0 && route.component) {
          if (existingNames?.includes(route.name)) {
            delete route.component;
          }
        }
        if (existingNames?.includes(route.name)) {
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
    }
  });

  // 生成菜单
  const accessibleMenus = generateMenus(accessibleRoutes, options.router);

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

    // 如果有redirect或者没有子路由，则直接返回
    if (route.redirect || !route.children || route.children.length === 0) {
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
