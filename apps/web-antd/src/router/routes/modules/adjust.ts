import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'material-symbols:edit',
      keepAlive: true,
      order: 500,
      title: '库存调整',
    },
    name: 'WmsAdjust',
    path: '/adjust',
    children: [
      {
        meta: { title: '库存盘点' },
        name: 'AdjustCount',
        path: 'count',
        component: () => import('#/views/adjust/count/index.vue'),
      },
      {
        meta: { title: '库存报废' },
        name: 'AdjustScrap',
        path: 'scrap',
        component: () => import('#/views/adjust/scrap/index.vue'),
      },
      {
        meta: { title: '库位调整' },
        name: 'AdjustMove',
        path: 'move',
        component: () => import('#/views/adjust/move/index.vue'),
      },
    ],
  },
];

export default routes;
