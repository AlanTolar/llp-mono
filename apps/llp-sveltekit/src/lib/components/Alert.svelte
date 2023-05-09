<script lang="ts">
	export let message: string;
	export let type = 'danger';

	const alertType = `alert-${type}`;
</script>

<div class="alert {alertType} alert-dismissible fade show" role="alert">
	{message}
	<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" />
</div>
