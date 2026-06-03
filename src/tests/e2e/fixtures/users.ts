export const TEST_USERS = {
  admin: {
    name: "Admin Test",
    email: "admin@enade.local",
    password: "admin123456",
    role: "ADMIN",
  },
  student: {
    name: "Student Test",
    email: "student@enade.local",
    password: "student123456",
    role: "STUDENT",
  },
  teacher: {
    name: "Teacher Test",
    email: "teacher@enade.local",
    password: "teacher123456",
    role: "TEACHER",
  },
} as const;

export type TestUser = (typeof TEST_USERS)[keyof typeof TEST_USERS];
