/** Business rules for working time (BRD §2, §6). Read these — never hardcode. */

/** Daily working target: 9 hours (includes lunch and breaks per company policy). */
export const DAILY_GOAL_MINUTES = 9 * 60; // 540

/** Working days used for the weekly target. */
export const WEEKLY_WORKING_DAYS = 5;

/** Weekly working target derived from the daily goal. */
export const WEEKLY_GOAL_MINUTES = DAILY_GOAL_MINUTES * WEEKLY_WORKING_DAYS; // 2700

/** Rows per page on the Attendance History page. */
export const HISTORY_PAGE_SIZE = 10;
