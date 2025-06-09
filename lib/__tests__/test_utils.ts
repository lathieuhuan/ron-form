import { GroupControl } from "@lib/core/group_control";
import { ItemControl } from "@lib/core/item_control";
import { ListControl } from "@lib/core/list_control";
import { AsyncValidatorFn, ValidatorFn } from "@lib/core/types";

export const REQUIRED_ERROR = { required: "required" };
export const ASYNC_ERROR = { asyncError: "asyncError" };

export const requiredValidator: ValidatorFn<string | null> = (control) => {
  return control.getValue() ? null : REQUIRED_ERROR;
};

export const asyncValidator: AsyncValidatorFn<string | null> = async (control) => {
  const value = control.getValue();

  return new Promise((resolve) => {
    setTimeout(() => resolve(value ? null : ASYNC_ERROR), 100);
  });
};

export const setupResume = () => {
  const resume = new GroupControl({
    role: new ItemControl("Software Engineer"),
    general: new GroupControl({
      name: new ItemControl("John Doe"),
      age: new ItemControl(30),
    }),
    contact: new GroupControl({
      email: new ItemControl("john.doe@example.com"),
      phone: new ItemControl("123-456-7890"),
    }),
    skills: new ListControl(new ItemControl("")),
    experiences: new ListControl(
      new GroupControl({
        company: new ItemControl(""),
        yearCount: new ItemControl(0),
      }),
    ),
  });

  return resume;
};

export const setupNestedGroup = () => {
  const group1 = new GroupControl({
    lv2: new ItemControl(""),
  });

  return new GroupControl({
    lv1: group1,
  });

  // If we declare the nested group inline like below,
  // typescript will stop inferring the type further
  // to avoid potential type recursion issues.

  // return new GroupControl({
  //   lv1: new GroupControl({
  //     lv2: new ItemControl(""),
  //   }),
  // });
};

export const setupMatrix2dSimple = () => {
  return new ListControl(new ListControl(new ItemControl(0)));
};

export const setupMatrix2dComplex = () => {
  return new ListControl(
    new ListControl(
      new GroupControl({
        x: new ItemControl(0),
        y: new ItemControl(0),
      }),
    ),
  );
};

export const setupMatrix3dSimple = () => {
  return new ListControl(new ListControl(new ListControl(new ItemControl(0))));
};

export const setupMatrix3dComplex = () => {
  return new ListControl(
    new ListControl(
      new ListControl(
        new GroupControl({
          x: new ItemControl(0),
          y: new ItemControl(0),
        }),
      ),
    ),
  );
};
