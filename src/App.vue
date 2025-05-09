<template>
  <RouterView />
</template>

<style scoped></style>

<script>
import { onMounted } from 'vue'
import ribbon from './components/ribbon.js'

export default {
  setup() {
    onMounted(() => {
      window.ribbon = ribbon
      console.log('WPS AI助手应用已加载')
    })

    return {}
  }
}
</script> 