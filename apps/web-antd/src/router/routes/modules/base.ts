import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ic:baseline-settings',
      order: 100,
      title: '基础设置',
    },
    name: 'Base',
    path: '/base',
    children: [
      {
        meta: {
          hideInMenu: true,
          title: '权限管理',
        },
        name: 'BasePermission',
        path: '/base/permission',
        component: () => import('#/views/base/permission/index.vue'),
      },
      {
        meta: {
          hideInMenu: true,
          title: '基础数据',
        },
        name: 'BaseDict',
        path: '/base/dict',
        component: () => import('#/views/base/dict/index.vue'),
      },
      {
        meta: {
          hideInMenu: true,
          title: '库位档案',
        },
        name: 'BaseLocation',
        path: '/base/location',
        component: () => import('#/views/base/location/index.vue'),
      },
      {
        meta: {
          hideInMenu: true,
          title: '仓库档案',
        },
        name: 'BaseWarehouse',
        path: '/base/warehouse',
        component: () => import('#/views/base/warehouse/index.vue'),
      },
    ],
  },
];

export default routes;
