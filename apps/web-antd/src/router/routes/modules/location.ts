import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'material-symbols:warehouse',
      keepAlive: true,
      order: 900,
      title: '库位管理',
    },
    name: 'Location',
    path: '/location',
    redirect: '/location/overview',
    children: [
      {
        meta: {
          title: '库位总览',
        },
        name: 'LocationOverview',
        path: 'overview',
        component: () => import('#/views/location/index.vue'),
      },
      {
        meta: {
          title: '批量创建',
        },
        name: 'LocationBatchCreate',
        path: 'batch-create',
        component: () => import('#/views/location/batch-create.vue'),
      },
    ],
  },
];

export default routes;
