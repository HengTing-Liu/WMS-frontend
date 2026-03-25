import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'material-symbols:login',
      keepAlive: true,
      order: 300,
      title: '入库操作',
    },
    name: 'WmsInbound',
    path: '/inbound',
    children: [
      {
        meta: { title: '生产入库' },
        name: 'InboundProduction',
        path: 'production',
        component: () => import('#/views/inbound/production/index.vue'),
      },
      {
        meta: { title: '采购入库' },
        name: 'InboundPurchase',
        path: 'purchase',
        component: () => import('#/views/inbound/purchase/index.vue'),
      },
      {
        meta: { title: '调拨入库' },
        name: 'InboundTransfer',
        path: 'transfer',
        component: () => import('#/views/inbound/transfer/index.vue'),
      },
      {
        meta: { title: '售后退货入库' },
        name: 'InboundReturn',
        path: 'return',
        component: () => import('#/views/inbound/return/index.vue'),
      },
      {
        meta: { title: '领用退料入库' },
        name: 'InboundReturnMaterial',
        path: 'return-material',
        component: () => import('#/views/inbound/return-material/index.vue'),
      },
    ],
  },
];

export default routes;
