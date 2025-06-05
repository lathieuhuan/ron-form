export enum ERole {
  DEVELOPER = "developer",
  DESIGNER = "designer",
  MANAGER = "manager",
}

export type FormValues = {
  career: {
    role: ERole;
    yoe: number;
  };
};
