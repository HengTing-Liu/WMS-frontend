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
    name: 'WmsBase',
    path: '/sys',
    children: [
      {
        meta: { title: '仓库档案' },
        name: 'BaseWarehouse',
        path: 'warehouse',
        component: () => import('#/views/sys/warehouse/index.vue'),
      },
      {
        meta: { title: '库位档案' },
        name: 'BaseLocation',
        path: 'location',
        component: () => import('#/views/sys/location/index.vue'),
      },
      {
        meta: { title: '用户管理' },
        name: 'BaseUser',
        path: 'user',
        component: () => import('#/views/sys/user/index.vue'),
      },
      {
        meta: { title: '权限管理' },
        name: 'BasePermission',
        path: 'permission',
        component: () => import('#/views/sys/permission/index.vue'),
      },
      {
        meta: { title: '基础数据' },
        name: 'SysDict',
        path: 'dict',
        component: () => import('#/views/sys/dict/index.vue'),
      },
      {
        meta: { title: $t('page.system.enum.title') },
        name: 'BaseEnum',
        path: 'enum',
        component: () => import('#/views/base/enum/index.vue'),
      },
    ],
  },
];

export default routes;
