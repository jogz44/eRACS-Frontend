<template>
  <PermissionGuard :allowed-positions="['Barangay Captain']">
    <q-page class="q-pa-md">
      <div class="text-h4 q-mb-md">Protected Content</div>
      <p>This content is only visible to Barangay Captains.</p>
      
      <q-card class="q-mt-md">
        <q-card-section>
          <div class="text-h6">Sensitive Information</div>
          <p>This is confidential information that only authorized personnel can access.</p>
        </q-card-section>
      </q-card>
    </q-page>
  </PermissionGuard>
</template>

<script setup>
import PermissionGuard from 'components/PermissionGuard.vue'
</script>
