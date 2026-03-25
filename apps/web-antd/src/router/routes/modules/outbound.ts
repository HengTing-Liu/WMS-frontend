import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'material-symbols:logout',
      keepAlive: true,
      order: 400,
      title: '出库操作',
    },
    name: 'WmsOutbound',
    path: '/outbound',
    children: [
      {
        meta: { title: '销售出库' },
        name: 'OutboundSale',
        path: 'sale',
        component: () => import('#/views/outbound/sale/index.vue'),
      },
      {
        meta: { title: '调拨出库' },
        name: 'OutboundTransfer',
        path: 'transfer',
        component: () => import('#/views/outbound/transfer/index.vue'),
      },
      {
        meta: { title: '领用出库' },
        name: 'OutboundUse',
        path: 'use',
        component: () => import('#/views/outbound/use/index.vue'),
      },
      {
        meta: { title: '生产退料出库' },
        name: 'OutboundReturnMaterial',
        path: 'return-material',
        component: () => import('#/views/outbound/return-material/index.vue'),
      },
      {
        meta: { title: '采购退货出库' },
        name: 'OutboundReturnPurchase',
        path: 'return-purchase',
        component: () => import('#/views/outbound/return-purchase/index.vue'),
      },
    ],
  },
];

export default routes;
