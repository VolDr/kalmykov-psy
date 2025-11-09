import { relations } from "drizzle-orm/relations";
import { source, client, activity, contact, contactType, currentState, feedback } from "./schema";

export const clientRelations = relations(client, ({one, many}) => ({
	source: one(source, {
		fields: [client.sourceId],
		references: [source.id]
	}),
	activities: many(activity),
	contacts: many(contact),
	currentStates: many(currentState),
	feedbacks: many(feedback),
}));

export const sourceRelations = relations(source, ({many}) => ({
	clients: many(client),
}));

export const activityRelations = relations(activity, ({one}) => ({
	client: one(client, {
		fields: [activity.clientId],
		references: [client.id]
	}),
}));

export const contactRelations = relations(contact, ({one}) => ({
	client: one(client, {
		fields: [contact.clientId],
		references: [client.id]
	}),
	contactType: one(contactType, {
		fields: [contact.contactTypeId],
		references: [contactType.id]
	}),
}));

export const contactTypeRelations = relations(contactType, ({many}) => ({
	contacts: many(contact),
}));

export const currentStateRelations = relations(currentState, ({one}) => ({
	client: one(client, {
		fields: [currentState.clientId],
		references: [client.id]
	}),
}));

export const feedbackRelations = relations(feedback, ({one}) => ({
	client: one(client, {
		fields: [feedback.clientId],
		references: [client.id]
	}),
}));