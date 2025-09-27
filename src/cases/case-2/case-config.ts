export enum ERole {
  DEVELOPER = "developer",
  DESIGNER = "designer",
  MANAGER = "manager",
}

export type FormValues = {
  role: ERole;
  yoe: string;
};

export const ROLE_OPTIONS = [
  { label: "Developer", value: ERole.DEVELOPER },
  { label: "Designer", value: ERole.DESIGNER },
  { label: "Manager", value: ERole.MANAGER },
];
