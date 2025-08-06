<template>
  <div>
    <!-- Parent Item -->
    <q-item
      clickable
      :to="hasDirectLink ? props.link : null"
      class="nav-menu"
      @click.stop="handleClick"
      active-class="active-menu"
    >
      <q-item-section v-if="props.icon" avatar>
        <q-icon :name="props.icon" />
      </q-item-section>

      <q-item-section main>
        <q-item-label>{{ props.title }}</q-item-label>
      </q-item-section>

      <q-item-section v-if="hasChildren" class="dropdown-icon-section">
        <q-icon :name="isExpanded ? 'expand_less' : 'expand_more'" />
      </q-item-section>

      <q-item-section v-if="isPanelTrigger" class="dropdown-icon-section">
        <q-icon name="chevron_right" />
      </q-item-section>
    </q-item>

    <!-- Child Items with minimal scrollbar -->
    <q-slide-transition>
      <q-list
        v-show="hasChildren && isExpanded"
        class="modern-tree-menu scroll scroll-minimal"
      >
        <template v-for="child in props.children" :key="child.title">
          <!-- Simple link -->
          <q-item
            v-if="!child.children"
            clickable
            :to="child.link"
            class="modern-submenu"
            active-class="modern-submenu-active"
          >
            <q-item-section avatar class="tree-icon">
              <div class="colored-dot" :class="getDotColor(child.title)"></div>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ child.title }}</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Nested links -->
          <NavLink
            v-else
            :title="child.title"
            :icon="child.icon"
            :link="child.link || '#'"
            :children="child.children"
            :expanded="isChildExpanded(child.title)"
            :expanded-children="{}"
            @toggle="(childTitle) => $emit('toggle', childTitle, props.title)"
            class="nested-menu"
          />
        </template>
      </q-list>
    </q-slide-transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  link: { type: String, default: '#' },
  icon: String,
  children: { type: Array, default: () => [] },
  expanded: Boolean,
  expandedChildren: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['toggle', 'panel-trigger'])

const hasChildren = computed(() => props.children.length > 0)
const hasDirectLink = computed(() => props.link && !hasChildren.value)
const isExpanded = computed(() => props.expanded)
const isPanelTrigger = computed(() =>
  (props.title === 'Transactions' || props.title === 'Libraries') && !hasChildren.value
)

const isChildExpanded = (childTitle) => props.expandedChildren?.[childTitle] || false

const getDotColor = (title) => {
  const colorMap = {
    'Appropriation': 'dot-pink',
    'Disbursement': 'dot-red',
    'Augmentation': 'dot-blue',
    'Accounts': 'dot-light-blue',
    'Bank': 'dot-green',
    'Current': 'dot-orange',
    'Continuing': 'dot-purple'
  }
  return colorMap[title] || 'dot-grey'
}

const handleClick = (event) => {
  if (hasChildren.value) {
    event.preventDefault()
    event.stopPropagation()
    emit('toggle', props.title)
  } else if (isPanelTrigger.value) {
    event.preventDefault()
    event.stopPropagation()
    emit('panel-trigger', props.title.toLowerCase())
  }
}
</script>

<style scoped>
.active-menu {
  background-color: #0E780E !important;
  color: white !important;
}

.nav-menu {
  background: #69B31E;
  border-radius: 10px;
  color: white;
  font-size: 18px;
  font-weight: bolder;
  margin: 8px 0;
  padding: 10px 16px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-menu .q-item__section--main {
  flex: 1;
  text-align: left;
}

.nav-menu:hover {
  background-color: #0E780E;
  color: white;
  transform: translateX(4px);
}

.modern-tree-menu {
  margin-left: 24px;
  padding-left: 8px;
  position: relative;
  overflow-y: auto;
  max-height: 100%;
}

.q-list {
  overflow-x: hidden;
  max-width: 100%;
}

.modern-tree-menu:before {
  content: '';
  position: absolute;
  left: 16px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(49, 74, 49, 0.3) 10%,
    rgba(6, 100, 6, 0.3) 90%,
    transparent 100%
  );
}

.modern-submenu {
  padding: 8px 14px;
  margin: 5px 0;
  border-radius: 8px;
  color: white;
  font-size: 15px;
  font-weight: bolder;
  transition: all 0.2s ease;
  position: relative;
}

.modern-submenu .q-item__label {
  text-align: left;
}

.modern-submenu:hover {
  background-color: #0E780E;
  color: white;
  transform: translateX(4px);
}

.modern-submenu-active {
  background-color: #0E780E !important;
  color: white !important;
  font-weight: bold;
}

.tree-icon {
  min-width: 24px;
  color: rgba(255, 255, 255, 0.8);
}

.modern-submenu-active .tree-icon {
  background-color: #0E780E;
  color: white;
}

.colored-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot-pink { background-color: #ff6b9d; }
.dot-red { background-color: #ff5a5a; }
.dot-blue { background-color: #4a90e2; }
.dot-light-blue { background-color: #7ed3f4; }
.dot-green { background-color: #4caf50; }
.dot-orange { background-color: #ff9800; }
.dot-purple { background-color: #9c27b0; }
.dot-grey { background-color: #9e9e9e; }

.q-slide-transition {
  transition: all 0.1s ease;
}

.dropdown-icon-section {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 36px;
  margin-left: 8px;
}

::v-deep(.scroll-minimal::-webkit-scrollbar) {
  width: 6px;
}

::v-deep(.scroll-minimal::-webkit-scrollbar-track) {
  background: transparent;
}

::v-deep(.scroll-minimal::-webkit-scrollbar-thumb) {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}

::v-deep(.scroll-minimal::-webkit-scrollbar-thumb:hover) {
  background-color: rgba(0, 0, 0, 0.3);
}

::v-deep(.scroll-minimal) {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

@media (max-width: 767px) {
  .nav-menu {
    font-size: 15px;
    padding: 8px 10px;
    margin: 4px 0;
  }
  .modern-tree-menu {
    margin-left: 10px;
    padding-left: 4px;
  }
  .modern-submenu {
    font-size: 13px;
    padding: 6px 8px;
    margin: 3px 0;
  }
  .tree-icon {
    min-width: 18px;
  }
  .colored-dot {
    width: 6px;
    height: 6px;
  }
}

@media (max-width: 500px) {
  .nav-menu {
    font-size: 13px;
    padding: 6px 6px;
  }
  .modern-submenu {
    font-size: 11px;
    padding: 4px 4px;
  }
  .colored-dot {
    width: 5px;
    height: 5px;
  }
}
</style>
