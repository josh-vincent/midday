import { relations } from "drizzle-orm/relations";
import { teams, activities, users, apps, customers, documentTags, invoices, invoiceTemplates, invoiceComments, jobs, notificationSettings, payments, reports, shortLinks, tags, userInvites, customerMaterialPricing, equipmentDefaults, materialDefaults, teamSettings, usersOnTeam } from "./schema";

export const activitiesRelations = relations(activities, ({one}) => ({
	team: one(teams, {
		fields: [activities.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [activities.userId],
		references: [users.id]
	}),
}));

export const teamsRelations = relations(teams, ({many}) => ({
	activities: many(activities),
	users: many(users),
	apps: many(apps),
	customers: many(customers),
	documentTags: many(documentTags),
	invoices: many(invoices),
	invoiceTemplates: many(invoiceTemplates),
	jobs: many(jobs),
	notificationSettings: many(notificationSettings),
	reports: many(reports),
	shortLinks: many(shortLinks),
	tags: many(tags),
	userInvites: many(userInvites),
	customerMaterialPricings: many(customerMaterialPricing),
	equipmentDefaults: many(equipmentDefaults),
	materialDefaults: many(materialDefaults),
	teamSettings: many(teamSettings),
	usersOnTeams: many(usersOnTeam),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	activities: many(activities),
	user: one(users, {
		fields: [users.id],
		references: [users.id],
		relationName: "users_id_users_id"
	}),
	users: many(users, {
		relationName: "users_id_users_id"
	}),
	team: one(teams, {
		fields: [users.teamId],
		references: [teams.id]
	}),
	apps: many(apps),
	invoices_createdBy: many(invoices, {
		relationName: "invoices_createdBy_users_id"
	}),
	invoices_userId: many(invoices, {
		relationName: "invoices_userId_users_id"
	}),
	invoiceComments: many(invoiceComments),
	jobs: many(jobs),
	notificationSettings: many(notificationSettings),
	payments: many(payments),
	reports: many(reports),
	shortLinks: many(shortLinks),
	userInvites: many(userInvites),
	usersOnTeams: many(usersOnTeam),
}));

export const appsRelations = relations(apps, ({one}) => ({
	user: one(users, {
		fields: [apps.createdBy],
		references: [users.id]
	}),
	team: one(teams, {
		fields: [apps.teamId],
		references: [teams.id]
	}),
}));

export const customersRelations = relations(customers, ({one, many}) => ({
	team: one(teams, {
		fields: [customers.teamId],
		references: [teams.id]
	}),
	invoices: many(invoices),
	jobs: many(jobs),
	customerMaterialPricings: many(customerMaterialPricing),
}));

export const documentTagsRelations = relations(documentTags, ({one}) => ({
	team: one(teams, {
		fields: [documentTags.teamId],
		references: [teams.id]
	}),
}));

export const invoicesRelations = relations(invoices, ({one, many}) => ({
	user_createdBy: one(users, {
		fields: [invoices.createdBy],
		references: [users.id],
		relationName: "invoices_createdBy_users_id"
	}),
	customer: one(customers, {
		fields: [invoices.customerId],
		references: [customers.id]
	}),
	team: one(teams, {
		fields: [invoices.teamId],
		references: [teams.id]
	}),
	invoiceTemplate: one(invoiceTemplates, {
		fields: [invoices.templateId],
		references: [invoiceTemplates.id]
	}),
	user_userId: one(users, {
		fields: [invoices.userId],
		references: [users.id],
		relationName: "invoices_userId_users_id"
	}),
	invoiceComments: many(invoiceComments),
	jobs: many(jobs),
	payments: many(payments),
}));

export const invoiceTemplatesRelations = relations(invoiceTemplates, ({one, many}) => ({
	invoices: many(invoices),
	team: one(teams, {
		fields: [invoiceTemplates.teamId],
		references: [teams.id]
	}),
}));

export const invoiceCommentsRelations = relations(invoiceComments, ({one}) => ({
	invoice: one(invoices, {
		fields: [invoiceComments.invoiceId],
		references: [invoices.id]
	}),
	user: one(users, {
		fields: [invoiceComments.userId],
		references: [users.id]
	}),
}));

export const jobsRelations = relations(jobs, ({one}) => ({
	user: one(users, {
		fields: [jobs.createdBy],
		references: [users.id]
	}),
	customer: one(customers, {
		fields: [jobs.customerId],
		references: [customers.id]
	}),
	invoice: one(invoices, {
		fields: [jobs.invoiceId],
		references: [invoices.id]
	}),
	team: one(teams, {
		fields: [jobs.teamId],
		references: [teams.id]
	}),
}));

export const notificationSettingsRelations = relations(notificationSettings, ({one}) => ({
	team: one(teams, {
		fields: [notificationSettings.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [notificationSettings.userId],
		references: [users.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	user: one(users, {
		fields: [payments.createdBy],
		references: [users.id]
	}),
	invoice: one(invoices, {
		fields: [payments.invoiceId],
		references: [invoices.id]
	}),
}));

export const reportsRelations = relations(reports, ({one}) => ({
	user: one(users, {
		fields: [reports.createdBy],
		references: [users.id]
	}),
	team: one(teams, {
		fields: [reports.teamId],
		references: [teams.id]
	}),
}));

export const shortLinksRelations = relations(shortLinks, ({one}) => ({
	team: one(teams, {
		fields: [shortLinks.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [shortLinks.userId],
		references: [users.id]
	}),
}));

export const tagsRelations = relations(tags, ({one}) => ({
	team: one(teams, {
		fields: [tags.teamId],
		references: [teams.id]
	}),
}));

export const userInvitesRelations = relations(userInvites, ({one}) => ({
	user: one(users, {
		fields: [userInvites.invitedBy],
		references: [users.id]
	}),
	team: one(teams, {
		fields: [userInvites.teamId],
		references: [teams.id]
	}),
}));

export const customerMaterialPricingRelations = relations(customerMaterialPricing, ({one}) => ({
	customer: one(customers, {
		fields: [customerMaterialPricing.customerId],
		references: [customers.id]
	}),
	team: one(teams, {
		fields: [customerMaterialPricing.teamId],
		references: [teams.id]
	}),
}));

export const equipmentDefaultsRelations = relations(equipmentDefaults, ({one}) => ({
	team: one(teams, {
		fields: [equipmentDefaults.teamId],
		references: [teams.id]
	}),
}));

export const materialDefaultsRelations = relations(materialDefaults, ({one}) => ({
	team: one(teams, {
		fields: [materialDefaults.teamId],
		references: [teams.id]
	}),
}));

export const teamSettingsRelations = relations(teamSettings, ({one}) => ({
	team: one(teams, {
		fields: [teamSettings.teamId],
		references: [teams.id]
	}),
}));

export const usersOnTeamRelations = relations(usersOnTeam, ({one}) => ({
	team: one(teams, {
		fields: [usersOnTeam.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [usersOnTeam.userId],
		references: [users.id]
	}),
}));