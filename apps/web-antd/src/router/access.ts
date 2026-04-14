import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
} from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';
import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { getAllMenusApi } from '#/api';
import { BasicLayout, IFrameView, RouteView } from '#/layouts';
import { $t } from '#/locales';

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

function slugPath(path: unknown): string {
  return String(path ?? '')
    .replace(/^\//, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'route';
}

/**
 * Vue Router：嵌套路由不能与任意祖先同名。
 * 后端常出现父子同名（如 WmsBase），或父级无 name 导致无法在树上去重。
 * 先为缺 name 的节点补名，再在与祖先冲突时重命名当前节点。
 */
function fixRouteNameConflictsForVueRouter(
  nodes: any[],
  ancestorNames = new Set<string>(),
): any[] {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((raw, index) => {
    if (!raw || typeof raw !== 'object') return raw;
    const node = { ...raw };

    let name = node.name != null ? String(node.name).trim() : '';
    if (!name) {
      node.name = `Auto_${slugPath(node.path)}_${index}`;
      name = String(node.name);
    }

    let unique = name;
    let n = 0;
    while (ancestorNames.has(unique)) {
      n += 1;
      unique = `${name}_${slugPath(node.path)}_${n}`;
    }
    node.name = unique;

    const nextAncestors = new Set(ancestorNames);
    nextAncestors.add(unique);

    if (Array.isArray(node.children)) {
      node.children = fixRouteNameConflictsForVueRouter(node.children, nextAncestors);
    } else {
      node.children = [];
    }
    return node;
  });
}

/** 持久化后的菜单 JSON 可能把 children 变成非数组，需在走 generateRoutes 前规范化 */
function normalizeMenuTreeForRouter(nodes: unknown): any[] {
  if (!Array.isArray(nodes)) return [];
  return nodes
    .filter((n) => n != null && typeof n === 'object')
    .map((raw) => {
      const node = { ...(raw as Record<string, unknown>) };
      const ch = node.children;
      if (ch != null && !Array.isArray(ch)) {
        node.children = [];
      } else if (Array.isArray(ch)) {
        node.children = normalizeMenuTreeForRouter(ch);
      }
      return node;
    });
}

function normalizePath(path: string): string {
  if (!path) return '/';
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  const compact = withSlash.replace(/\/{2,}/g, '/');
  return compact !== '/' && compact.endsWith('/')
    ? compact.slice(0, -1)
    : compact;
}

function resolveRoutePath(parentPath: string, childPath: string): string {
  if (!childPath) return normalizePath(parentPath || '/');
  if (childPath.startsWith('/')) return normalizePath(childPath);
  return normalizePath(`${parentPath || '/'}/${childPath}`);
}

function shouldForceKeepAlive(
  fullPath: string,
  routeName?: unknown,
  component?: unknown,
): boolean {
  const path = normalizePath(fullPath);
  const name = String(routeName ?? '').toLowerCase();
  const comp = String(component ?? '').toLowerCase();

  if (path === '/sys' || path.startsWith('/sys/')) return true;
  if (path === '/system' || path.startsWith('/system/')) return true;

  if (
    [
      '/user',
      '/role',
      '/dept',
      '/menu',
      '/permission',
      '/log',
      '/log/oper',
      '/log/login',
      '/lowcode',
      '/lowcode/table',
      '/lowcode/column',
      '/lowcode/operation',
      '/lowcode/publish',
      '/lowcode/lowcode/column',
    ].includes(path)
  ) {
    return true;
  }

  if (
    [
      'tablemeta',
      'columnmeta',
      'operationmeta',
      'metapublish',
      'lowcodemanager',
      'basewarehouselist',
      'basematerial',
      'sysbase',
      'system',
    ].some((key) => name.includes(key))
  ) {
    return true;
  }

  if (
    comp.includes('/views/system/')
    || comp.includes('/views/sys/')
    || comp.startsWith('system/')
    || comp.startsWith('/system/')
    || comp.startsWith('sys/')
    || comp.startsWith('/sys/')
  ) {
    return true;
  }

  return false;
}

function applyRouteMetaPolicies(routeList: any[], parentPath = '/'): any[] {
  if (!Array.isArray(routeList)) return [];
  return routeList.map((route) => {
    const nextRoute = { ...route };
    const fullPath = resolveRoutePath(parentPath, String(nextRoute.path ?? ''));
    if (shouldForceKeepAlive(fullPath, nextRoute.name, nextRoute.component)) {
      nextRoute.meta = {
        ...(nextRoute.meta ?? {}),
        keepAlive: true,
        fullPathKey: false,
      };
    }
    if (Array.isArray(nextRoute.children) && nextRoute.children.length > 0) {
      nextRoute.children = applyRouteMetaPolicies(nextRoute.children, fullPath);
    }
    return nextRoute;
  });
}

type GenerateAccessOptions = GenerateMenuAndRoutesOptions & {
  /** 为 true 时不读本地缓存菜单，强制走接口（用于刷新后重建路由，避免坏缓存） */
  bypassMenuCache?: boolean;
};

async function generateAccess(options: GenerateAccessOptions) {
  const { bypassMenuCache, ...routerOptions } = options;
  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
    RouteView,
  };

  try {
    return await generateAccessible(preferences.app.accessMode, {
      ...routerOptions,
      fetchMenuListAsync: async () => {
        const accessStore = useAccessStore();

        // 优先从缓存读取菜单，避免重复请求
        const cached = accessStore.getCachedMenuRoutes?.();
        if (!bypassMenuCache && cached?.length > 0) {
          console.log('[Router] Using cached menu routes:', cached.length);
          message.loading({
            content: '加载缓存菜单...',
            duration: 1,
          });
          const normalizedCached = applyRouteMetaPolicies(
            normalizeMenuTreeForRouter(cached),
          );
          return fixRouteNameConflictsForVueRouter(
            normalizedCached,
          );
        }

        // 缓存不存在，请求后端
        message.loading({
          content: `${$t('common.loadingMenu')}...`,
          duration: 1.5,
        });

        let routes = normalizeMenuTreeForRouter(await getAllMenusApi());
        console.log('[Router] Raw routes from API:', routes?.length || 0);
        
        // 后端返回的菜单组件格式需要映射到前端
        // 新逻辑：只映射已存在的页面，其他跳过
        const mapComponent = (component: any) => {
          // 只处理字符串类型的组件路径
          if (typeof component !== 'string') return component;
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
            .filter(route => route?.path || (Array.isArray(route?.children) && route.children.length > 0))
            .map(route => {
              const newRoute = { ...route };
              // 确保 children 是有效数组
              if (newRoute.children && Array.isArray(newRoute.children)) {
                // 过滤掉 children 中的空对象
                newRoute.children = newRoute.children
                  .filter(child => child && typeof child === 'object' && Object.keys(child).length > 0)
                  .map(child => ({ ...child }));
                newRoute.children = filterValidRoutes(newRoute.children);
              } else {
                newRoute.children = [];
              }
              return newRoute;
            });
        };
        
        // 映射路由组件格式
        const mapRoutes = (routeList: any[], parentPath = '/'): any[] => {
          if (!Array.isArray(routeList)) return [];
          return routeList.map(route => {
            const newRoute = { ...route };
            const routePath = String(newRoute.path ?? '');
            const fullPath = resolveRoutePath(parentPath, routePath);
            // 只有 component 是字符串时才映射，函数或其他类型直接保留
            if (newRoute.component && typeof newRoute.component === 'string') {
              newRoute.component = mapComponent(newRoute.component);
            }
            if (newRoute.children) {
              newRoute.children = mapRoutes(newRoute.children, fullPath);
            }
            return newRoute;
          });
        };
        
        routes = applyRouteMetaPolicies(routes);
        routes = mapRoutes(routes);
        routes = filterValidRoutes(routes);
        routes = fixRouteNameConflictsForVueRouter(routes);
        console.log('[Router] Mapped routes:', routes?.length || 0);

        // 缓存原始菜单路由（未映射组件），用于刷新时恢复（与接口一致，含去重后的 name）
        const rawRoutes = accessStore.getCachedMenuRoutes?.() || [];
        if (!rawRoutes.length && routes.length) {
          const rawFromApi = fixRouteNameConflictsForVueRouter(
            normalizeMenuTreeForRouter(await getAllMenusApi()),
          );
          accessStore.setCachedMenuRoutes?.(rawFromApi);
        }

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
    try {
      useAccessStore().setCachedMenuRoutes([]);
    } catch {
      /* ignore */
    }
    return { accessibleMenus: [], accessibleRoutes: [] };
  }
}

export { generateAccess };
