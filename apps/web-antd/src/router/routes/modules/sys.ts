import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'material-symbols:settings',
      keepAlive: true,
      order: 100,
      title: '基础设置',
    },
    name: 'SysBase',
    path: '/sys',
    children: [
      {
        meta: { title: '仓库档案' },
        name: 'BaseWarehouseList',
        path: 'warehouse',
        component: () => import('#/views/sys/warehouse/index.vue'),
      },
      {
        meta: { title: '仓库编辑' },
        name: 'BaseWarehouseEdit',
        path: 'warehouse/edit',
        component: () => import('#/views/sys/warehouse/warehouse-edit.vue'),
      },
      {
        meta: { title: '库位管理' },
        name: 'BaseLocation',
        path: 'location',
        component: () => import('#/views/sys/location/index.vue'),
      },
      {
        meta: { title: '字典管理' },
        name: 'SysDict',
        path: 'dict',
        component: () => import('#/views/sys/dict/index.vue'),
      },
      {
        meta: { title: '物料管理' },
        name: 'BaseMaterial',
        path: 'material',
        component: () => import('#/views/sys/material/index.vue'),
      },
      {
        meta: { title: '货位管理' },
        name: 'BaseStorage',
        path: 'storage',
        component: () => import('#/views/sys/storage/index.vue'),
      },
      {
        meta: { title: '枚举管理' },
        name: 'BaseEnum',
        path: 'enum',
        component: () => import('#/views/sys/enum/index.vue'),
      },
    ],
  },
];

export default routes;
