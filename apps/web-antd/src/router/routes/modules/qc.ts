import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'material-symbols:check',
      keepAlive: true,
      order: 600,
      title: '质量控制',
    },
    name: 'WmsQc',
    path: '/qc',
    children: [
      {
        meta: { title: '质量标准' },
        name: 'QcStandard',
        path: 'standard',
        component: () => import('#/views/qc/standard/index.vue'),
      },
      {
        meta: { title: '质量评价' },
        name: 'QcEvaluate',
        path: 'evaluate',
        component: () => import('#/views/qc/evaluate/index.vue'),
      },
      {
        meta: { title: '在库养护' },
        name: 'QcInStockCare',
        path: 'in-stock-care',
        component: () => import('#/views/qc/in-stock-care/index.vue'),
      },
    ],
  },
];

export default routes;
