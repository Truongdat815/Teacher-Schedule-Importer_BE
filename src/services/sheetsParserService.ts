/**
 * Excel Master Sheet Parser Service
 * 
 * Parses the wide Capstone Project Master Sheet and extracts:
 * - Static project information (topic code, group code, mentors)
 * - 6 stage events (REV1, REV2, REV3, SUPERVISOR, DEF1, DEF2)
 * - Conflict information and metadata per stage
 */

export interface ParsedCapstoneProject {
  // Static project info
  topicCode: string;
  groupCode: string;
  topicNameEn: string;
  topicNameVi: string;
  mentor: string;
  mentor1?: string;
  mentor2?: string;

  // Parsed events (6 stages)
  events: ParsedProjectEvent[];
}

export interface ParsedProjectEvent {
  stage: 'REV1' | 'REV2' | 'REV3' | 'SUPERVISOR' | 'DEF1' | 'DEF2';
  
  // Council/Reviewer info
  councilCode?: string;
  reviewer1?: string;
  reviewer2?: string;
  
  // Timing
  date?: string; // ISO format YYYY-MM-DD or null if not provided
  slot?: string;
  room?: string;
  
  // Conflict/Metadata
  conflict?: boolean;
  conflictSupervisor?: string;
  matchReview2?: string;
  conflict1?: string;
  conflict2?: string;
  reviewerCheck?: string;
  
  // Defense-specific
  defenseList?: string;
  groupCount?: number;
  state?: string;
  
  // Metadata
  review3SupervisorDiff?: string;
  supervisorDefense1Diff?: string;
  
  // Result
  result?: string;
  count?: number;
}

/**
 * Parse Excel row data (as array of cells or object)
 * Expected input: Google Sheets API response or array of column values
 * 
 * Columns mapping (based on provided screenshot):
 * A: STT (index/skip)
 * B: Mã đề tài
 * C: Mã nhóm
 * D: Tên đề tài (En/JP)
 * E: Tên đề tài (Vi)
 * F-I: GVHD (mentor info spans multiple columns, we'll take first non-empty)
 * J-K: GVHD1
 * L-M: GVHD2
 * N-X: REVIEW 1 section (Code, Count, Reviewer1, Reviewer2, Conflict, Date, Day, Slot, Room, Result...)
 * T-AB: REVIEW 2 section (Code, Reviewer1, Reviewer2, Date, Slot, Room, Count, Result)
 * AC-AL: REVIEW 3 section (Mã HĐ, Count, Reviewer1, Reviewer2, Conflict Supervisor, Match Review2, Date, Slot, Room, Result)
 * AM: Supervisor Result
 * AN-AW: DEFENSE 1 section (Mã HĐ, Danh sách, Group Count, Conflict1, Conflict2, Reviewer Check, State, Result, Diffs)
 * AX-BE: DEFENSE 2 section (Mã HĐ, Danh sách, Group Count, Conflict1, Conflict2, Reviewer Check, State, Result)
 */
