import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'material-symbols:orders',
      keepAlive: true,
      order: 800,
      title: '出库单管理',
    },
    name: 'WmsOutOrder',
    path: '/out-order',
    children: [
      {
        meta: { title: '出库准备' },
        name: 'OutOrderPrepare',
        path: 'prepare',
        component: () => import('#/views/out-order/prepare/index.vue'),
      },
      {
        meta: { title: '出库单' },
        name: 'OutOrderList',
        path: 'list',
        component: () => import('#/views/out-order/list/index.vue'),
      },
      {
        meta: { title: '包裹单' },
        name: 'OutOrderPackage',
        path: 'package',
        component: () => import('#/views/out-order/package/index.vue'),
      },
      {
        meta: { title: '发货列表' },
        name: 'OutOrderShipping',
        path: 'shipping',
        component: () => import('#/views/out-order/shipping/index.vue'),
      },
    ],
  },
];

export default routes;
