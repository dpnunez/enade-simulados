export const TEST_USERS = {
  admin: {
    email: "admin@enade.local",
    password: "admin123456",
    role: "ADMIN",
  },
  student: {
    email: "student@enade.local",
    password: "student123456",
    role: "STUDENT",
  },
  teacher: {
    email: "teacher@enade.local",
    password: "teacher123456",
    role: "TEACHER",
  },
} as const;

export type TestUser = (typeof TEST_USERS)[keyof typeof TEST_USERS];
