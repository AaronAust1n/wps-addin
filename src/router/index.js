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
      component: () => import('../components/DocumentQA.vue')
    },
    {
      path: '/summary',
      name: '全文总结',
      component: () => import('../components/Summary.vue')
    },
    {
      path: '/help',
      name: '帮助',
      component: () => import('../components/Dialog.vue')
    },
    {
      path: '/history',
      name: '历史记录',
      component: () => import('../components/History.vue')
    },
    {
      path: '/advanced-rewrite',
      name: 'AdvancedRewritePane',
      component: () => import('../components/AdvancedRewritePane.vue')
    },
    {
      path: '/describe-cell', // Or '/describe-cell/:initialAddress/:initialValue' if passing as params
      name: 'DescribeCellPane',
      component: () => import('../components/DescribeCellPane.vue'), // This component will be created in the next step
      props: true // Allows route params to be passed as props if using path params
    },
    {
      path: '/summarize-shape',
      name: 'SummarizeShapePane',
      component: () => import('../components/SummarizeShapePane.vue'),
      props: true
    }
  ]
})

export default router 