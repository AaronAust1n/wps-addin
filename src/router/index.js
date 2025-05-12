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
      path: '/dialog',
      name: '对话框',
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
      path: '/copilot',
      name: 'Copilot侧边栏',
      component: () => import('../components/Copilot.vue')
    }
  ]
})

export default router 