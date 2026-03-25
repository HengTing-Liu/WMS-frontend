import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ic:baseline-view-in-ar',
      keepAlive: true,
      order: 1000,
      title: '系统管理',
    },
    name: 'System',
    path: '/system',
    children: [
      {
        meta: {
          title: '用户管理',
        },
        name: 'User',
        path: '/user',
        component: () => import('#/views/system/user/index.vue'),
      },
      {
        meta: {
          title: $t('page.system.role.title'),
        },
        name: 'Role',
        path: '/role',
        component: () => import('#/views/system/role/index.vue'),
      },
      {
        meta: {
          title: $t('page.system.dict.title'),
        },
        name: 'Dict',
        path: '/dict',
        component: () => import('#/views/system/dict/index.vue'),
      },

      {
        meta: {
          title: $t('page.system.serial.title'),
        },
        name: 'Serial',
        path: '/serial',
        component: () => import('#/views/system/serial/index.vue'),
      },
      {
        meta: {
          title: $t('page.system.menu.title'),
        },
        name: 'Menu',
        path: '/menu',
        component: () => import('#/views/system/menu/index.vue'),
      },
      {
        meta: {
          title: $t('page.system.dept.title'),
        },
        name: 'Dept',
        path: '/dept',
        component: () => import('#/views/system/dept/index.vue'),
      },
      {
        meta: {
          icon: 'mdi:shield-account',
          title: $t('page.system.dataPermission.title'),
          roles: ['admin'],
        },
        name: 'DataPermission',
        path: '/data-permission',
        children: [
          {
            meta: {
              title: $t('page.system.dataPermission.userPermission'),
              roles: ['admin'],
            },
            name: 'UserPermission',
            path: '/data-permission/user',
            component: () =>
              import('#/views/sys/data-permission/user-permission.vue'),
          },
          {
            meta: {
              title: $t('page.system.dataPermission.deptPermission'),
              roles: ['admin'],
            },
            name: 'DeptPermission',
            path: '/data-permission/dept',
            component: () =>
              import('#/views/sys/data-permission/dept-permission.vue'),
          },
          {
            meta: {
              title: $t('page.system.dataPermission.rolePermission'),
              roles: ['admin'],
            },
            name: 'RolePermission',
            path: '/data-permission/role',
            component: () =>
              import('#/views/sys/data-permission/role-permission.vue'),
          },
          {
            meta: {
              title: $t('page.system.dataPermission.companyPermission'),
              roles: ['admin'],
            },
            name: 'CompanyPermission',
            path: '/data-permission/company',
            component: () =>
              import('#/views/sys/data-permission/company-permission.vue'),
          },
        ],
      },
    ],
  },
];

export default routes;
