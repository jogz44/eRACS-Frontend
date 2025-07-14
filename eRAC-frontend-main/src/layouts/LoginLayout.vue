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
  overflow: hidden;
}

.bg-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('src/assets/cityhall.jpg') no-repeat center center;
  background-size: cover;
  filter: blur(100px);
  z-index: 0;
}

/* Make sure the content is above the blurred background */
.q-page-container {
  position: relative;
  z-index: 1;
  background: transparent;
}
</style>
