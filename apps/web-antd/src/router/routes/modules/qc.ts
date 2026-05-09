import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'material-symbols:check',
      keepAlive: true,
      order: 600,
      title: '质控操作',
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
    ],
  },
];

export default routes;
