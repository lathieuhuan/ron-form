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
        resolve(email !== "qwe");
      },
      800 + Math.random() * 200,
    );
  });
}

export async function isUsernameAvailable(username: string) {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        resolve(username !== "asd");
      },
      300 + Math.random() * 200,
    );
  });
}
