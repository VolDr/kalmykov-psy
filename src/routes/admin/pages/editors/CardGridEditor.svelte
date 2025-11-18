<script lang="ts">
	import type { CardGridBlock } from '$lib/types/page-blocks';

	interface Props {
		block: CardGridBlock;
		onUpdate: (block: CardGridBlock) => void;
	}

	let { block, onUpdate }: Props = $props();

	function updateConfig<K extends keyof CardGridBlock['config']>(
		key: K,
		value: CardGridBlock['config'][K]
	) {
		const updated = {
			...block,
			config: { ...block.config, [key]: value }
		};
		onUpdate(updated);
	}

	function addCard(
		type: 'list-card' | 'icon-card' | 'contact-card' | 'link-card' | 'rich-contact-card'
	) {
		const cards = [...block.config.cards];
		if (type === 'list-card') {
			cards.push({ type: 'list-card', title: '', points: [''] });
		} else if (type === 'icon-card') {
			cards.push({ type: 'icon-card', highlight: '', text: '' });
		} else if (type === 'contact-card') {
			cards.push({ type: 'contact-card', title: '', phone: '', link: '' });
		} else if (type === 'link-card') {
			cards.push({ type: 'link-card', title: '', description: '', link: '' });
		} else if (type === 'rich-contact-card') {
			cards.push({ type: 'rich-contact-card', title: '', contacts: [] });
		}
		updateConfig('cards', cards);
	}

	function removeCard(index: number) {
		const cards = block.config.cards.filter((_, i) => i !== index);
		updateConfig('cards', cards);
	}

	function updateCard(index: number, field: string, value: unknown) {
		const cards = [...block.config.cards];
		cards[index] = { ...cards[index], [field]: value } as (typeof cards)[0];
		updateConfig('cards', cards);
	}

	function updatePoint(cardIndex: number, pointIndex: number, value: string) {
		const cards = [...block.config.cards];
		const card = cards[cardIndex];
		if (card.type === 'list-card') {
			const points = [...card.points];
			points[pointIndex] = value;
			cards[cardIndex] = { ...card, points };
			updateConfig('cards', cards);
		}
	}

	function addPoint(cardIndex: number) {
		const cards = [...block.config.cards];
		const card = cards[cardIndex];
		if (card.type === 'list-card') {
			cards[cardIndex] = { ...card, points: [...card.points, ''] };
			updateConfig('cards', cards);
		}
	}

	function removePoint(cardIndex: number, pointIndex: number) {
		const cards = [...block.config.cards];
		const card = cards[cardIndex];
		if (card.type === 'list-card') {
			cards[cardIndex] = { ...card, points: card.points.filter((_, i) => i !== pointIndex) };
			updateConfig('cards', cards);
		}
	}

	// Rich Contact Card helpers
	function addIntroText(cardIndex: number) {
		const cards = [...block.config.cards];
		const card = cards[cardIndex];
		if (card.type === 'rich-contact-card') {
			const introText = card.introText || [];
			cards[cardIndex] = { ...card, introText: [...introText, ''] };
			updateConfig('cards', cards);
		}
	}

	function updateIntroText(cardIndex: number, textIndex: number, value: string) {
		const cards = [...block.config.cards];
		const card = cards[cardIndex];
		if (card.type === 'rich-contact-card') {
			const introText = [...(card.introText || [])];
			introText[textIndex] = value;
			cards[cardIndex] = { ...card, introText };
			updateConfig('cards', cards);
		}
	}

	function removeIntroText(cardIndex: number, textIndex: number) {
		const cards = [...block.config.cards];
		const card = cards[cardIndex];
		if (card.type === 'rich-contact-card') {
			cards[cardIndex] = {
				...card,
				introText: (card.introText || []).filter((_, i) => i !== textIndex)
			};
			updateConfig('cards', cards);
		}
	}

	function addContact(cardIndex: number) {
		const cards = [...block.config.cards];
		const card = cards[cardIndex];
		if (card.type === 'rich-contact-card') {
			cards[cardIndex] = { ...card, contacts: [...card.contacts, { icon: 'phone', text: '' }] };
			updateConfig('cards', cards);
		}
	}

	function updateContact(cardIndex: number, contactIndex: number, field: string, value: string) {
		const cards = [...block.config.cards];
		const card = cards[cardIndex];
		if (card.type === 'rich-contact-card') {
			const contacts = [...card.contacts];
			contacts[contactIndex] = { ...contacts[contactIndex], [field]: value };
			cards[cardIndex] = { ...card, contacts };
			updateConfig('cards', cards);
		}
	}

	function removeContact(cardIndex: number, contactIndex: number) {
		const cards = [...block.config.cards];
		const card = cards[cardIndex];
		if (card.type === 'rich-contact-card') {
			cards[cardIndex] = {
				...card,
				contacts: card.contacts.filter((_, i) => i !== contactIndex)
			};
			updateConfig('cards', cards);
		}
	}

	function addAdditionalLink(cardIndex: number) {
		const cards = [...block.config.cards];
		const card = cards[cardIndex];
		if (card.type === 'rich-contact-card') {
			const additionalLinks = card.additionalLinks || [];
			cards[cardIndex] = { ...card, additionalLinks: [...additionalLinks, ''] };
			updateConfig('cards', cards);
		}
	}

	function updateAdditionalLink(cardIndex: number, linkIndex: number, value: string) {
		const cards = [...block.config.cards];
		const card = cards[cardIndex];
		if (card.type === 'rich-contact-card') {
			const additionalLinks = [...(card.additionalLinks || [])];
			additionalLinks[linkIndex] = value;
			cards[cardIndex] = { ...card, additionalLinks };
			updateConfig('cards', cards);
		}
	}

	function removeAdditionalLink(cardIndex: number, linkIndex: number) {
		const cards = [...block.config.cards];
		const card = cards[cardIndex];
		if (card.type === 'rich-contact-card') {
			cards[cardIndex] = {
				...card,
				additionalLinks: (card.additionalLinks || []).filter((_, i) => i !== linkIndex)
			};
			updateConfig('cards', cards);
		}
	}
