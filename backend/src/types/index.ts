// Type definitions for enum-like values used in SQLite

export type QuizStatus = 'ACTIVE' | 'FULL' | 'CANCELLED' | 'COMPLETED';

export type RegistrationStatus = 'CONFIRMED' | 'CANCELLED' | 'WAITLIST';

export type TeamExperience = 'BEGINNER' | 'EXPERIENCED' | 'PROFESSIONAL';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';

// Validation constants
export const QUIZ_STATUSES: QuizStatus[] = ['ACTIVE', 'FULL', 'CANCELLED', 'COMPLETED'];

export const REGISTRATION_STATUSES: RegistrationStatus[] = ['CONFIRMED', 'CANCELLED', 'WAITLIST'];

export const TEAM_EXPERIENCE_LEVELS: TeamExperience[] = ['BEGINNER', 'EXPERIENCED', 'PROFESSIONAL'];

export const ADMIN_ROLES: AdminRole[] = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'];

// Helper functions for validation
export const isValidQuizStatus = (status: string): status is QuizStatus => {
  return QUIZ_STATUSES.includes(status as QuizStatus);
};

export const isValidRegistrationStatus = (status: string): status is RegistrationStatus => {
  return REGISTRATION_STATUSES.includes(status as RegistrationStatus);
};

export const isValidTeamExperience = (experience: string): experience is TeamExperience => {
  return TEAM_EXPERIENCE_LEVELS.includes(experience as TeamExperience);
};

export const isValidAdminRole = (role: string): role is AdminRole => {
  return ADMIN_ROLES.includes(role as AdminRole);
};