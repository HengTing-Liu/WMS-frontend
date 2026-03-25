import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
} from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';

import { message } from 'ant-design-vue';

import { getAllMenusApi } from '#/api';
import { BasicLayout, IFrameView } from '#/layouts';
import { $t } from '#/locales';

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');
  
  // 调试：打印 pageMap 的键
  console.log('[Access] pageMap keys:', Object.keys(pageMap).slice(0, 10));

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  return await generateAccessible(preferences.app.accessMode, {
    ...options,
    fetchMenuListAsync: async () => {
      message.loading({
        content: `${$t('common.loadingMenu')}...`,
        duration: 1.5,
      });
      try {
        const result = await getAllMenusApi();
        // 处理不同的返回格式
        let routes = Array.isArray(result) ? result : (result?.data || result?.rows || []);
        
        console.log('[Access] 原始菜单数:', routes.length);
        
        // 找出所有父菜单ID
        const parentIds = new Set(routes.map((r: any) => r.parentId).filter((id: any) => id && id !== 0));
        
        // 过滤掉按钮权限（menuType='F'），只保留菜单
        routes = routes.filter((route: any) => route.menuType !== 'F');
        
        // 构建树形结构
        const routeMap = new Map();
        routes.forEach((route: any) => {
          routeMap.set(route.menuId, { ...route, children: [] });
        });
        
        const tree: any[] = [];
        routes.forEach((route: any) => {
          const node = routeMap.get(route.menuId);
          if (route.parentId === 0 || !route.parentId) {
            tree.push(node);
          } else {
            const parent = routeMap.get(route.parentId);
            if (parent) {
              parent.children.push(node);
            }
          }
        });
        
        // 转换格式
        const convertRoute = (route: any, parentPath: string = ''): any => {
          const hasChildren = route.children && route.children.length > 0;
          const isTopLevel = route.parentId === 0 || !route.parentId;
          
          // 处理路径：去掉父路径前缀，只保留相对路径
          let routePath = route.path || '';
          if (parentPath && routePath.startsWith(parentPath + '/')) {
            routePath = routePath.substring(parentPath.length + 1);
          }
          
          // 如果路径为空且是目录，使用空字符串（Vue Router会处理）
          if (!routePath && (isTopLevel || hasChildren)) {
            routePath = route.routeName?.toLowerCase() || '';
          }
          
          return {
            name: route.routeName || route.menuName,
            path: routePath,
            component: isTopLevel || hasChildren 
              ? 'BasicLayout' 
              : (route.component || 'BasicLayout'),
            meta: {
              title: route.menuName,
              icon: route.icon,
              keepAlive: route.isCache === '1',
            },
            children: hasChildren 
              ? route.children.map((c: any) => convertRoute(c, route.path)) 
              : undefined,
          };
        };
        
        const finalRoutes = tree.map((route: any) => convertRoute(route, ''));
        
        console.log('[Access] 处理后的菜单:', finalRoutes.length, '条');
        console.log('[Access] 第一条:', finalRoutes[0]?.name, finalRoutes[0]?.component);
        
        // 调试：打印基础设置模块的路由
        const baseRoute = finalRoutes.find((r: any) => r.name === 'WmsBase');
        if (baseRoute) {
          console.log('[Access] 基础设置模块路由:', {
            name: baseRoute.name,
            path: baseRoute.path,
            children: baseRoute.children?.map((c: any) => ({ 
              name: c.name, 
              path: c.path,
              component: c.component,
              fullPath: `${baseRoute.path}/${c.path}`
            })),
          });
          
          // 检查仓库管理路由的组件
          const warehouseRoute = baseRoute.children?.find((c: any) => c.name === 'BaseWarehouse');
          if (warehouseRoute) {
            console.log('[Access] 仓库管理路由组件:', warehouseRoute.component);
            console.log('[Access] pageMap 中是否存在: ', Object.keys(pageMap).some(k => k.includes('warehouse')));
          }
        }
        
        // 调试：打印所有路由的组件信息
        console.log('[Access] 所有路由组件:', finalRoutes.map((r: any) => ({
          name: r.name,
          component: r.component,
          children: r.children?.map((c: any) => ({ name: c.name, component: c.component }))
        })));
        
        return finalRoutes;
      } catch (error: any) {
        console.error('[Access] 获取菜单失败:', error);
        return [];
      }
    },
    forbiddenComponent,
    layoutMap,
    pageMap,
  });
}

export { generateAccess };
