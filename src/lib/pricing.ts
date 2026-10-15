// Общий тип для отображения и безопасной оплаты. Суммы хранятся целыми рублями.
export type ServicePrices = { single: number; package: number };

export function formatRubles(rubles: number): string {
	return `${rubles.toLocaleString('ru-RU')} ₽`;
}

export function toPaymentAmount(rubles: number): string {
	return rubles.toFixed(2);
}
