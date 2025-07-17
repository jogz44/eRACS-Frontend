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

      <!-- Dropdown arrow indicator if has children -->
      <q-item-section v-if="hasChildren" class="dropdown-icon-section">
        <q-icon :name="isExpanded ? 'expand_less' : 'expand_more'" />
      </q-item-section>
    </q-item>

    <!-- Child Items -->
    <q-slide-transition>
      <q-list v-show="hasChildren && isExpanded" class="modern-tree-menu">
        <template v-for="child in props.children" :key="child.title">
          <!-- Render simple links -->
          <q-item
            v-if="!child.children"
            clickable
            :to="child.link"
            class="modern-submenu"
            active-class="modern-submenu-active"
          >
            <q-item-section avatar class="tree-icon">
              <q-icon name="circle" size="6px" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ child.title }}</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Render nested menus -->
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
  title: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    default: '#',
  },
  icon: {
    type: String,
    default: '',
  },
  children: {
    type: Array,
    default: () => [],
  },
  expanded: {
    type: Boolean,
    default: false,
  },

  expandedChildren: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['toggle'])

const hasChildren = computed(() => props.children && props.children.length > 0)
const hasDirectLink = computed(() => props.link && !hasChildren.value)
const isExpanded = computed(() => props.expanded)

const isChildExpanded = (childTitle) => props.expandedChildren?.[childTitle] || false
const handleClick = (event) => {
  if (hasChildren.value) {
    event.preventDefault()
    event.stopPropagation()
    emit('toggle', props.title)
  }
}
</script>

<style scoped>
.active-menu {
  background-color:#0E780E !important;
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
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

/* Modern Tree Menu Container */
.modern-tree-menu {
  margin-left: 24px;
  padding-left: 8px;
  position: relative;
  overflow-x: hidden;
  max-width: 100%;
}

.q-list {
  overflow-x: hidden;
  max-width: 100%;
}

/* Vertical connecting line */
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

/* Submenu Items */
.modern-submenu {
  background: #69B31E;
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

/* Active State */
.modern-submenu-active {
  background-color: #0E780E !important;
  color: white !important;
  font-weight: bold;
}

/* Hover State */
.modern-submenu:hover {
  background-color: #0E780E;
  color: white;
  transform: translateX(4px);
}

/* Tree icon styling */
.tree-icon {
  min-width: 24px;
  color: rgba(255, 255, 255, 0.8);
}

.modern-submenu-active .tree-icon {
  background-color: #0E780E;
  color: white;
}

/* Animation for smoother transitions */
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
</style>
