import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'material-symbols:settings',
      keepAlive: true,
      order: 100,
      title: '基础设置',
    },
    name: 'SysBase',
    path: '/sys',
    children: [
      {
        meta: { title: '仓库档案', keepAlive: true, fullPathKey: false },
        name: 'BaseWarehouseList',
        path: 'warehouse',
        component: () => import('#/views/sys/warehouse/index.vue'),
      },

      {
        meta: { title: '库位管理' , keepAlive: true,},
        name: 'BaseLocation',
        path: 'location',
        component: () => import('#/views/sys/location/index.vue'),
      },
      {
        meta: { title: '字典管理' , keepAlive: true,},
        name: 'SysDict',
        path: 'dict',
        component: () => import('#/views/sys/dict/index.vue'),
      },
      {
        meta: { title: '物料管理', keepAlive: true, fullPathKey: false },
        name: 'BaseMaterial',
        path: 'material',
        component: () => import('#/views/sys/material/index.vue'),
      },
      {
        meta: { title: '批次管理', keepAlive: true, fullPathKey: false },
        name: 'BaseBatch',
        path: 'batch',
        component: () => import('#/views/sys/batch/index.vue'),
      },
      {
        meta: {
          hideInMenu: true,
          keepAlive: false,
          title: '低代码表单',
        },
        name: 'LowcodeFormPage',
        path: 'lowcode-form/:tableCode/:mode/:id?',
        component: () => import('#/lowcode/LowcodeFormPage.vue'),
      },
      {
        meta: { title: '序列号规则' },
        name: 'SysSerial',
        path: 'serial',
        component: () => import('#/views/system/serial/index.vue'),
      },
    ],
  },
];

export default routes;
