import { z } from 'zod';

export const schemaRecordNewClient = z.object({
	name: z.string().min(1, { message: 'Введите имя' }),
	clientId: z.undefined(),
	source: z.string().min(1, { message: 'Поле нужно заполнить' }),
	phone: z.string().min(1, { message: 'Поле нужно заполнить' }),
	isNewClient: z.literal('on'),
	date: z.string().min(1, { message: 'Выберете дату' }),
	timestamp: z.string(),
	description: z.string().optional(),
	editActivityId: z.undefined(),
	gender: z.string().optional(),
	invocation: z.string().optional()
});

export const schemaRecordExistingClient = z.object({
	name: z.string().optional(),
	isNewClient: z.undefined(),
	phone: z.string().optional(),
	clientId: z.string(),
	source: z.string().optional(),
	date: z.string().min(1, { message: 'Выберете дату' }),
	timestamp: z.string(),
	description: z.string().optional(),
	editActivityId: z.string().optional()
});

export const schemaRecord = z.union([schemaRecordNewClient, schemaRecordExistingClient]);

export type RecordNewClient = z.infer<typeof schemaRecordNewClient>;
export type RecordExistingClient = z.infer<typeof schemaRecordExistingClient>;
export type Record = z.infer<typeof schemaRecord>;
