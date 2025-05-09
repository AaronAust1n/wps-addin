<template>
  <RouterView />
</template>

<style scoped></style>

<script>
import { ref, onMounted } from 'vue'
import ribbon from './components/ribbon.js'
export default {
  setup() {
    const message = ref('你好，WPS AI助手')
    onMounted(() => {
      window.ribbon = ribbon
    })

    return {
      message
    }
  }
}
</script> 