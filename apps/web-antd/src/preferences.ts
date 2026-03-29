import { defineOverridesPreferences } from '@vben/preferences';
import logo from './assets/logo.png';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    // 侧边栏 logo 只展示图片，不需要文字标题
    name: '',
    // accessMode:'frontend',
    accessMode: 'backend',
    // 登录后默认首页：优先使用后端返回的第一个菜单路径，无菜单时用此兜底
    defaultHomePath: '/system/user',
  },
  // 全局 logo 配置：使用本地图片，侧边栏与顶部统一
  logo: {
    enable: true,
    fit: 'contain',
    source: logo,
  },
  theme: {
    mode: 'light',
  },
});
