<script lang="ts">
	import { browser } from '$app/environment';
	if (browser) {
		import('bootstrap');
	}
</script>

<slot />
