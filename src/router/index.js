import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history:  createWebHashHistory(''),
  routes: [
    {
      path: '/',
      name: '默认页',
      component: () => import('../components/Root.vue')
    },
    {
      path: '/settings',
      name: '设置',
      component: () => import('../components/Dialog.vue')
    },
    {
      path: '/taskpane',
      name: '任务窗格',
      component: () => import('../components/TaskPane.vue')
    },
    {
      path: '/loading',
      name: '加载中',
      component: () => import('../components/Loading.vue')
    },
    {
      path: '/qa',
      name: '文档问答',
      component: () => import('../components/TaskPane.vue')
    },
    {
      path: '/summary',
      name: '全文总结',
      component: () => import('../components/TaskPane.vue')
    },
    {
      path: '/help',
      name: '帮助',
      component: () => import('../components/Dialog.vue')
    }
  ]
})

export default router 