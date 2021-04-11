export const url = (path: string) => {
  let serverUrl = process.env.SERVER_URL as string;
  if (!/^https?:\/\//i.test(serverUrl)) {
    serverUrl = "https://" + serverUrl;
  }

  return process.env.SERVER_URL + path;
};
