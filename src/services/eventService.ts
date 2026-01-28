import prisma from '../config/prisma';
import crypto from 'crypto';

export interface CreateEventMappingInput {
  userId: string;
  sheetId: string;
  tabName: string;
  rowNumber: number;
  title: string;
  startTime: Date;
  endTime: Date;
  attributes?: Array<{
    key: string;
    value: string;
    role?: string;
  }>;
}

export interface UpdateEventMappingInput {
  title?: string;
  startTime?: Date;
  endTime?: Date;
  googleEventId?: string;
  syncStatus?: string;
  attributes?: Array<{
    key: string;
    value: string;
    role?: string;
  }>;
}

/**
 * Generate hash for idempotency check
 */
const generateSheetRowHash = (
  sheetId: string,
  tabName: string,
  rowNumber: number,
  title: string,
  startTime: Date,
  endTime: Date
): string => {
  const content = `${sheetId}|${tabName}|${rowNumber}|${title}|${startTime.toISOString()}|${endTime.toISOString()}`;
  return crypto.createHash('md5').update(content).digest('hex');
};

/**
 * Create or update event mapping (idempotent)
 */
export const upsertEventMapping = async (input: CreateEventMappingInput) => {
  const sheetRowHash = generateSheetRowHash(
    input.sheetId,
    input.tabName,
    input.rowNumber,
    input.title,
    input.startTime,
    input.endTime
  );

  // Ensure user exists (create if not exists)
  // Note: User must have unique email, so we check first
  let user = await prisma.user.findUnique({
    where: { id: input.userId },
  });

  if (!user) {
    // Try to find by email pattern or create new
    const tempEmail = `${input.userId}@temp.local`;
    user = await prisma.user.upsert({
      where: { email: tempEmail },
      update: {},
      create: {
        id: input.userId,
        email: tempEmail,
        name: 'Temp User',
      },
    });
  }

  // Check if event already exists
  const existing = await prisma.eventMapping.findUnique({
    where: { sheetRowHash },
    include: { attributes: true },
  });

  if (existing) {
    // Update existing event
    return await prisma.eventMapping.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        startTime: input.startTime,
        endTime: input.endTime,
        lastSyncedAt: new Date(),
        attributes: {
          deleteMany: {},
          create: input.attributes || [],
        },
      },
      include: { attributes: true },
    });
  }

  // Create new event
  return await prisma.eventMapping.create({
    data: {
      userId: user.id,
      sheetId: input.sheetId,
      tabName: input.tabName,
      rowNumber: input.rowNumber,
      sheetRowHash,
      title: input.title,
      startTime: input.startTime,
      endTime: input.endTime,
      syncStatus: 'pending',
      attributes: {
        create: input.attributes || [],
      },
    },
    include: { attributes: true },
  });
};

/**
 * Get all event mappings for a user
 */
export const getUserEventMappings = async (userId: string) => {
  return await prisma.eventMapping.findMany({
    where: { userId },
    include: { attributes: true },
    orderBy: { startTime: 'asc' },
  });
};

/**
 * Get event mapping by ID
 */
export const getEventMappingById = async (id: string) => {
  const event = await prisma.eventMapping.findUnique({
    where: { id },
    include: { attributes: true },
  });
  return event;
};

/**
 * Update event mapping
 */
export const updateEventMapping = async (
  id: string,
  input: UpdateEventMappingInput
) => {
  const updateData: any = {
    ...(input.title && { title: input.title }),
    ...(input.startTime && { startTime: input.startTime }),
    ...(input.endTime && { endTime: input.endTime }),
    ...(input.googleEventId !== undefined && { googleEventId: input.googleEventId }),
    ...(input.syncStatus && { syncStatus: input.syncStatus }),
    lastSyncedAt: new Date(),
  };

  if (input.attributes) {
    updateData.attributes = {
      deleteMany: {},
      create: input.attributes,
    };
  }

  return await prisma.eventMapping.update({
    where: { id },
    data: updateData,
    include: { attributes: true },
  });
};

/**
 * Delete event mapping
 */
export const deleteEventMapping = async (id: string) => {
  return await prisma.eventMapping.delete({
    where: { id },
  });
};

/**
 * Get events by sync status
 */
export const getEventsBySyncStatus = async (status: string) => {
  return await prisma.eventMapping.findMany({
    where: { syncStatus: status },
    include: { attributes: true },
    orderBy: { startTime: 'asc' },
  });
};

/**
 * Update sync status after Google Calendar sync
 */
export const updateSyncStatus = async (
  id: string,
  googleEventId: string | null,
  status: 'success' | 'failed'
) => {
  return await prisma.eventMapping.update({
    where: { id },
    data: {
      googleEventId,
      syncStatus: status,
      lastSyncedAt: new Date(),
    },
  });
};
