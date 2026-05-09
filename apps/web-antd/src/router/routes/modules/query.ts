import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'material-symbols:search',
      keepAlive: true,
      order: 200,
      title: '库存查询',
    },
    name: 'WmsQuery',
    path: '/query',
    children: [
      {
        meta: { title: '查询物料' },
        name: 'QueryMaterial',
        path: 'material',
        component: () => import('#/views/query/material/index.vue'),
      },
      {
        meta: { title: '查询库位' },
        name: 'QueryLocation',
        path: 'location',
        component: () => import('#/views/query/location/index.vue'),
      },
      {
        meta: { title: '查询流水' },
        name: 'QueryFlow',
        path: 'flow',
        component: () => import('#/views/query/flow/index.vue'),
      },
      {
        meta: { title: '生成二维码' },
        name: 'QueryQrcode',
        path: 'qrcode',
        component: () => import('#/views/query/qrcode/index.vue'),
      },
    ],
  },
];

export default routes;
