import type { BasicUserInfo } from '@vben-core/typings';

/** 用户信息 */
interface UserInfo extends BasicUserInfo {
  /**
   * 用户描述
   */
  desc: string;
  /**
   * 首页地址
   */
  homePath: string;

  /**
   * accessToken
   */
  token: string;
  permissions?: string[];

  /**
   * 真实姓名（来自 sys_user.name）
   */
  realName?: string;

}

export type { UserInfo };
