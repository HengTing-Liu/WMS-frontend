import type { RouteRecordRaw } from 'vue-router';

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
          title: '产品分类',
        },
        name: 'ProductCategory',
        path: '/productCategory',
        component: () => import('#/views/system/productCategory/index.vue'),
      },
      {
        meta: {
          title: '部门管理',
        },
        name: 'DepartmentManager',
        path: '/departmentManager',
        component: () => import('#/views/system/dept/index.vue'),
      },
      {
        meta: {
          title: '角色管理',
        },
        name: 'RoleManager',
        path: '/roleManager',
        component: () => import('#/views/system/roleManager/index.vue'),
      },
      {
        meta: {
          title: '菜单管理',
        },
        name: 'Management',
        path: '/management',
        component: () => import('#/views/system/menu/index.vue'),
      },
      {
        meta: {
          title: '字典管理',
        },
        name: 'DictionaryManagement',
        path: '/dictionaryManagement',
        component: () => import('#/views/system/dict/index.vue'),
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
            // component: () => import('#/views/system/LogManager/loginLog/index.vue'),
            component: () => import('#/views/system/logininfor/index.vue'),
          },
        ],
      },
      {
        meta: {
          title: '测试数据',
        },
        name: 'Testing',
        path: '/Testing',
        component: () => import('#/views/system/Testing/index.vue'),
      },
      {
        meta: {
          hideInMenu: true,
          title: '数据权限',
        },
        name: 'RoleDataScope',
        path: '/roleManager/dataScope/:roleId',
        component: () => import('#/views/system/roleManager/dataScope.vue'),
      },
      {
        meta: {
          hideInMenu: true,
          ignoreAccess: true,
          title: '分配用户',
        },
        name: 'RoleAssignUser',
        path: '/roleManager/assignUser/:roleId',
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
          title: '产品分类-新增',
        },
        name: 'ProductCategoryAdd',
        path: 'productCategory/add',
        component: () => import('#/views/system/productCategory/add.vue'),
      },
    ],
  },
];

export default routes;
