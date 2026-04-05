import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'material-symbols:warehouse',
      keepAlive: true,
      order: 900,
      title: '中转仓管理',
    },
    name: 'WmsTransit',
    path: '/transit',
    children: [
      {
        meta: { title: '中转仓收货' },
        name: 'TransitReceive',
        path: 'receive',
        component: () => import('#/views/transit/receive/index.vue'),
      },
      {
        meta: { title: '中转仓送货' },
        name: 'TransitDelivery',
        path: 'delivery',
        component: () => import('#/views/transit/delivery/index.vue'),
      },
    ],
  },
];

export default routes;
