"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateJob = exports.getJob = exports.createJob = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
async function createJob(data) {
    const id = (0, crypto_1.randomUUID)();
    const newJob = { ...data, id, status: 'pending' };
    const result = await db_1.db.insert(schema_1.jobs).values(newJob).returning();
    return result[0];
}
exports.createJob = createJob;
async function getJob(id) {
    const result = await db_1.db.select().from(schema_1.jobs).where((0, drizzle_orm_1.eq)(schema_1.jobs.id, id)).limit(1);
    return result[0];
}
exports.getJob = getJob;
async function updateJob(id, data) {
    const result = await db_1.db.update(schema_1.jobs).set({ ...data, updatedAt: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.jobs.id, id)).returning();
    return result[0];
}
exports.updateJob = updateJob;
