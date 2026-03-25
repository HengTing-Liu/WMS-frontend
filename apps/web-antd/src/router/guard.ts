import type { Router } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { startProgress, stopProgress } from '@vben/utils';

import { accessRoutes, coreRouteNames, fallbackNotFoundRoute } from '#/router/routes';
import { useAuthStore } from '#/store';

import { generateAccess } from './access';

/**
 * 通用守卫配置
 */
function setupCommonGuard(router: Router) {
  const loadedPaths = new Set<string>();

  router.beforeEach((to) => {
    to.meta.loaded = loadedPaths.has(to.path);
    if (!to.meta.loaded && preferences.transition.progress) {
      startProgress();
    }
    return true;
  });

  router.afterEach((to) => {
    loadedPaths.add(to.path);
    if (preferences.transition.progress) {
      stopProgress();
    }
  });
}

/**
 * 权限访问守卫配置
 */
function setupAccessGuard(router: Router) {
  let isGeneratingRoutes = false;

  router.beforeEach(async (to, from) => {
    const accessStore = useAccessStore();
    const userStore = useUserStore();
    const authStore = useAuthStore();

    console.log('[Guard] 进入守卫:', { 
      to: to.path, 
      name: to.name, 
      hasToken: !!accessStore.accessToken,
      isAccessChecked: accessStore.isAccessChecked 
    });

    // 基本路由处理
    if (coreRouteNames.includes(to.name as string)) {
      console.log('[Guard] 基本路由:', to.name, 'path:', to.path, 'hasToken:', !!accessStore.accessToken);
      
      // 已登录用户访问登录页，稍后由守卫重定向到首页
      if (to.path === LOGIN_PATH && accessStore.accessToken) {
        console.log('[Guard] 已登录用户访问登录页，继续处理');
        // 不直接返回，继续执行后续逻辑进行重定向
      } else if (to.path === '/' && accessStore.accessToken) {
        // 访问根路径且已登录，继续执行后续逻辑重定向到首页
        console.log('[Guard] 已登录用户访问根路径，继续处理');
        // 不 return，继续执行后面的逻辑
      } else if (to.path === '/' && !accessStore.accessToken) {
        // 未登录用户访问根路径，继续执行后续逻辑跳转到登录页
        console.log('[Guard] 未登录用户访问根路径，继续处理');
        // 不 return，继续执行后面的逻辑
      } else {
        // 其他基本路由直接放行
        return true;
      }
    }

    // 无 Token，跳转登录
    if (!accessStore.accessToken) {
      console.log('[Guard] 无Token，跳转登录');
      if (to.meta.ignoreAccess) {
        return true;
      }
      if (to.fullPath !== LOGIN_PATH) {
        return {
          path: LOGIN_PATH,
          query: { redirect: encodeURIComponent(to.fullPath) },
          replace: true,
        };
      }
      return to;
    }

    // 检查是否需要生成动态路由
    // 注意：动态路由通过 addRoute 添加，页面刷新后会丢失，所以需要根据 isAccessChecked 判断
    // isAccessChecked 为 true 表示用户已登录且菜单已获取，但路由可能需要重新添加
    
    if (accessStore.isAccessChecked && accessStore.accessMenus?.length > 0) {
      // 检查目标路由是否可以直接解析（可能是基本路由）
      let routeExists = false;
      try {
        const resolved = router.resolve(to);
        routeExists = resolved && resolved.name && resolved.name !== 'FallbackNotFound';
      } catch (e) {
        routeExists = false;
      }
      
      // 如果目标路由是系统路径且用户已登录，需要从用户菜单中找到有效的跳转路径
      const systemPaths = ['/dashboard', '/analytics', '/workspace', '/auth'];
      const isSystemPath = systemPaths.some(p => to.path?.startsWith(p));
      
      if (routeExists && !isSystemPath) {
        console.log('[Guard] 目标路由存在且不是系统路径，放行:', to.path);
        return true;
      }
      
      // 目标路径是系统路径或不存在，需要从用户菜单中找有效路径
      console.log('[Guard] 需要获取有效跳转路径:', { path: to.path, isSystemPath, routeExists });
      
      // 从用户菜单中找第一个有效路径
      const findFirstValidPath = (menus: any[]): string | null => {
        for (const menu of menus) {
          if (menu.children?.length > 0) {
            const childPath = findFirstValidPath(menu.children);
            if (childPath) return childPath;
          }
          if (menu.path) {
            return menu.path.startsWith('/') ? menu.path : `/${menu.path}`;
          }
        }
        return null;
      };
      
      const firstValidPath = findFirstValidPath(accessStore.accessMenus);
      
      if (firstValidPath && firstValidPath !== to.path) {
        console.log('[Guard] 跳转到用户第一个有效菜单:', firstValidPath);
        return {
          path: firstValidPath,
          replace: true,
        };
      }
      
      // 如果已经在第一个有效菜单，但路由不存在，需要重新生成
      console.log('[Guard] 已在目标路径但路由不存在，需要重新生成');
    }
    
    // 需要重新生成动态路由
    console.log('[Guard] 开始生成动态路由');
    accessStore.setIsAccessChecked(false);

    // 防止重复生成
    if (isGeneratingRoutes) {
      console.log('[Guard] 正在生成路由，等待');
      return false;
    }

    try {
      isGeneratingRoutes = true;
      console.log('[Guard] 开始生成路由');

      // 获取用户信息
      let userInfo;
      try {
        userInfo = userStore.userInfo || (await authStore.fetchUserInfo());
        console.log('[Guard] 获取用户信息成功');
      } catch (e) {
        console.log('[Guard] 获取用户信息失败，跳转登录');
        accessStore.setAccessToken(null);
        accessStore.setIsAccessChecked(false);
        return {
          path: LOGIN_PATH,
          query: { redirect: encodeURIComponent(to.fullPath) },
          replace: true,
        };
      }

      const userRoles = userInfo?.roles ?? [];

      // 生成菜单和路由
      let result;
      try {
        result = await generateAccess({
          roles: userRoles,
          router,
          routes: accessRoutes,
        });
        console.log('[Guard] 生成路由成功，菜单数:', result.accessibleMenus?.length);
      } catch (e) {
        console.log('[Guard] 生成路由失败:', e);
        accessStore.setAccessToken(null);
        accessStore.setIsAccessChecked(false);
        return {
          path: LOGIN_PATH,
          query: { redirect: encodeURIComponent(to.fullPath) },
          replace: true,
        };
      }

      // 检查菜单是否为空
      if (!result.accessibleMenus || result.accessibleMenus.length === 0) {
        console.log('[Guard] 菜单为空，跳转登录');
        accessStore.setAccessToken(null);
        accessStore.setIsAccessChecked(false);
        return {
          path: LOGIN_PATH,
          query: { redirect: encodeURIComponent(to.fullPath) },
          replace: true,
        };
      }

      // 保存路由信息
      accessStore.setAccessMenus(result.accessibleMenus);
      accessStore.setAccessRoutes(result.accessibleRoutes);
      accessStore.setIsAccessChecked(true);

      // 关键：添加动态路由到 Root 的 children 中
      if (result.accessibleRoutes && result.accessibleRoutes.length > 0) {
        console.log('[Guard] 添加动态路由到 Root:', result.accessibleRoutes.length, '条');
        result.accessibleRoutes.forEach((route: any) => {
          if (!router.hasRoute(route.name)) {
            // 添加到 Root 路由的 children 中
            router.addRoute('Root', route);
          }
        });
      }

      // 关键：添加 404 路由到 Root 的 children 中，确保它只匹配未找到的路由
      if (!router.hasRoute(fallbackNotFoundRoute.name)) {
        console.log('[Guard] 添加 404 路由到 Root');
        router.addRoute('Root', fallbackNotFoundRoute);
      }

      console.log('[Guard] 路由已保存，准备跳转');
      
      // 从用户菜单中找第一个有效的跳转路径
      const findFirstValidPath = (menus: any[]): string | null => {
        for (const menu of menus) {
          if (menu.children?.length > 0) {
            const childPath = findFirstValidPath(menu.children);
            if (childPath) return childPath;
          }
          if (menu.path) {
            return menu.path.startsWith('/') ? menu.path : `/${menu.path}`;
          }
        }
        return null;
      };
      
      const firstValidPath = findFirstValidPath(result.accessibleMenus || []);
      console.log('[Guard] 第一个有效菜单路径:', firstValidPath);
      
      // 确定目标路径
      const systemPaths = ['/dashboard', '/analytics', '/workspace', '/auth'];
      let targetPath = (to.query.redirect || to.fullPath) as string;
      
      // 如果是系统路径或目标路由不存在，使用第一个有效菜单
      const isSystemPath = systemPaths.some(p => targetPath?.startsWith(p));
      let targetRouteExists = false;
      try {
        const resolved = router.resolve(targetPath);
        targetRouteExists = resolved && resolved.name && resolved.name !== 'FallbackNotFound';
      } catch (e) {
        targetRouteExists = false;
      }
      
      if ((isSystemPath || !targetRouteExists) && firstValidPath) {
        targetPath = firstValidPath;
      }
      
      console.log('[Guard] 最终跳转路径:', targetPath);
      
      // 如果当前路径就是目标路径，需要重新导航以触发路由重新匹配
      if (to.path === targetPath) {
        console.log('[Guard] 已在目标路径，重新导航以匹配新路由');
        return {
          path: targetPath,
          replace: true,
        };
      }
      
      // 跳转到目标路径
      console.log('[Guard] 跳转到:', targetPath);
      return {
        path: targetPath,
        replace: true,
      };
    } finally {
      isGeneratingRoutes = false;
    }
  });
}

function createRouterGuard(router: Router) {
  setupCommonGuard(router);
  setupAccessGuard(router);
}

export { createRouterGuard };
