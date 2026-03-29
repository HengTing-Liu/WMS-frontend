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
  if (path && path !== 'noRedirect') {
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
 * @param router
 */
function setupCommonGuard(router: Router) {
  // 记录已经加载的页面
  const loadedPaths = new Set<string>();

  router.beforeEach((to) => {
    to.meta.loaded = loadedPaths.has(to.path);

    // 页面加载进度条
    if (!to.meta.loaded && preferences.transition.progress) {
      startProgress();
    }
    return true;
  });

  router.afterEach((to) => {
    // 记录页面是否加载,如果已经加载，后续的页面切换动画等效果不在重复执行

    loadedPaths.add(to.path);

    // 关闭页面加载进度条
    if (preferences.transition.progress) {
      stopProgress();
    }
  });
}

/**
 * 权限访问守卫配置
 * @param router
 */
function setupAccessGuard(router: Router) {
  router.beforeEach(async (to, from) => {
    const accessStore = useAccessStore();
    const userStore = useUserStore();
    const authStore = useAuthStore();

    // 登录页单独处理：已登录时一律跳转到首页（后端返回的第一个菜单，不写死）
    if (coreRouteNames.includes(to.name as string) && to.path === LOGIN_PATH) {
      if (accessStore.accessToken) {
        return (
          userStore.userInfo?.homePath
          || accessStore.getFirstMenuPath?.()
          || preferences.app.defaultHomePath
        );
      }
      return true;
    }

    // accessToken 检查
    if (!accessStore.accessToken) {
     
      // 明确声明忽略权限访问权限，则可以访问
      if (to.meta.ignoreAccess) {
        return true;
      }

      // 没有访问权限，跳转登录页面
      if (to.fullPath !== LOGIN_PATH) {
        const defaultPath = accessStore.getFirstMenuPath?.() || preferences.app.defaultHomePath;
        return {
          path: LOGIN_PATH,
          query:
            to.fullPath === defaultPath
              ? {}
              : { redirect: encodeURIComponent(to.fullPath) },
          // 携带当前跳转的页面，登录后重新跳转该页面
          replace: true,
        };
      }
      return to;
    }
    
      // 过期登出
      // const expires_in = accessStore.expires_in;
      // const currentTime = Date.now() / 1000;
      // if ((expires_in*1000) < currentTime) {
      //   console.log(expires_in*1000,'currentTime',currentTime);
      //   authStore.logout()
      //   return 
      //   } 
    // 是否已经生成过动态路由
    if (accessStore.isAccessChecked ) {
      return true;
    }

    // 生成路由表
    // 当前登录用户拥有的角色标识列表
    const userInfo = userStore.userInfo || (await authStore.fetchUserInfo());
    const userRoles = userInfo.roles ?? [];

    // 生成菜单和路由
    const { accessibleMenus, accessibleRoutes } = await generateAccess({
      roles: userRoles,
      router,
      // 则会在菜单中显示，但是访问会被重定向到403
      routes: accessRoutes,
    });

    // 保存菜单信息和路由信息
    accessStore.setAccessMenus(accessibleMenus);
    accessStore.setAccessRoutes(accessibleRoutes);
    accessStore.setIsAccessChecked(true);

    // 默认首页 = 后端返回的第一个可访问菜单路径（不写死）
    const firstPath = getFirstMenuPath(accessibleMenus);
    if (firstPath) accessStore.setFirstMenuPath(firstPath);
    const redirectPath =
      firstPath
      || userInfo.homePath
      || preferences.app.defaultHomePath;

    return {
      ...router.resolve(redirectPath),
      replace: true,
    };
  });
}

/**
 * 项目守卫配置
 * @param router
 */
function createRouterGuard(router: Router) {
  /** 通用 */
  setupCommonGuard(router);
  /** 权限访问 */
  setupAccessGuard(router);
}

export { createRouterGuard };
