import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'material-symbols:inventory-2',
      keepAlive: true,
      order: 1000,
      title: '库存管理',
    },
    name: 'Inv',
    path: '/inv',
    children: [
      {
        meta: {
          title: '库存首页',
        },
        name: 'InvIndex',
        path: '/index',
        component: () => import('#/views/inv/index.vue'),
      },
      {
        meta: {
          title: '二维码明细',
        },
        name: 'QrcodeDetail',
        path: '/qrcode-detail',
        component: () => import('#/views/inv/qrcode-detail/index.vue'),
      },
    ],
  },
];

export default routes;
