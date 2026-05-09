import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'material-symbols:file-open',
      keepAlive: true,
      order: 700,
      title: '提货单管理',
    },
    name: 'WmsPickup',
    path: '/pickup',
    children: [
      {
        meta: { title: '销售提货单' },
        name: 'PickupSale',
        path: 'sale',
        component: () => import('#/views/pickup/sale/index.vue'),
      },
      {
        meta: { title: '调拨提货单' },
        name: 'PickupTransfer',
        path: 'transfer',
        component: () => import('#/views/pickup/transfer/index.vue'),
      },
      {
        meta: { title: '领用提货单' },
        name: 'PickupUse',
        path: 'use',
        component: () => import('#/views/pickup/use/index.vue'),
      },
      {
        meta: { title: 'CRO提货单' },
        name: 'PickupCro',
        path: 'cro',
        component: () => import('#/views/pickup/cro/index.vue'),
      },
      {
        meta: { title: '随货物品' },
        name: 'PickupAccompany',
        path: 'accompany',
        component: () => import('#/views/pickup/accompany/index.vue'),
      },
      {
        meta: { title: '紧急提货单' },
        name: 'PickupUrgent',
        path: 'urgent',
        component: () => import('#/views/pickup/urgent/index.vue'),
      },
    ],
  },
];

export default routes;
