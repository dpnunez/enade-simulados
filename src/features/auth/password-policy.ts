export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_UPPERCASE_PATTERN = /[A-Z]/;
export const PASSWORD_LOWERCASE_PATTERN = /[a-z]/;
export const PASSWORD_SPECIAL_CHARACTER_PATTERN = /[^A-Za-z0-9]/;

export const PASSWORD_REQUIREMENT_MESSAGES = {
  minLength: `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`,
  uppercase: "A senha deve ter pelo menos uma letra maiúscula.",
  lowercase: "A senha deve ter pelo menos uma letra minúscula.",
  specialCharacter: "A senha deve ter pelo menos um caractere especial.",
} as const;

export type PasswordRequirement = {
  id: string;
  label: string;
  errorMessage: string;
  test: (password: string) => boolean;
};

export const passwordRequirements = [
  {
    id: "min-length",
    label: `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
    errorMessage: PASSWORD_REQUIREMENT_MESSAGES.minLength,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "uppercase",
    label: "Uma letra maiúscula",
    errorMessage: PASSWORD_REQUIREMENT_MESSAGES.uppercase,
    test: (password) => PASSWORD_UPPERCASE_PATTERN.test(password),
  },
  {
    id: "lowercase",
    label: "Uma letra minúscula",
    errorMessage: PASSWORD_REQUIREMENT_MESSAGES.lowercase,
    test: (password) => PASSWORD_LOWERCASE_PATTERN.test(password),
  },
  {
    id: "special",
    label: "Um caractere especial",
    errorMessage: PASSWORD_REQUIREMENT_MESSAGES.specialCharacter,
    test: (password) => PASSWORD_SPECIAL_CHARACTER_PATTERN.test(password),
  },
] satisfies PasswordRequirement[];

export function getPasswordRequirementStates(password: string) {
  return passwordRequirements.map((requirement) => ({
    ...requirement,
    isMet: requirement.test(password),
  }));
}

export function isPasswordCompliant(password: string) {
  return passwordRequirements.every((requirement) => requirement.test(password));
}
