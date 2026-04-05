import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:code-2',
      keepAlive: true,
      order: 900,
      title: '低代码配置',
    },
    name: 'Lowcode',
    path: '/lowcode',
    children: [
      {
        meta: {
          title: '元表配置',
        },
        name: 'MetaTable',
        path: '/lowcode/meta',
        component: () => import('#/views/lowcode/meta/index.vue'),
      },
      {
        meta: {
          title: '代码生成器',
        },
        name: 'CodeGenerator',
        path: '/lowcode/code-generator',
        component: () => import('#/views/lowcode/code-generator/index.vue'),
      },
    ],
  },
];

export default routes;
