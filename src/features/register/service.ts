import { USED_EMAIL, USED_USERNAME } from "./config";

export async function isEmailValid(email: string) {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        resolve(email.includes("@"));
      },
      300 + Math.random() * 200,
    );
  });
}

export async function isEmailAvailable(email: string) {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        resolve(email !== USED_EMAIL);
      },
      800 + Math.random() * 200,
    );
  });
}

export async function isUsernameAvailable(username: string) {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        resolve(username !== USED_USERNAME);
      },
      300 + Math.random() * 200,
    );
  });
}
