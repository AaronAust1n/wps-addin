<template>
  <div class="loading-container">
    <div class="loader"></div>
    <div class="loading-text">{{ message || '正在处理请求...' }}</div>
  </div>
</template>

<script>
export default {
  props: {
    message: {
      type: String,
      default: '正在处理请求...'
    }
  }
}
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-family: 'Microsoft YaHei', sans-serif;
  padding: 20px;
}

.loader {
  border: 5px solid #f3f3f3;
  border-top: 5px solid #4a86e8;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1.5s linear infinite;
  margin-bottom: 20px;
}

.loading-text {
  font-size: 16px;
  color: #333;
  text-align: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 