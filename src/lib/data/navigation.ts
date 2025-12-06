export interface NavigationLink {
	link: string;
	label: string;
	external?: boolean;
}

export const navigationLinks: NavigationLink[] = [
	{ link: '/', label: 'Обо мне' },
	{ link: '/online-therapy', label: 'Процесс консультирования' },
	{ link: 'https://t.me/kalmykov_psy/60', label: 'Тест на уровень выгорания', external: true },
	{ link: '/articles', label: 'Статьи' },
	{ link: '/surveys', label: 'Опросники' },
	{ link: '/sos', label: 'Экстренная помощь' },
	{ link: '/for-doctors', label: 'Врачам' }
];

export interface SocialLink {
	link: string;
	label: string;
	ariaLabel: string;
}

export const socialLinks: SocialLink[] = [
	{
		link: 'https://api.whatsapp.com/send?phone=79065378241',
		label: 'WhatsApp',
		ariaLabel: 'Написать в WhatsApp'
	},
	{
		link: 'https://t.me/psy_kalmykov',
		label: 'Telegram',
		ariaLabel: 'Написать в Telegram'
	}
];

export const footerInfo = {
	name: 'Калмыков Андрей Викторович',
	inn: 'ИНН 710710030502'
};

export const telegramChannel = {
	link: 'https://t.me/kalmykov_psy',
	text: 'Мой тг-канал со всяким полезным — [тык]({link})'
};
