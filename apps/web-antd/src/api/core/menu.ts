import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';

export async function getAllMenusApi() {
  const rawRoutes = (await requestClient.get<any[]>('/api/menu/getRouters')) ?? [];

  function transformRoute(record: any): RouteRecordStringComponent {
    const route: any = { ...record };

    // Dynamic routes must have a name, otherwise addRoute can fail.
    if (route.name == null || String(route.name).trim() === '') {
      const p = String(route.path ?? '').trim();
      const slug = p
        .replace(/^\//, '')
        .replace(/:([^/]+)/g, '_$1')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      route.name = slug
        ? `Auto_${slug}`
        : `Auto_route_${Math.random().toString(36).slice(2, 11)}`;
    }

    if (route.component === 'Layout') {
      route.component = 'BasicLayout';
    } else if (route.component === 'ParentView') {
      route.component = 'RouteView';
    }

    if (route.meta && route.meta.link) {
      route.component = 'IFrameView';
      route.meta = {
        ...route.meta,
        frameSrc: route.meta.link,
      };
    }

    if (typeof route.component === 'string') {
      // Accept either "system/user/index" or "system/user/index.vue"
      route.component = route.component.replace(/\.vue$/i, '');
    }

    if (Array.isArray(route.children) && route.children.length) {
      route.children = route.children.map((child: any) => transformRoute(child));
    }

    return route as RouteRecordStringComponent;
  }

  return rawRoutes.map((item) => transformRoute(item));
}
