import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
} from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';

import { message } from 'ant-design-vue';

import { getAllMenusApi } from '#/api';
import { BasicLayout, IFrameView, RouteView } from '#/layouts';
import { $t } from '#/locales';
// 备注：引入 accessStore，用于读取/写入菜单路由缓存

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
    RouteView,
  };
  
  // 备注：获取 accessStore 实例，准备读取菜单缓存

  // 添加错误处理包装
  try {
    return await generateAccessible(preferences.app.accessMode, {
      ...options,
      fetchMenuListAsync: async () => {
     
        message.loading({
          content: `${$t('common.loadingMenu')}...`,
          duration: 1.5,
        });
        
        let routes = await getAllMenusApi(); console.log("[Router] Raw routes:", JSON.stringify(routes, null, 2));
        
        // 后端返回的菜单组件格式需要映射到前端
        // 新逻辑：只映射已存在的页面，其他跳过
        const mapComponent = (component: string) => {
          if (!component) return undefined;
          
          // 布局组件映射
          if (component === 'Layout') return 'BasicLayout';
          if (component === 'ParentView') return 'RouteView';
          if (component === 'InnerLink') return 'IFrameView';
          
          // 规范化路径：去除前导斜杠和 .vue 后缀
          const normalized = component.replace(/^\/+/, '').replace(/\.vue$/i, '');
          
          // 布局组件直接返回名称
          if (['BasicLayout', 'RouteView', 'IFrameView'].includes(normalized)) {
            return normalized;
          }
          
          // 其他所有路径都映射到 views 目录
          // 例如: sys/warehouse/index -> ../views/sys/warehouse/index.vue
          return `../views/${normalized}.vue`;
        };
        
        // 过滤掉无效的路由（没有 path 且没有有效 children 的路由）
        const filterValidRoutes = (routeList: any[]): any[] => {
          if (!Array.isArray(routeList)) return [];
          return routeList
            .filter(route => route?.path || (route?.children && route.children.length > 0))
            .map(route => {
              const newRoute = { ...route };
              // 递归过滤 children
              if (newRoute.children) {
                // 过滤掉 children 中的空对象
                newRoute.children = newRoute.children
                  .filter(child => child && Object.keys(child).length > 0)
                  .map(child => ({ ...child }));
                newRoute.children = filterValidRoutes(newRoute.children);
              }
              return newRoute;
            });
        };
        
        // 映射路由组件格式
        const mapRoutes = (routeList: any[]): any[] => {
          if (!Array.isArray(routeList)) return [];
          return routeList.map(route => {
            const newRoute = { ...route };
            if (newRoute.component) {
              newRoute.component = mapComponent(newRoute.component);
            }
            if (newRoute.children) {
              newRoute.children = mapRoutes(newRoute.children);
            }
            return newRoute;
          });
        };
        
        routes = mapRoutes(routes);
        routes = filterValidRoutes(routes);
        console.log('[Router] Mapped routes:', routes?.length || 0);
        
        // 备注：写入缓存，供后续刷新直接使用
        
        return routes;
      },
      // 可以指定没有权限跳转403页面
      forbiddenComponent,
      // 如果 route.meta.menuVisibleWithForbidden = true
      layoutMap,
      pageMap,
    });
  } catch (error) {
    console.error('[Router] generateAccessible error:', error);
    // 返回空路由，避免崩溃
    return { routes: [], menuApps: [] };
  }
}

export { generateAccess };
