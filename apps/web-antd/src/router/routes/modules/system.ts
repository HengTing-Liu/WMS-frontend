import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ic:baseline-view-in-ar',
      keepAlive: true,
      order: 1000,
      title: '系统设置',
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
          title: '角色管理',
        },
        name: 'RoleManager',
        path: '/role',
        component: () => import('#/views/system/role/index.vue'),
      },
      {
        meta: {
          title: '部门管理',
        },
        name: 'DepartmentManager',
        path: '/dept',
        component: () => import('#/views/system/dept/index.vue'),
      },
      {
        meta: {
          title: '菜单管理',
        },
        name: 'Management',
        path: '/menu',
        component: () => import('#/views/system/menu/index.vue'),
      },
      {
        meta: {
          title: '权限管理',
        },
        name: 'SysPermission',
        path: '/permission',
        component: () => import('#/views/system/permission/index.vue'),
      },
      {
        meta: {
          title: '字典管理',
        },
        name: 'DictionaryManagement',
        path: '/dict',
        component: () => import('#/views/system/dict/index.vue'),
      },
      {
        meta: {
          title: '低代码管理',
        },
        name: 'LowcodeManager',
        path: '/lowcode',
        children: [
          {
            meta: { title: '表元数据' },
            name: 'TableMeta',
            path: '/system/lowcode/table',
            component: () => import('#/views/system/tableMeta/index.vue'),
          },
          {
            meta: { title: '字段元数据' },
            name: 'ColumnMeta',
            path: '/system/lowcode/column',
            component: () => import('#/views/system/columnMeta/index.vue'),
          },
          {
            meta: { title: '操作元数据' },
            name: 'OperationMeta',
            path: '/system/lowcode/operation',
            component: () => import('#/views/system/operationMeta/index.vue'),
          },
        ],
      },
      {
        meta: {
          title: '序列号管理',
        },
        name: 'SerialManager',
        path: '/serial',
        component: () => import('#/views/system/serial/index.vue'),
      },
      {
        meta: {
          title: '日志管理',
        },
        name: 'LogManager',
        path: '/log',
        children: [
          {
            meta: {
              title: '操作日志',
            },
            name: 'OperLog',
            path: '/log/oper',
            component: () => import('#/views/system/operlog/index.vue'),
          },
          {
            meta: {
              title: '登录日志',
            },
            name: 'LoginLog',
            path: '/log/login',
            component: () => import('#/views/system/logininfor/index.vue'),
          },
        ],
      },
      {
        meta: {
          hideInMenu: true,
          title: '数据权限',
        },
        name: 'RoleDataScope',
        path: '/role/dataScope/:roleId',
        component: () => import('#/views/system/roleManager/dataScope.vue'),
      },
      {
        meta: {
          hideInMenu: true,
          ignoreAccess: true,
          title: '分配用户',
        },
        name: 'RoleAssignUser',
        path: '/role/assignUser/:roleId',
        component: () => import('#/views/system/roleManager/assignUser.vue'),
      },
      {
        meta: {
          hideInMenu: true,
          title: '分配角色',
        },
        name: 'UserAssignRole',
        path: '/user/assignRole/:userId',
        component: () => import('#/views/system/user/assignRole.vue'),
      },
      {
        meta: {
          hideInMenu: true,
          title: '产品分类',
        },
        name: 'ProductCategory',
        path: '/productCategory',
        component: () => import('#/views/system/productCategory/index.vue'),
      },
      {
        meta: {
          hideInMenu: true,
          title: '产品分类-新增',
        },
        name: 'ProductCategoryAdd',
        path: 'productCategory/add',
        component: () => import('#/views/system/productCategory/add.vue'),
      },
      {
        meta: {
          hideInMenu: true,
          title: '测试数据',
        },
        name: 'Testing',
        path: '/Testing',
        component: () => import('#/views/system/Testing/index.vue'),
      },
    ],
  },
];

export default routes;
