import { z } from 'zod';

export const currentStateSchema = z.object({
	smallId: z.string().min(4),
	family: z.coerce.number().min(0).max(10),
	generally: z.coerce.number().min(0).max(10),
	individual: z.coerce.number().min(0).max(10),
	social: z.coerce.number().min(0).max(10),
	sendingType: z.literal('currentState'),
	actionType: z
		.union([z.literal('on'), z.literal('off'), z.literal('enable'), z.literal('disable')])
		.optional()
});

export type CurrentState = z.infer<typeof currentStateSchema>;
