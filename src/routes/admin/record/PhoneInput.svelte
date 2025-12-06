<script lang="ts">
	import { Label } from '$lib/components/ui/label';

	let {
		value = $bindable(''),
		disabled = false
	}: {
		value?: string;
		disabled?: boolean;
	} = $props();

	let displayValue = $state('');
	let inputRef: HTMLInputElement | undefined = $state();

	// Extract digits from phone number
	function getDigits(input: string): string {
		const digits = input.replace(/\D/g, '');
		// Skip leading 7 or 8 if present
		if (digits.startsWith('7') || digits.startsWith('8')) {
			return digits.slice(1);
		}
		return digits;
	}

	// Format phone number: +7 (XXX) XXX-XX-XX
	function formatPhone(digits: string): string {
		let formatted = '+7';

		if (digits.length > 0) {
			formatted += ' (' + digits.slice(0, 3);
		}
		if (digits.length >= 3) {
			formatted += ') ' + digits.slice(3, 6);
		}
		if (digits.length >= 6) {
			formatted += '-' + digits.slice(6, 8);
		}
		if (digits.length >= 8) {
			formatted += '-' + digits.slice(8, 10);
		}

		return formatted;
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const inputValue = target.value;
		const cursorPos = target.selectionStart || 0;

		// Don't allow deletion of +7
		if (!inputValue.startsWith('+7')) {
			displayValue = '+7';
			value = '+7';
			setTimeout(() => {
				if (inputRef) {
					inputRef.setSelectionRange(2, 2);
				}
			}, 0);
			return;
		}

		// Extract only the digits after +7
		const digits = getDigits(inputValue);

		// Limit to 10 digits
		const limitedDigits = digits.slice(0, 10);

		// Format the phone number
		const formatted = formatPhone(limitedDigits);

		// Count how many digits were before cursor
		const valueBeforeCursor = inputValue.slice(0, cursorPos);
		const digitsBeforeCursor = getDigits(valueBeforeCursor).length;

		displayValue = formatted;
		value = limitedDigits ? '+7' + limitedDigits : '+7';

		// Calculate new cursor position
		setTimeout(() => {
			if (inputRef) {
				let newPos = 2; // Start after +7
				let digitCount = 0;

				for (let i = 2; i < formatted.length; i++) {
					if (/\d/.test(formatted[i])) {
						digitCount++;
						if (digitCount >= digitsBeforeCursor) {
							newPos = i + 1;
							break;
						}
					}
				}

				// If cursor should be after all digits
				if (digitCount < digitsBeforeCursor) {
					newPos = formatted.length;
				}

				inputRef.setSelectionRange(newPos, newPos);
			}
		}, 0);
	}

	function handleKeyDown(event: KeyboardEvent) {
		const target = event.target as HTMLInputElement;
		const cursorPos = target.selectionStart || 0;
		const selectionStart = target.selectionStart || 0;
		const selectionEnd = target.selectionEnd || 0;

		// Prevent deletion of +7 prefix
		if (event.key === 'Backspace') {
			if (cursorPos <= 2) {
				event.preventDefault();
				return;
			}
			// If trying to delete +7 with selection
			if (selectionStart < 2 && selectionEnd > selectionStart) {
				event.preventDefault();
				return;
			}
		}

		if (event.key === 'Delete') {
			if (cursorPos < 2) {
				event.preventDefault();
				return;
			}
		}

		// Allow navigation and editing keys
		if (
			[
				'Backspace',
				'Delete',
				'Tab',
				'Escape',
				'Enter',
				'ArrowLeft',
				'ArrowRight',
				'Home',
				'End'
			].includes(event.key)
		) {
			return;
		}

		// Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
		if (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
			return;
		}

		// Only allow numbers
		if (!/^\d$/.test(event.key)) {
			event.preventDefault();
			return;
		}

		// Prevent input if already at max length (10 digits)
		const currentDigits = getDigits(target.value);
		if (currentDigits.length >= 10 && selectionStart === selectionEnd) {
			event.preventDefault();
		}
	}

	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		const pastedText = event.clipboardData?.getData('text') || '';
		const digits = getDigits(pastedText);

		if (digits) {
			const limitedDigits = digits.slice(0, 10);
			displayValue = formatPhone(limitedDigits);
			value = '+7' + limitedDigits;
		}
	}

	// Initialize with +7
	$effect(() => {
		if (!displayValue && !disabled) {
			displayValue = '+7';
			value = '+7';
		}
	});
</script>

<div class="space-y-2">
	<Label for="phone">
		Номер телефона
		<span class="text-destructive">*</span>
	</Label>
	<input
		bind:this={inputRef}
		id="phone"
		name="phone"
		type="text"
		bind:value={displayValue}
		oninput={handleInput}
		onkeydown={handleKeyDown}
		onpaste={handlePaste}
		placeholder="+7 (900) 000-00-00"
		class="w-full rounded border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none"
		required
		{disabled}
	/>
</div>
