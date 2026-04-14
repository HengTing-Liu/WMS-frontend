import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
} from '@vben/types';

import { generateAccessible } from '@vben/access';
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
  return compact !== '/' && compact.endsWith('/') ? compact.slice(0, -1) : compact;
}

function resolveRoutePath(parentPath: string, childPath: string): string {
  if (!childPath) return normalizePath(parentPath || '/');
  if (childPath.startsWith('/')) return normalizePath(childPath);
  return normalizePath(`${parentPath || '/'}${parentPath.endsWith('/') ? '' : '/'}${childPath}`);
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
    return await generateAccessible('backend', {
      ...routerOptions,
      fetchMenuListAsync: async () => {
        const accessStore = useAccessStore();

        const cached = accessStore.getCachedMenuRoutes?.();
        if (!bypassMenuCache && cached?.length > 0) {
          console.log('[Router] Cached menu routes detected, validating against backend...');
        }

        message.loading({
          content: `${$t('common.loadingMenu')}...`,
          duration: 1.5,
        });

        let routes = normalizeMenuTreeForRouter(await getAllMenusApi());
        console.log('[Router] Raw routes from API:', routes?.length || 0);

        const mapComponent = (component: any) => {
          if (typeof component !== 'string') return component;
          if (!component) return undefined;

          if (component === 'Layout') return 'BasicLayout';
          if (component === 'ParentView') return 'RouteView';
          if (component === 'InnerLink') return 'IFrameView';

          const normalized = component.replace(/^\/+/, '').replace(/\.vue$/i, '');
          if (['BasicLayout', 'RouteView', 'IFrameView'].includes(normalized)) {
            return normalized;
          }
          return `../views/${normalized}.vue`;
        };

        const filterValidRoutes = (routeList: any[]): any[] => {
          if (!Array.isArray(routeList)) return [];
          return routeList
            .filter((route) => route?.path || (Array.isArray(route?.children) && route.children.length > 0))
            .map((route) => {
              const newRoute = { ...route };
              if (newRoute.children && Array.isArray(newRoute.children)) {
                newRoute.children = newRoute.children
                  .filter((child) => child && typeof child === 'object' && Object.keys(child).length > 0)
                  .map((child) => ({ ...child }));
                newRoute.children = filterValidRoutes(newRoute.children);
              } else {
                newRoute.children = [];
              }
              return newRoute;
            });
        };

        const mapRoutes = (routeList: any[], parentPath = '/'): any[] => {
          if (!Array.isArray(routeList)) return [];
          return routeList.map((route) => {
            const newRoute = { ...route };
            const routePath = String(newRoute.path ?? '');
            const fullPath = resolveRoutePath(parentPath, routePath);
            if (newRoute.component && typeof newRoute.component === 'string') {
              newRoute.component = mapComponent(newRoute.component);
            }
            if (newRoute.children) {
              newRoute.children = mapRoutes(newRoute.children, fullPath);
            }
            return newRoute;
          });
        };

        const pruneInvalidComponentRoutes = (routeList: any[]): any[] => {
          if (!Array.isArray(routeList)) return [];
          return routeList
            .map((route) => {
              const next = { ...route };
              next.children = pruneInvalidComponentRoutes(next.children ?? []);

              const comp = next.component;
              const hasChildren = Array.isArray(next.children) && next.children.length > 0;
              const hasRedirect = typeof next.redirect === 'string' && next.redirect.length > 0;

              const isKnownLayout =
                comp === 'BasicLayout' || comp === 'RouteView' || comp === 'IFrameView';
              const isViewComponent =
                typeof comp === 'string' && comp.startsWith('../views/') && !!pageMap[comp];

              if (isKnownLayout || isViewComponent) {
                return next;
              }

              if (hasChildren || hasRedirect) {
                if (!comp) {
                  next.component = 'RouteView';
                }
                return next;
              }

              console.warn('[Router] Dropping invalid route (component unresolved):', {
                name: next.name,
                path: next.path,
                component: comp,
              });
              return null;
            })
            .filter(Boolean);
        };

        routes = applyRouteMetaPolicies(routes);
        routes = mapRoutes(routes);
        routes = filterValidRoutes(routes);
        routes = pruneInvalidComponentRoutes(routes);
        routes = fixRouteNameConflictsForVueRouter(routes);
        console.log('[Router] Mapped routes:', routes?.length || 0);

        const rawRoutes = accessStore.getCachedMenuRoutes?.() || [];
        if (!rawRoutes.length && routes.length) {
          const rawFromApi = fixRouteNameConflictsForVueRouter(
            normalizeMenuTreeForRouter(await getAllMenusApi()),
          );
          accessStore.setCachedMenuRoutes?.(rawFromApi);
        }

        return routes;
      },
      forbiddenComponent,
      layoutMap,
      pageMap,
    });
  } catch (error) {
    console.error('[Router] generateAccessible error:', error);
    try {
      useAccessStore().setCachedMenuRoutes([]);
    } catch {
      // ignore
    }
    return { accessibleMenus: [], accessibleRoutes: [] };
  }
}

export { generateAccess };
