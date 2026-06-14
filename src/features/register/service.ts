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
