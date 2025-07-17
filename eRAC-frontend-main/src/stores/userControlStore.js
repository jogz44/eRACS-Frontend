import { defineStore } from 'pinia'

export const useUserControlStore = defineStore('userControl', {
  state: () => ({
    lastAction: null,
    actionTimestamp: null,
  }),

  actions: {
    // Notify that a user was accepted
    // userAccepted(userData) {
    //   this.lastAction = 'user_accepted'
    //   this.actionTimestamp = Date.now()
    //   this.lastAcceptedUser = userData // used to avoid the warning
    // },

    // // Notify that a user was deleted
    // userDeleted(userData) {
    //   this.lastAction = 'user_deleted'
    //   this.actionTimestamp = Date.now()
    //   this.lastAcceptedUser = userData // used to avoid the warning
    // },

    // Check if there was a recent action
    hasRecentAction(actionType, withinSeconds = 5) {
      if (this.lastAction !== actionType) return false
      if (!this.actionTimestamp) return false

      const timeDiff = Date.now() - this.actionTimestamp
      return timeDiff < (withinSeconds * 1000)
    },

    // Clear the last action
    clearLastAction() {
      this.lastAction = null
      this.actionTimestamp = null
    },
  },
})
