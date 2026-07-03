import { VALID_CITIZEN_ID } from "./constants";

type Address = {
  street: string;
  ward: string;
  district: string;
  city: string;
};

export const getAddressByCitizenId = (citizenId: string) => {
  return new Promise<Address | null>((resolve) => {
    setTimeout(() => {
      if (citizenId === VALID_CITIZEN_ID) {
        resolve({
          street: "123 Main St",
          ward: "ward1",
          district: "district1",
          city: "hochiminh",
        });
        return;
      }

      resolve(null);
    }, 500);
  });
};