</script>

<div class="space-y-4">
	<!-- Grid Settings -->
	<div class="grid grid-cols-3 gap-4">
		<div>
			<label for="grid-cols" class="mb-1 block text-sm font-medium text-gray-700">Колонки</label>
			<select
				id="grid-cols"
				value={block.config.cols}
				onchange={(e) =>
					updateConfig('cols', e.currentTarget.value as '1' | '2' | '3' | '24')}
				class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			>
				<option value="1">1 колонка</option>
				<option value="2">2 колонки</option>
				<option value="3">3 колонки</option>
				<option value="24">2/4 колонки (асимметрия)</option>
			</select>
		</div>

		<div>
			<label for="grid-gap" class="mb-1 block text-sm font-medium text-gray-700">Отступы</label>
			<select
				id="grid-gap"
				value={block.config.gap || 'md'}
				onchange={(e) =>
					updateConfig('gap', e.currentTarget.value as 'sm' | 'md' | 'lg' | undefined)}
				class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			>
				<option value="sm">Малые</option>
				<option value="md">Средние</option>
				<option value="lg">Большие</option>
			</select>
		</div>

		<div>
			<label class="mb-1 flex cursor-pointer items-center gap-2">
				<input
					type="checkbox"
					checked={block.config.responsive ?? true}
					onchange={(e) => updateConfig('responsive', e.currentTarget.checked)}
					class="h-4 w-4 rounded border-gray-300"
				/>
				<span class="text-sm font-medium text-gray-700">Адаптивная сетка</span>
			</label>
		</div>
	</div>

	<div>
		<label for="grid-class" class="mb-1 block text-sm font-medium text-gray-700">
			Дополнительные CSS классы
		</label>
		<input
			id="grid-class"
			type="text"
			value={block.config.className || ''}
			oninput={(e) => updateConfig('className', e.currentTarget.value || undefined)}
			class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			placeholder="gap-8 p-4"
		/>
	</div>

	<!-- Cards -->
	<div>
		<div class="mb-2 flex items-center justify-between">
			<label class="block text-sm font-medium text-gray-700">Карточки</label>
			<div class="flex gap-2">
				<button
					onclick={() => addCard('list-card')}
					class="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
					type="button"
					title="Карточка со списком"
				>
					+ Список
				</button>
				<button
					onclick={() => addCard('icon-card')}
					class="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
					type="button"
					title="Карточка с иконкой"
				>
					+ Иконка
				</button>
				<button
					onclick={() => addCard('contact-card')}
					class="rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700"
					type="button"
					title="Карточка контакта"
				>
					+ Контакт
				</button>
				<button
					onclick={() => addCard('link-card')}
					class="rounded bg-orange-600 px-2 py-1 text-xs text-white hover:bg-orange-700"
					type="button"
					title="Карточка со ссылкой"
				>
					+ Ссылка
				</button>
				<button
					onclick={() => addCard('rich-contact-card')}
					class="rounded bg-teal-600 px-2 py-1 text-xs text-white hover:bg-teal-700"
					type="button"
					title="Карточка контактов с иконками"
				>
					+ Контакты+
				</button>
			</div>
		</div>

		<div class="space-y-3">
			{#each block.config.cards as card, cardIndex (cardIndex)}
				<div
					class="rounded border p-3 {card.type === 'list-card'
						? 'border-blue-200 bg-blue-50'
						: card.type === 'icon-card'
							? 'border-green-200 bg-green-50'
							: card.type === 'contact-card'
								? 'border-purple-200 bg-purple-50'
								: card.type === 'rich-contact-card'
									? 'border-teal-200 bg-teal-50'
									: 'border-orange-200 bg-orange-50'}"
				>
					<div class="mb-2 flex items-center justify-between">
						<span class="text-xs font-medium uppercase text-gray-500">
							{card.type === 'list-card'
								? 'Список'
								: card.type === 'icon-card'
									? 'Иконка'
									: card.type === 'contact-card'
										? 'Контакт'
										: card.type === 'rich-contact-card'
											? 'Контакты+'
											: 'Ссылка'}
							#{cardIndex + 1}
						</span>
						<button
							onclick={() => removeCard(cardIndex)}
							class="rounded p-1 text-red-600 hover:bg-red-100"
							type="button"
							aria-label="Удалить карточку"
						>
							<span class="icon-[lucide--trash-2] h-4 w-4"></span>
						</button>
					</div>

					<div class="space-y-2">
						{#if card.type === 'list-card'}
							<input
								type="text"
								value={card.title}
								oninput={(e) => updateCard(cardIndex, 'title', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Заголовок"
							/>
							<div>
								<div class="mb-1 flex items-center justify-between">
									<label class="text-xs font-medium text-gray-700">Пункты</label>
									<button
										onclick={() => addPoint(cardIndex)}
										class="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-200"
										type="button"
									>
										+ Пункт
									</button>
								</div>
								<div class="space-y-1">
									{#each card.points as point, pointIndex (pointIndex)}
										<div class="flex gap-2">
											<input
												type="text"
												value={point}
												oninput={(e) => updatePoint(cardIndex, pointIndex, e.currentTarget.value)}
												class="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
												placeholder="Пункт списка"
											/>
											<button
												onclick={() => removePoint(cardIndex, pointIndex)}
												class="rounded p-1 text-red-600 hover:bg-red-100"
												type="button"
												disabled={card.points.length === 1}
												aria-label="Удалить пункт"
											>
												<span class="icon-[lucide--x] h-3 w-3"></span>
											</button>
										</div>
									{/each}
								</div>
							</div>
							<input
								type="text"
								value={card.gridClass || ''}
								oninput={(e) => updateCard(cardIndex, 'gridClass', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Grid классы (опц.)"
							/>
						{:else if card.type === 'icon-card'}
							<input
								type="text"
								value={card.icon || ''}
								oninput={(e) => updateCard(cardIndex, 'icon', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Иконка (опц.)"
							/>
							<input
								type="text"
								value={card.highlight}
								oninput={(e) => updateCard(cardIndex, 'highlight', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Выделенный текст"
							/>
							<textarea
								value={card.text}
								oninput={(e) => updateCard(cardIndex, 'text', e.currentTarget.value)}
								rows="2"
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Текст"
							></textarea>
							<input
								type="text"
								value={card.gridClass || ''}
								oninput={(e) => updateCard(cardIndex, 'gridClass', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Grid классы (опц.)"
							/>
						{:else if card.type === 'contact-card'}
							<input
								type="text"
								value={card.title}
								oninput={(e) => updateCard(cardIndex, 'title', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Заголовок"
							/>
							<input
								type="text"
								value={card.phone}
								oninput={(e) => updateCard(cardIndex, 'phone', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Телефон"
							/>
							<input
								type="text"
								value={card.link}
								oninput={(e) => updateCard(cardIndex, 'link', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Ссылка (tel:...)"
							/>
						{:else if card.type === 'link-card'}
							<input
								type="text"
								value={card.title}
								oninput={(e) => updateCard(cardIndex, 'title', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Заголовок"
							/>
							<textarea
								value={card.description}
								oninput={(e) => updateCard(cardIndex, 'description', e.currentTarget.value)}
								rows="2"
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Описание"
							></textarea>
							<input
								type="text"
								value={card.link}
								oninput={(e) => updateCard(cardIndex, 'link', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="URL ссылки"
							/>
							<input
								type="text"
								value={card.cta || ''}
								oninput={(e) => updateCard(cardIndex, 'cta', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Текст кнопки (опц.)"
							/>
						{:else if card.type === 'rich-contact-card'}
							<input
								type="text"
								value={card.title}
								oninput={(e) => updateCard(cardIndex, 'title', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Заголовок (например: как со мной связаться)"
							/>

							<!-- Intro Text -->
							<div>
								<div class="mb-1 flex items-center justify-between">
									<label class="text-xs font-medium text-gray-700">Вступительный текст</label>
									<button
										onclick={() => addIntroText(cardIndex)}
										class="rounded bg-teal-100 px-2 py-0.5 text-xs text-teal-700 hover:bg-teal-200"
										type="button"
									>
										+ Параграф
									</button>
								</div>
								<div class="space-y-1">
									{#each card.introText || [] as text, textIndex}
										<div class="flex gap-2">
											<textarea
												value={text}
												oninput={(e) => updateIntroText(cardIndex, textIndex, e.currentTarget.value)}
												rows="2"
												class="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
												placeholder="Текст параграфа (поддерживает markdown)"
											></textarea>
											<button
												onclick={() => removeIntroText(cardIndex, textIndex)}
												class="rounded p-1 text-red-600 hover:bg-red-100"
												type="button"
												aria-label="Удалить параграф"
											>
												<span class="icon-[lucide--x] h-3 w-3"></span>
											</button>
										</div>
									{/each}
								</div>
							</div>

							<!-- Contacts -->
							<div>
								<div class="mb-1 flex items-center justify-between">
									<label class="text-xs font-medium text-gray-700">Контакты</label>
									<button
										onclick={() => addContact(cardIndex)}
										class="rounded bg-teal-100 px-2 py-0.5 text-xs text-teal-700 hover:bg-teal-200"
										type="button"
									>
										+ Контакт
									</button>
								</div>
								<div class="space-y-2">
									{#each card.contacts as contact, contactIndex}
										<div class="rounded border border-teal-200 bg-white p-2">
											<div class="mb-1 flex items-center justify-between">
												<span class="text-xs font-medium text-gray-600">Контакт #{contactIndex + 1}</span>
												<button
													onclick={() => removeContact(cardIndex, contactIndex)}
													class="rounded p-1 text-red-600 hover:bg-red-100"
													type="button"
													aria-label="Удалить контакт"
												>
													<span class="icon-[lucide--trash-2] h-3 w-3"></span>
												</button>
											</div>
											<div class="space-y-1">
												<input
													type="text"
													value={contact.icon}
													oninput={(e) =>
														updateContact(cardIndex, contactIndex, 'icon', e.currentTarget.value)}
													class="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
													placeholder="Иконка (phone, message-circle, mail)"
												/>
												<textarea
													value={contact.text}
													oninput={(e) =>
														updateContact(cardIndex, contactIndex, 'text', e.currentTarget.value)}
													rows="2"
													class="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
													placeholder="Текст с ссылкой: [+7 906 537-82-41](https://...)"
												></textarea>
											</div>
										</div>
									{/each}
								</div>
							</div>

							<!-- Additional Links -->
							<div>
								<div class="mb-1 flex items-center justify-between">
									<label class="text-xs font-medium text-gray-700">Дополнительные ссылки</label>
									<button
										onclick={() => addAdditionalLink(cardIndex)}
										class="rounded bg-teal-100 px-2 py-0.5 text-xs text-teal-700 hover:bg-teal-200"
										type="button"
									>
										+ Ссылка
									</button>
								</div>
								<div class="space-y-1">
									{#each card.additionalLinks || [] as link, linkIndex}
										<div class="flex gap-2">
											<input
												type="text"
												value={link}
												oninput={(e) => updateAdditionalLink(cardIndex, linkIndex, e.currentTarget.value)}
												class="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
												placeholder="[Текст ссылки](https://...)"
											/>
											<button
												onclick={() => removeAdditionalLink(cardIndex, linkIndex)}
												class="rounded p-1 text-red-600 hover:bg-red-100"
												type="button"
												aria-label="Удалить ссылку"
											>
												<span class="icon-[lucide--x] h-3 w-3"></span>
											</button>
										</div>
									{/each}
								</div>
							</div>

							<input
								type="text"
								value={card.gridClass || ''}
								oninput={(e) => updateCard(cardIndex, 'gridClass', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Grid классы (опц.)"
							/>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
