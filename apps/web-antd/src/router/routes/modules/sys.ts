import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'material-symbols:settings',
      keepAlive: true,
      order: 100,
      title: '基础设置',
    },
    name: 'WmsBase',
    path: '/sys',
    children: [
      {
        meta: { title: '仓库档案' },
        name: 'BaseWarehouseList',
        path: 'warehouse',
        component: () => import('#/views/sys/warehouse/index.vue'),
      },
      {
        meta: { title: '仓库编辑' },
        name: 'BaseWarehouseEdit',
        path: 'warehouse/edit',
        component: () => import('#/views/sys/warehouse/warehouse-edit.vue'),
      },
      {
        meta: { title: '供应商管理' },
        name: 'BaseSupplier',
        path: 'supplier',
        component: () => import('#/views/sys/supplier/index.vue'),
      },
      {
        meta: { title: '客户管理' },
        name: 'BaseCustomer',
        path: 'customer',
        component: () => import('#/views/sys/customer/index.vue'),
      },
      {
        meta: { title: '物料管理' },
        name: 'BaseMaterial',
        path: 'material',
        component: () => import('#/views/sys/material/index.vue'),
      },
      {
        meta: { title: '库位档案' },
        name: 'BaseLocation',
        path: 'location',
        component: () => import('#/views/sys/location/index.vue'),
      },
      {
        meta: { title: '货位管理' },
        name: 'BaseStorage',
        path: 'storage',
        component: () => import('#/views/sys/storage/index.vue'),
      },
      {
        meta: { title: '用户管理' },
        name: 'BaseUser',
        path: 'user',
        component: () => import('#/views/sys/user/index.vue'),
      },
      {
        meta: { title: '权限管理' },
        name: 'BasePermission',
        path: 'permission',
        component: () => import('#/views/sys/permission/index.vue'),
      },
      {
        meta: { title: '基础数据' },
        name: 'SysDict',
        path: 'dict',
        component: () => import('#/views/sys/dict/index.vue'),
      },
      {
        meta: { title: $t('page.system.enum.title') },
        name: 'BaseEnum',
        path: 'enum',
        component: () => import('#/views/base/enum/index.vue'),
      },
    ],
  },
];

export default routes;
