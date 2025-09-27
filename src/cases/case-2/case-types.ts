export enum ERole {
  DEVELOPER = "developer",
  DESIGNER = "designer",
  MANAGER = "manager",
}

export type FormValues = {
  role: ERole;
  yoe: string;
};
