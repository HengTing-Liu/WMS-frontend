import type { Router } from 'vue-router';

import type { MenuRecordRaw } from '@vben-core/typings';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { startProgress, stopProgress } from '@vben/utils';

import { accessRoutes, coreRouteNames } from '#/router/routes';
import { useAuthStore } from '#/store';

import { generateAccess } from './access';

/** 从后端返回的菜单树中取第一个可访问的叶子路径（用作默认首页，不写死） */
function getFirstMenuPath(menus: MenuRecordRaw[]): string | null {
  if (!menus?.length) return null;
  const first = menus[0];
  const path = first?.path?.trim();
  if (path && path !== 'noRedirect' && !(path === '/' && first.redirect === 'noRedirect')) {
    if (first.children?.length) {
      const childPath = getFirstMenuPath(first.children);
      if (childPath) return childPath;
    }
    return path;
  }
  if (first.children?.length) return getFirstMenuPath(first.children);
  return menus.length > 1 ? getFirstMenuPath(menus.slice(1)) : null;
}

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
  router.beforeEach(async (to, _from) => {
    const accessStore = useAccessStore();
    const userStore = useUserStore();
    const authStore = useAuthStore();
    const canResolveToTarget = () => {
      const resolved = router.resolve(to.fullPath);
      return resolved.matched?.some((m) => m.name !== 'FallbackNotFound');
    };

    // ---- 已登录，访问登录页 -> 跳首页 ----
    if (coreRouteNames.includes(to.name as string) && to.path === LOGIN_PATH) {
      if (accessStore.accessToken) {
        // 优先使用前端配置的首页，不依赖后端用户 homePath
        return (
          preferences.app.defaultHomePath
          || accessStore.getFirstMenuPath?.()
        );
      }
      return true;
    }

    // ---- 无 token -> 跳登录 ----
    if (!accessStore.accessToken) {
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

    // ---- 已登录但 Vue Router 里没有该路由（刷新后动态路由丢失） ----
    if (accessStore.isAccessChecked && accessStore.accessRoutes?.length > 0) {
      // Use router.resolve to determine whether current target is routable.
      // Path/name exact comparisons are unreliable for nested/aliased backend routes
      // (for example lowcode tabs), and can cause unnecessary dynamic-route regeneration.
      const routeExists = canResolveToTarget();

      if (!routeExists) {
        console.log('[Router] Route not found in Vue Router, regenerating...');
        const userInfo = userStore.userInfo || (await authStore.fetchUserInfo());
        const userRoles = userInfo.roles ?? [];

        const result = await generateAccess({
          roles: userRoles,
          router,
          routes: accessRoutes,
          bypassMenuCache: true,
        });

        const menus = result?.accessibleMenus ?? [];
        const routes = result?.accessibleRoutes ?? [];
        if (routes.length > 0) {
          accessStore.setAccessMenus(menus);
          accessStore.setAccessRoutes(routes);

          // Dynamic routes were regenerated: if current target now exists, stay on it.
          if (canResolveToTarget()) {
            return {
              path: to.path,
              query: to.query,
              hash: to.hash,
              replace: true,
            };
          }

          const fp = getFirstMenuPath(menus);
          if (fp) {
            const afterRoutes = router.getRoutes();
            const fpExists = afterRoutes.some(
              (r) => r.path === fp || r.name === fp
            );
            if (fpExists) {
              accessStore.setFirstMenuPath(fp);
              return { path: fp, replace: true };
            }
          }
          // 新算出的 firstPath 也不在 Vue Router 里？回 login
          accessStore.setCachedMenuRoutes([]);
          accessStore.setAccessRoutes([]);
          accessStore.setIsAccessChecked(false);
          return {
            path: LOGIN_PATH,
            query: { redirect: encodeURIComponent(to.fullPath) },
            replace: true,
          };
        }

        accessStore.setCachedMenuRoutes([]);
        accessStore.setAccessRoutes([]);
        accessStore.setIsAccessChecked(false);
        return {
          path: LOGIN_PATH,
          query: { redirect: encodeURIComponent(to.fullPath) },
          replace: true,
        };
      }

      return true;
    }

    // ---- 首次访问，生成动态路由 ----
    const userInfo = userStore.userInfo || (await authStore.fetchUserInfo());
    const userRoles = userInfo.roles ?? [];

    const gen = await generateAccess({
      roles: userRoles,
      router,
      routes: accessRoutes,
    });

    const accessibleMenus = gen?.accessibleMenus ?? [];
    const accessibleRoutes = gen?.accessibleRoutes ?? [];

    if (!accessibleRoutes.length) {
      accessStore.setCachedMenuRoutes([]);
      accessStore.setIsAccessChecked(false);
      return {
        path: LOGIN_PATH,
        query: { redirect: encodeURIComponent(to.fullPath) },
        replace: true,
      };
    }

    accessStore.setAccessMenus(accessibleMenus);
    accessStore.setAccessRoutes(accessibleRoutes);
    accessStore.setIsAccessChecked(true);

    // After first-time dynamic route generation, keep the original refresh target when possible.
    if (canResolveToTarget()) {
      return {
        path: to.path,
        query: to.query,
        hash: to.hash,
        replace: true,
      };
    }

    // 优先使用配置的后台首页（不依赖后端菜单顺序）
    const finalPath = preferences.app.defaultHomePath;
    const finalRoutes = router.getRoutes();
    const finalExists = finalRoutes.some(
      (r) => r.path === finalPath || r.name === finalPath
    );
    if (finalExists) {
      accessStore.setFirstMenuPath(finalPath);
      return { path: finalPath, replace: true };
    }

    // 如果配置的首页不存在，再尝试后端菜单的第一个路径
    const firstPath = getFirstMenuPath(accessibleMenus);

    // 验证 firstPath 是否真的在 Vue Router 里（不是 localStorage 里残留的旧路径）
    if (firstPath) {
      const afterRoutes = router.getRoutes();
      const fpExists = afterRoutes.some(
        (r) => r.path === firstPath || r.name === firstPath
      );
      if (fpExists) {
        accessStore.setFirstMenuPath(firstPath);
        return { path: firstPath, replace: true };
      }
    }

    //兜底路径也不存在：回到登录页
    accessStore.setFirstMenuPath(null);
    return {
      path: LOGIN_PATH,
      query: { redirect: encodeURIComponent(to.fullPath) },
      replace: true,
    };
  });
}

/**
 * 项目守卫配置
 */
function createRouterGuard(router: Router) {
  setupCommonGuard(router);
  setupAccessGuard(router);
}

export { createRouterGuard };
