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
          
          // 已存在的页面直接映射
          const existingPages = [
            // 布局组件
            'BasicLayout',
            'RouteView',
            'IFrameView',
            // 业务页面
            'dashboard/workspace',
            'dashboard/analytics/index',
            'system/user/index',
            'system/roleManager/index',
            'system/dept/index',
            'system/menu/index',
            'system/dict/index',
            'system/operlog/index',
            'system/logininfor/index',
            'system/serial/index',
            'basicArchive/productCategory/index',
            // 新创建的页面
            'base/permission/index',
            'base/warehouse/index',
            'base/location/index',
            'base/user/index',
            'base/dict/index',
            'lowcode/meta/index',
            'sys/supplier/index',
            'sys/material/index',
            'wms/material/index',
            'system/tableMeta/index',
            'meta/table',
          ];
          
          const normalized = component.replace(/^\/+/, '').replace(/\.vue$/i, '');
          if (existingPages.includes(normalized)) {
            // 布局组件使用动态导入，业务页面使用 #/views/ 前缀
            if (['BasicLayout', 'RouteView', 'IFrameView'].includes(normalized)) {
              return normalized;
            }
            return `../views/${normalized}.vue`;
          }
          
          // 其他页面跳过（不映射）
          console.warn('[Router] Skipping unmapped component:', component);
          return undefined;
        };
        
        // 过滤掉 component 为 undefined 的路由
        const filterValidRoutes = (routeList: any[]): any[] => {
          if (!Array.isArray(routeList)) return [];
          return routeList
            .filter(route => route.component !== undefined)
            .map(route => {
              const newRoute = { ...route };
              if (newRoute.children) {
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
