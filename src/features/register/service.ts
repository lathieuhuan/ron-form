export async function isUsernameAvailable(username: string) {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        resolve(username !== "asd");
      },
      800 + Math.random() * 200,
    );
  });
}

export async function isEmailAvailable(email: string) {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        resolve(email !== "qwe");
      },
      300 + Math.random() * 200,
    );
  });
}
