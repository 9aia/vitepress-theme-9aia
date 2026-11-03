<script setup lang="ts">
import { computed, ref } from "vue";
import VPButton from "vitepress/dist/client/theme-default/components/VPButton.vue";
import VPLink from "vitepress/dist/client/theme-default/components/VPLink.vue";
import VPSocialLink from "vitepress/dist/client/theme-default/components/VPSocialLink.vue";
import Specimen from "./Specimen.vue";
import type { LedgerItem } from "./types.ts";

const props = withDefaults(defineProps<{ items: LedgerItem[]; filterable?: boolean }>(), {
  filterable: true,
});

const ORDER = ["recent", "wip", "deprecated"];
const filters = computed(() => {
  const statuses = new Set(props.items.map((i) => i.status).filter(Boolean));
  return ["active", ...ORDER.filter((s) => statuses.has(s))];
});

const filter = ref("active");
const filtered = computed(() =>
  filter.value === "active"
    ? props.items.filter((i) => i.status !== "deprecated")
    : props.items.filter((i) => i.status === filter.value),
);
</script>

<template>
  <div class="ledger">
    <div class="filters" v-if="filterable && filters.length > 1">
      <VPButton
        v-for="f in filters"
        :key="f"
        :text="f"
        :theme="filter === f ? 'brand' : 'alt'"
        @click="filter = f"
      />
    </div>
    <div class="rows">
      <article v-for="item in filtered" :key="item.name" class="row">
        <div class="ident">
          <Specimen :name="item.name" />
          <span class="pname">{{ item.name }}</span>
          <span
            v-if="item.status && item.status !== 'recent'"
            class="status"
            :data-status="item.status"
            >{{ item.status }}</span
          >
        </div>
        <div class="pbody">
          <p v-if="item.description" class="pdesc">{{ item.description }}</p>
          <p v-if="item.keywords?.length" class="pkw">
            {{ item.keywords.join(", ") }}
          </p>
        </div>
        <div class="plinks">
          <VPLink :href="item.url" v-if="item.url" class="plink">site</VPLink>
          <VPSocialLink icon="github" :link="item.github" v-if="item.github" class="plink" />
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 1rem;
}

.rows {
  border-bottom: 1px solid var(--vp-c-divider);
}

.row {
  display: grid;
  gap: 4px;
  padding: 0.875rem 0;
  border-top: 1px solid var(--vp-c-divider);
}

.ident {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
}

.ident .specimen {
  flex: none;
}

.pname {
  font-family: var(--vp-font-family-mono);
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--vp-c-text-1);
}

.status {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--vp-c-gray-soft);
  color: var(--vp-c-text-2);
}

.status[data-status="wip"] {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.pbody {
  min-width: 0;
}

.pdesc {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

.pkw {
  margin: 2px 0 0;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  color: var(--vp-c-text-3);
}

.plinks {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  white-space: nowrap;
}

.plink {
  font-family: var(--vp-font-family-mono);
  font-size: 0.8125rem;
}

@media (min-width: 48rem) {
  .row {
    grid-template-columns: 11rem 1fr auto;
    gap: 1.5rem;
    align-items: baseline;
  }
}
</style>
