import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification,message } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { getAccessCodesApi, getUserInfoApi, loginApi, logoutApi } from '#/api';
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

  const lastPassword = ref<string | null>(null);

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
        // 记录本次登录使用的密码
        lastPassword.value = params.password as string;
        // startSessionTimer(expires_in*60000)
      // 设置有效期
  
        // 获取用户信息并存储到 accessStore 中
        // const [fetchUserInfoResult, accessCodes] = await Promise.all([
        //   fetchUserInfo(),
        //   getAccessCodesApi(),
        // ]);
        const userInfo = await fetchUserInfo();
       const codes = userInfo?.permissions ||[];

        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(codes);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          const targetPath = preferences.app.defaultHomePath || '/system/user';
          if (onSuccess) {
            await onSuccess();
          } else {
            await router.push(targetPath);
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
  async function logout(redirect: boolean = true, options?: { fromChangePwd?: boolean }) {
    if (loggingOut.value) return;

    loggingOut.value = true;  
    try {
    await logoutApi();
    } catch {
      // 不做任何处理
    }
   
    const lastUsername = userStore.userInfo?.username;
    const password = !options?.fromChangePwd ? lastPassword.value : null;
    // clearSessionTimer();
    resetAllStores();
    accessStore.setLoginExpired(false);
    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: {
        ...(redirect
          ? {
              redirect: encodeURIComponent(router.currentRoute.value.fullPath),
            }
          : {}),
        ...(lastUsername ? { username: lastUsername } : {}),
        ...(password ? { password } : {}),
        ...(options?.fromChangePwd ? { fromChangePwd: '1' } : {}),
      },
    });
    loggingOut.value = false;
  }

  async function fetchUserInfo() {
    // let userInfo: null | UserInfo = null;
    // userInfo = await getUserInfoApi();
    //  console.log(userInfo,'userInfo');
    // userStore.setUserInfo(userInfo?.user)
    // return userInfo;
    const data=await getUserInfoApi()
    data.token=accessStore.accessToken
    data.avatar=null
    userStore.setUserInfo(data)
    return data
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
