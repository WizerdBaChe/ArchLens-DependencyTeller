<template>
  <button>Click</button>
</template>

<script setup>
import { log } from "./utils/logger";

function handleClick() {
  log("widget clicked");
}
</script>
