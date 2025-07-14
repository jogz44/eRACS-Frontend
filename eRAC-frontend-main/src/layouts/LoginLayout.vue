<template>
  <q-layout view="lHh Lpr lFf">
    <div class="bg-wrapper">
      <q-page-container class="flex flex-center">
        <router-view />
      </q-page-container>
    </div>
  </q-layout>
</template>

<script>
export default {
  name: 'AuthLayout',
}
</script>

<style scoped>
/* Add any custom styles for the AuthLayout here */

.bg-wrapper {
  position: relative;
  min-height: 100vh;
  background: url('src/assets/cityhall.jpg') no-repeat center center;
  background-size: cover;
}

.q-page-container {
  background: transparent;
}
</style>
