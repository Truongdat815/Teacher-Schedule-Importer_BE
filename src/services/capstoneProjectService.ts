/**
 * Capstone Project Service
 * 
 * Handles:
 * - Create or update CapstoneProject based on sheetRowHash (idempotency)
 * - Manage related ProjectEvent records
 * - Sync status tracking
 */

import prisma from '../config/prisma';
import crypto from 'crypto';
import { ParsedCapstoneProject, ParsedProjectEvent } from './sheetsParserService';

/**
 * Generate hash for row idempotency
 * Hash includes: sheetId, tabName, rowNumber, static project info
 */
export const generateProjectHash = (
  sheetId: string,
  tabName: string,
  rowNumber: number,
  topicCode: string,
  groupCode: string,
  topicNameEn: string,
  topicNameVi: string,
  mentor: string,
  mentor1: string = '',
  mentor2: string = ''
): string => {
  const content = `${sheetId}|${tabName}|${rowNumber}|${topicCode}|${groupCode}|${topicNameEn}|${topicNameVi}|${mentor}|${mentor1}|${mentor2}`;
  return crypto.createHash('md5').update(content).digest('hex');
};

/**
 * Upsert Capstone Project and its events
 * 
 * Logic:
 * 1. Check if project exists by sheetRowHash
 * 2. If exists: update static info, then upsert all events
 * 3. If not exists: create project, then create all events
 * 
 * Idempotency: Safe to call multiple times with same data
 */
export const upsertCapstoneProject = async (
  userId: string,
  sheetId: string,
  tabName: string,
  rowNumber: number,
  parsedData: ParsedCapstoneProject
) => {
  const sheetRowHash = generateProjectHash(
    sheetId,
    tabName,
    rowNumber,
    parsedData.topicCode,
    parsedData.groupCode,
    parsedData.topicNameEn,
    parsedData.topicNameVi,
    parsedData.mentor,
    parsedData.mentor1 || '',
    parsedData.mentor2 || ''
  );

  // Check if project already exists
  const existingProject = await prisma.capstoneProject.findUnique({
    where: { sheetRowHash },
    include: { events: true },
  });

  // Upsert project (create or update)
  const project = await prisma.capstoneProject.upsert({
    where: { sheetRowHash },
    update: {
      topicCode: parsedData.topicCode,
      groupCode: parsedData.groupCode,
      topicNameEn: parsedData.topicNameEn,
      topicNameVi: parsedData.topicNameVi,
      mentor: parsedData.mentor,
      mentor1: parsedData.mentor1,
      mentor2: parsedData.mentor2,
      updatedAt: new Date(),
    },
    create: {
      userId,
      sheetId,
      tabName,
      rowNumber,
      sheetRowHash,
      topicCode: parsedData.topicCode,
      groupCode: parsedData.groupCode,
      topicNameEn: parsedData.topicNameEn,
      topicNameVi: parsedData.topicNameVi,
      mentor: parsedData.mentor,
      mentor1: parsedData.mentor1,
      mentor2: parsedData.mentor2,
    },
    include: { events: true },
  });

  // Upsert events (one for each stage)
  const updatedEvents = await Promise.all(
    parsedData.events.map((eventData) =>
      upsertProjectEvent(project.id, eventData)
    )
  );

  return {
    project,
    events: updatedEvents,
  };
};

/**
 * Upsert a single ProjectEvent
 * Constraint: One project can only have one event per stage
 */
export const upsertProjectEvent = async (
  projectId: string,
  eventData: ParsedProjectEvent
) => {
  return await prisma.projectEvent.upsert({
    where: {
      projectId_stage: {
        projectId,
        stage: eventData.stage,
      },
    },
    update: {
      councilCode: eventData.councilCode,
      reviewer1: eventData.reviewer1,
      reviewer2: eventData.reviewer2,
      date: eventData.date ? new Date(eventData.date) : null,
      slot: eventData.slot,
      room: eventData.room,
      conflict: eventData.conflict,
      conflictSupervisor: eventData.conflictSupervisor,
      matchReview2: eventData.matchReview2,
      conflict1: eventData.conflict1,
      conflict2: eventData.conflict2,
      reviewerCheck: eventData.reviewerCheck,
      defenseList: eventData.defenseList,
      groupCount: eventData.groupCount,
      state: eventData.state,
      review3SupervisorDiff: eventData.review3SupervisorDiff,
      supervisorDefense1Diff: eventData.supervisorDefense1Diff,
      result: eventData.result,
      updatedAt: new Date(),
    },
    create: {
      projectId,
      stage: eventData.stage,
      councilCode: eventData.councilCode,
      reviewer1: eventData.reviewer1,
      reviewer2: eventData.reviewer2,
      date: eventData.date ? new Date(eventData.date) : null,
      slot: eventData.slot,
      room: eventData.room,
      conflict: eventData.conflict,
      conflictSupervisor: eventData.conflictSupervisor,
      matchReview2: eventData.matchReview2,
      conflict1: eventData.conflict1,
      conflict2: eventData.conflict2,
      reviewerCheck: eventData.reviewerCheck,
      defenseList: eventData.defenseList,
      groupCount: eventData.groupCount,
      state: eventData.state,
      review3SupervisorDiff: eventData.review3SupervisorDiff,
      supervisorDefense1Diff: eventData.supervisorDefense1Diff,
      result: eventData.result,
    },
  });
};

/**
 * Get project with all events
 */
export const getCapstoneProject = async (projectId: string) => {
  return await prisma.capstoneProject.findUnique({
    where: { id: projectId },
    include: { events: true },
  });
};

/**
 * Get project event by id
 */
export const getProjectEvent = async (eventId: string) => {
  return await prisma.projectEvent.findUnique({
    where: { id: eventId },
  });
};

/**
 * Get all events for a project
 */
export const getProjectEvents = async (projectId: string) => {
  return await prisma.projectEvent.findMany({
    where: { projectId },
    orderBy: { stage: 'asc' },
  });
};

/**
 * Get events by stage (e.g., all "REV1" events for a user)
 */
export const getEventsByStage = async (
  userId: string,
  stage: string
) => {
  return await prisma.projectEvent.findMany({
    where: {
      stage,
      project: { userId },
    },
    include: { project: true },
    orderBy: { date: 'asc' },
  });
};

/**
 * Get events pending sync
 */
export const getEventsPendingSync = async (userId: string) => {
  return await prisma.projectEvent.findMany({
    where: {
      project: { userId },
      // Only get events with required fields for calendar sync
      AND: [
        { date: { not: null } },
        { slot: { not: null } },
        { room: { not: null } },
      ],
      // Only if not yet synced or sync failed
      OR: [
        { googleEventId: null },
        { syncStatus: 'failed' },
      ],
    },
    include: { project: true },
    orderBy: [{ date: 'asc' }, { stage: 'asc' }],
  });
};

/**
 * Update event sync status
 */
export const updateEventSyncStatus = async (
  eventId: string,
  googleEventId: string | null,
  status: 'success' | 'failed'
) => {
  return await prisma.projectEvent.update({
    where: { id: eventId },
    data: {
      googleEventId,
      syncStatus: status,
      lastSyncedAt: new Date(),
    },
  });
};

/**
 * Get all projects for a user
 */
export const getUserProjects = async (userId: string) => {
  return await prisma.capstoneProject.findMany({
    where: { userId },
    include: { events: true },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Delete project and cascade delete events
 */
export const deleteCapstoneProject = async (projectId: string) => {
  return await prisma.capstoneProject.delete({
    where: { id: projectId },
  });
};
