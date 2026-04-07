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
