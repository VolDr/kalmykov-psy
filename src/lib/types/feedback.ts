import { z } from 'zod';

export const feedbackSchema = z.object({
	smallId: z.string().min(4),
	attitude: z.coerce.number().min(0).max(10),
	generally: z.coerce.number().min(0).max(10),
	goals: z.coerce.number().min(0).max(10),
	method: z.coerce.number().min(0).max(10),
	sendingType: z.literal('feedback'),
	actionType: z
		.union([z.literal('on'), z.literal('off'), z.literal('enable'), z.literal('disable')])
		.optional()
});

export type Feedback = z.infer<typeof feedbackSchema>;
