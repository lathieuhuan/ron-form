import { ValidatorFn, AsyncValidatorFn } from "@lib";
import { ERole, FormValues } from "./case-types";

export const numberValidator: ValidatorFn<any> = (control) => {
  const value = +control.getValue();
  return isNaN(value) ? { number: "Please enter a number" } : null;
};

export const roleValidator: AsyncValidatorFn<any> = (control) => {
  const value: ERole = control.getValue();

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value === ERole.MANAGER ? { invalid: "Role Manager is not available" } : null);
    }, 1000);
  });
};

export const careerValidator: ValidatorFn<FormValues["career"]> = (control) => {
  const career: FormValues["career"] = control.getValue();
  const { role, yoe } = career;

  if (!role || !yoe) {
    return null;
  }
  switch (role) {
    case ERole.DEVELOPER:
      return yoe < 3 ? { career: "Role Developer must have at least 3 YOE" } : null;
    case ERole.MANAGER:
      return yoe < 5 ? { career: "Role Manager must have at least 5 YOE" } : null;
    default:
      return null;
  }
};