export const parseCapstoneRow = (rowData: Record<string, any>): ParsedCapstoneProject => {
  // Helper to safely get column value
  const getCell = (key: string, defaultVal: any = null) => {
    const val = rowData[key];
    if (val === undefined || val === null || val === '') return defaultVal;
    return val;
  };

  // ============ STATIC PROJECT INFO ============
  const topicCode = getCell('B', '');
  const groupCode = getCell('C', '');
  const topicNameEn = getCell('D', '');
  const topicNameVi = getCell('E', '');
  
  // GVHD info (may span multiple columns)
  const mentor = getCell('F') || getCell('G') || getCell('H') || getCell('I') || '';
  const mentor1 = getCell('J') || getCell('K') || '';
  const mentor2 = getCell('L') || getCell('M') || '';

  // ============ REVIEW 1 ============
  const rev1: ParsedProjectEvent = {
    stage: 'REV1',
    councilCode: getCell('N'),     // Code
    count: getCell('O'),            // Count
    reviewer1: getCell('P'),        // Reviewer 1
    reviewer2: getCell('Q'),        // Reviewer 2
    conflict: parseBoolean(getCell('R')),  // Conflict
    date: parseDate(getCell('S')),  // Date
    // Skip T: Day Of Week (redundant)
    slot: getCell('U'),             // Slot
    room: getCell('V'),             // Room
    result: getCell('W'),           // Result
  };

  // ============ REVIEW 2 ============
  const rev2: ParsedProjectEvent = {
    stage: 'REV2',
    councilCode: getCell('X'),      // Code
    reviewer1: getCell('Y'),        // Reviewer 1
    reviewer2: getCell('Z'),        // Reviewer 2
    date: parseDate(getCell('AA')), // Date
    slot: getCell('AB'),            // Slot
    room: getCell('AC'),            // Room
    count: getCell('AD'),           // Count
    result: getCell('AE'),          // Result
  };

  // ============ REVIEW 3 ============
  const rev3: ParsedProjectEvent = {
    stage: 'REV3',
    councilCode: getCell('AF'),     // Mã HĐ (Council Code)
    count: getCell('AG'),           // Count
    reviewer1: getCell('AH'),       // Reviewer 1
    reviewer2: getCell('AI'),       // Reviewer 2
    conflictSupervisor: getCell('AJ'), // Conflict Supervisor
    matchReview2: getCell('AK'),    // Match Review2
    date: parseDate(getCell('AL')), // Date
    slot: getCell('AM'),            // Slot
    room: getCell('AN'),            // Room
    result: getCell('AO'),          // Result
  };

  // ============ SUPERVISOR ============
  const supervisor: ParsedProjectEvent = {
    stage: 'SUPERVISOR',
    result: getCell('AP'),          // Supervisor Result
  };

  // ============ DEFENSE 1 ============
  const def1: ParsedProjectEvent = {
    stage: 'DEF1',
    councilCode: getCell('AQ'),     // Mã HĐ
    defenseList: getCell('AR'),     // Danh sách
    groupCount: parseNumber(getCell('AS')), // Group Count
    conflict1: getCell('AT'),       // Conflict1
    conflict2: getCell('AU'),       // Conflict2
    reviewerCheck: getCell('AV'),   // Reviewer Check
    state: getCell('AW'),           // State
    result: getCell('AX'),          // Result
    review3SupervisorDiff: getCell('AY'),    // Review3 - Supervisor Diff
    supervisorDefense1Diff: getCell('AZ'),  // Supervisor - Defense1
  };

  // ============ DEFENSE 2 ============
  const def2: ParsedProjectEvent = {
    stage: 'DEF2',
    councilCode: getCell('BA'),     // Mã HĐ
    defenseList: getCell('BB'),     // Danh sách
    groupCount: parseNumber(getCell('BC')), // Group Count
    conflict1: getCell('BD'),       // Conflict1
    conflict2: getCell('BE'),       // Conflict2
    reviewerCheck: getCell('BF'),   // Reviewer Check
    state: getCell('BG'),           // State
    result: getCell('BH'),          // Result
  };

  // ============ ASSEMBLE ============
  return {
    topicCode,
    groupCode,
    topicNameEn,
    topicNameVi,
    mentor,
    mentor1: mentor1 || undefined,
    mentor2: mentor2 || undefined,
    events: [rev1, rev2, rev3, supervisor, def1, def2].filter(
      (event) => hasValidEventData(event)
    ),
  };
};

/**
 * Check if event has any meaningful data
 * An event is valid if it has at least one field with data
 */
function hasValidEventData(event: ParsedProjectEvent): boolean {
  const {
    stage,
    councilCode,
    reviewer1,
    reviewer2,
    date,
    slot,
    room,
    result,
    conflict,
    conflictSupervisor,
    matchReview2,
    conflict1,
    conflict2,
    reviewerCheck,
    defenseList,
    groupCount,
    state,
    ...rest
  } = event;

  // Check if any data field is non-empty
  return !!(
    councilCode ||
    reviewer1 ||
    reviewer2 ||
    date ||
    slot ||
    room ||
    result ||
    conflict ||
    conflictSupervisor ||
    matchReview2 ||
    conflict1 ||
    conflict2 ||
    reviewerCheck ||
    defenseList ||
    groupCount ||
    state
  );
}

/**
 * Parse date from Excel/Sheets format to ISO string
 * Handles: "1/22/2026", "2026-01-22", Date object, null
 */
function parseDate(value: any): string | undefined {
  if (!value) return undefined;

  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'string') {
    // Try MM/DD/YYYY format (Excel default)
    const match = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const [, month, day, year] = match;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Try YYYY-MM-DD format
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return value;
    }
  }

  return undefined;
}

/**
 * Parse boolean from various formats
 */
function parseBoolean(value: any): boolean | undefined {
  if (value === null || value === undefined || value === '') return undefined;

  if (typeof value === 'boolean') return value;
  
  if (typeof value === 'string') {
    return ['true', 'yes', '1', 'TRUE', 'TRUE', 'Yes'].includes(value.trim());
  }

  return !!value;
}

/**
 * Parse number
 */
function parseNumber(value: any): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;

  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

/**
 * Generate calendar event title for a stage
 */
export const generateEventTitle = (
  stage: string,
  groupCode: string,
  topicCode: string
): string => {
  return `[${stage}] ${groupCode} - ${topicCode}`;
};

/**
 * Generate calendar event description for a stage
 */
export const generateEventDescription = (
  topic: ParsedCapstoneProject,
  event: ParsedProjectEvent
): string => {
  const lines = [
    `Topic: ${topic.topicNameVi}`,
    `Code: ${topic.topicCode}`,
  ];

  if (topic.mentor) lines.push(`Mentor: ${topic.mentor}`);
  if (event.room) lines.push(`Room: ${event.room}`);
  if (event.slot) lines.push(`Slot: ${event.slot}`);
  if (event.reviewer1 || event.reviewer2) {
    const reviewers = [event.reviewer1, event.reviewer2].filter(Boolean).join(', ');
    lines.push(`Reviewers: ${reviewers}`);
  }
  if (event.result) lines.push(`Result: ${event.result}`);
  if (event.councilCode) lines.push(`Council: ${event.councilCode}`);

  return lines.join('\n');
};
