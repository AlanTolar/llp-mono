<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	console.log('data: ', data);

	let {
		sentEmail,
		streamed: { otpApiResponse }
	} = data;

	let messageAboutEmail = sentEmail
		? `Verification email sent to ${data.user?.email} at ${sentEmail.date_sent}`
		: 'Verification email not sent';
	let loading = otpApiResponse ? true : false;
	otpApiResponse?.then((emailApiData) => {
		handleOtpApiResponse(emailApiData);
	});

	const handleOtpApiResponse = (otpApiResponse: any) => {
		console.log('otpApiResponse: ', otpApiResponse);
		messageAboutEmail = otpApiResponse?.sentEmail
			? `Email sent to ${data.user?.email} at ${otpApiResponse.sentEmail.date_sent}`
			: otpApiResponse.message;
		loading = false;
	};

	async function triggerOTPEmail() {
		loading = true;
		const response = await fetch('/api/send-email-verification');
		const emailApiData = await response.json();
		handleOtpApiResponse(emailApiData);
	}
</script>

<div class="container text-center">
	<h1 class="mt-4 fs-3">Need To Verify Email</h1>
	<div class="mt-4">
		{#if loading}
			<p>Sending Verification Email to {data.user?.email}...</p>
		{:else}
			<p>{messageAboutEmail}</p>
			<button on:click={triggerOTPEmail} class="btn btn-secondary mt-2"
				>Resend Verification Email</button
			>
		{/if}
	</div>
</div>
