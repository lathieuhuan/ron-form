import { GroupControl } from "@lib/core/group_control";
import { ItemControl } from "@lib/core/item_control";
import { ListControl } from "@lib/core/list_control";

export const setupResume = () => {
  const initials = {
    role: "Software Engineer",
    general: {
      name: "John Doe",
      age: 30,
    },
    contact: {
      email: "john.doe@example.com",
      phone: "123-456-7890",
    },
  };

  const role = new ItemControl(initials.role);
  const name = new ItemControl(initials.general.name);
  const general = new GroupControl({
    name: name,
    age: new ItemControl(initials.general.age),
  });
  const contact = new GroupControl({
    email: new ItemControl(initials.contact.email),
    phone: new ItemControl(initials.contact.phone),
  });
  const skills = new ListControl(new ItemControl(""));
  const experiences = new ListControl(
    new GroupControl({
      company: new ItemControl(""),
      yearCount: new ItemControl(0),
    }),
  );

  const resume = new GroupControl({
    role,
    general,
    contact,
    skills,
    experiences,
  });

  return {
    resume,
    role,
    name,
    general,
    contact,
    skills,
    experiences,
    initialValues: initials,
  };
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
