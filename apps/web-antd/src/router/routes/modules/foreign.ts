import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'material-symbols:globe',
      keepAlive: true,
      order: 1000,
      title: '外贸发货',
    },
    name: 'WmsForeign',
    path: '/foreign',
    children: [
      {
        meta: { title: '待处理' },
        name: 'ForeignPending',
        path: 'pending',
        component: () => import('#/views/foreign/pending/index.vue'),
      },
      {
        meta: { title: '报检列表' },
        name: 'ForeignInspection',
        path: 'inspection',
        component: () => import('#/views/foreign/inspection/index.vue'),
      },
      {
        meta: { title: '报关列表' },
        name: 'ForeignCustoms',
        path: 'customs',
        component: () => import('#/views/foreign/customs/index.vue'),
      },
      {
        meta: { title: '申请发货列表' },
        name: 'ForeignApply',
        path: 'apply',
        component: () => import('#/views/foreign/apply/index.vue'),
      },
      {
        meta: { title: '发货列表' },
        name: 'ForeignShipping',
        path: 'shipping',
        component: () => import('#/views/foreign/shipping/index.vue'),
      },
    ],
  },
];

export default routes;
