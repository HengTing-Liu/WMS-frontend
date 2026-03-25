import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'material-symbols:local-shipping',
      keepAlive: true,
      order: 1100,
      title: '运单配送',
    },
    name: 'WmsDelivery',
    path: '/delivery',
    children: [
      {
        meta: { title: '快递计划' },
        name: 'DeliveryExpress',
        path: 'express',
        component: () => import('#/views/delivery/express/index.vue'),
      },
      {
        meta: { title: '配送签收' },
        name: 'DeliverySign',
        path: 'sign',
        component: () => import('#/views/delivery/sign/index.vue'),
      },
    ],
  },
];

export default routes;
