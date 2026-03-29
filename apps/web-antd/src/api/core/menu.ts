import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取用户所有菜单（后端返回 /api/menu/getRouters 的 RuoYi 格式）
 * 这里在前端做一层格式转换，适配 vben 的 backend access 模式。
 *
 * 【不做映射】已约定前端 views 目录与后端 component 一致（menu、dept、dict、operlog、logininfor），
 * 后端直接返回如 /system/menu/index、/system/dept/index 等，框架按路径解析组件，无需映射。
 */
export async function getAllMenusApi() {
  // requestClient 已经做了 code/data 处理，这里直接拿到 data 数组
  const rawRoutes = (await requestClient.get<any[]>('/api/menu/getRouters')) ?? [];

  function transformRoute(record: any): RouteRecordStringComponent {
    const route: any = { ...record };

    // 0. 动态路由必须有 name，否则 vben generate-routes-backend / router.addRoute 会报错（常见：ParentView 父级未配 name）
    if (route.name == null || String(route.name).trim() === '') {
      const p = String(route.path ?? '').trim();
      const slug = p
        .replace(/^\//, '')
        .replace(/:([^/]+)/g, '_$1')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      route.name = slug ? `Auto_${slug}` : `Auto_route_${Math.random().toString(36).slice(2, 11)}`;
    }

    // 1. 适配布局组件：RuoYi 的 Layout 映射为完整布局；ParentView 仅作子路由出口，避免操作日志/登录日志等出现内嵌整页布局（重影、内容挤小）
    if (route.component === 'Layout') {
      route.component = 'BasicLayout';
    } else if (route.component === 'ParentView') {
      route.component = 'RouteView';
    }

    // 2. 外链处理：若 meta.link 存在，可以映射为 IFrameView（由 access.ts 里的 layoutMap 处理）
    if (route.meta && route.meta.link) {
      route.component = 'IFrameView';
      // vben 通常使用 frameSrc，这里做个兼容
      route.meta = {
        ...route.meta,
        frameSrc: route.meta.link,
      };
    }

    // 3. 组件路径：后端与前端 views 目录一致，不再做映射（见文件头注释）
    if (typeof route.component === 'string') {
      // 兼容后端传了 .vue 后缀导致的动态路由解析失败
      route.component = route.component.replace(/\.vue$/i, '');
    }

    // 4. 递归处理 children
    if (Array.isArray(route.children) && route.children.length) {
      route.children = route.children.map((child: any) => transformRoute(child));
    }

    return route as RouteRecordStringComponent;
  }

  const transformed = rawRoutes.map((item) => transformRoute(item));

  // 5. 注入前端需要的“隐藏”子路由（不依赖后端菜单是否配置），避免分配角色/分配用户/数据权限 报 No match
  const hiddenRoutes: RouteRecordStringComponent[] = [
    {
      name: 'UserAssignRole',
      path: '/user/assignRole/:userId',
      component: '/system/user/assignRole',
      meta: { hideInMenu: true, title: '分配角色' },
    },
    {
      name: 'RoleAssignUser',
      path: '/roleManager/assignUser/:roleId',
      component: '/system/roleManager/assignUser',
      meta: { hideInMenu: true, ignoreAccess: true, title: '分配用户' },
    },
    {
      name: 'RoleDataScope',
      path: '/roleManager/dataScope/:roleId',
      component: '/system/roleManager/dataScope',
      meta: { hideInMenu: true, title: '数据权限' },
    },
    {
      name: 'BasicArchiveProductCategoryFormDefinition',
      path: '/basicArchive/productCategory/formDefinition',
      component: '/basicArchive/productCategory/formDefinition',
      meta: { hideInMenu: true, title: '产品目录表单定义' },
    },
    {
      name: 'BasicArchiveProductCategoryForm',
      path: '/basicArchive/productCategory/form/:id?',
      component: '/basicArchive/productCategory/form',
      meta: { hideInMenu: true, title: '产品目录维护' },
    },
  ] as RouteRecordStringComponent[];

  for (const layout of transformed) {
    const r = layout as any;
    if (r.component === 'BasicLayout' && Array.isArray(r.children)) {
      r.children = [...(r.children ?? []), ...hiddenRoutes];
      break;
    }
  }

  return transformed;
}
