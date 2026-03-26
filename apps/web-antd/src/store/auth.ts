import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification,message } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { decodeUserIdFromToken, getAccessCodesApi, getUserInfoApi, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);
// let sessionExpireTimer: ReturnType<typeof setTimeout> | null = null;

  // function clearSessionTimer() {
  //   if (sessionExpireTimer) {
  //     clearTimeout(sessionExpireTimer);
  //     sessionExpireTimer = null;
  //   }
  // }

  // async function handleSessionExpired() {
  //   accessStore.setAccessToken(null);
  //   if (preferences.app.loginExpiredMode === 'modal' && accessStore.isAccessChecked) {
  //     accessStore.setLoginExpired(true);
  //   } else {
  //     await logout();
  //   }
  // }

  // function startSessionTimer(time: number) {
  //   clearSessionTimer();
  //   sessionExpireTimer = setTimeout(handleSessionExpired, time);
  // }

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    // 异步处理用户登录操作并获取 accessToken
    let userInfo: null | UserInfo = null;
    
    try {
      loginLoading.value = true;
      const res = await loginApi(params);
      const { access_token, expires_in } = res;
      const accessToken = access_token;
      // 如果成功获取到 accessToken
      if (accessToken) {
        accessStore.setAccessToken(accessToken);
        // startSessionTimer(expires_in*60000)
      // 设置有效期
  
        // 获取用户信息并存储到 accessStore 中
        // const [fetchUserInfoResult, accessCodes] = await Promise.all([
        //   fetchUserInfo(),
        //   getAccessCodesApi(),
        // ]);
        userInfo = await fetchUserInfo();
        const codes = userInfo?.permissions ||[];
        
        // 优先使用后端返回的default_page，否则使用前端配置的默认首页
        const defaultPage = userInfo.default_page || preferences.app.defaultHomePath || '/query/material';
        userInfo.homePath = defaultPage;

        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(codes);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          // 检查是否有重定向参数（兼容 hash 模式）
          let redirectPath: string | undefined;
          
          // 从 window.location.hash 中获取 query 参数
          const hash = window.location.hash;
          if (hash && hash.includes('?')) {
            const queryString = hash.split('?')[1];
            const params = new URLSearchParams(queryString);
            redirectPath = params.get('redirect') || undefined;
          }
          
          // 如果没找到，再尝试从 router 中获取
          if (!redirectPath) {
            const currentRoute = router.currentRoute.value;
            redirectPath = currentRoute.query.redirect as string;
          }
          
          // 过滤掉可能404的系统路由和auth路由
          const systemPaths = ['/dashboard', '/analytics', '/workspace', '/auth'];
          if (redirectPath && systemPaths.some(p => redirectPath?.startsWith(p))) {
            console.log('[Auth] 过滤系统重定向路径:', redirectPath);
            redirectPath = undefined;
          }
          
          // 如果redirect是根路径，也使用默认首页
          if (redirectPath === '/' || redirectPath === '') {
            redirectPath = undefined;
          }
          
          // 优先使用后端返回的default_page，其次使用前端配置的默认首页
          const targetPath = redirectPath || userInfo.default_page || preferences.app.defaultHomePath || '/query/material';
          
          console.log('[Auth] 登录跳转:', targetPath);
          
          if (onSuccess) {
            await onSuccess();
          } else {
            // 使用 replace 避免历史记录问题
            await router.replace(targetPath);
          }
        }
        if (userInfo?.token) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.username}`,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }
    return {
      userInfo,
    };
  }
  const loggingOut = ref(false);//添加登出标志
  async function logout(redirect: boolean = true) {
    if (loggingOut.value) return;

    loggingOut.value = true;  
    try {
    await logoutApi();
    } catch {
      // 不做任何处理
    }
   
    // clearSessionTimer();
    resetAllStores();
    accessStore.setLoginExpired(false);
    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
    loggingOut.value = false;
  }

  async function fetchUserInfo() {
    // let userInfo: null | UserInfo = null;
    // userInfo = await getUserInfoApi();
    //  console.log(userInfo,'userInfo');
    // userStore.setUserInfo(userInfo?.user)
    // return userInfo;
    const userId = decodeUserIdFromToken(accessStore.accessToken || '');
    if (!userId) {
      throw new Error('无法从 token 中解析用户 ID');
    }
    const data = await getUserInfoApi(userId);
    data.token = accessStore.accessToken;
    data.avatar = null;
    userStore.setUserInfo(data);
    return data;
  }

  function $reset() {
    loginLoading.value = false;  
    // clearSessionTimer();
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
