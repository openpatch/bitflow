export type FetcherRequestInit<T> = Omit<RequestInit, "body"> & {
  body?: T;
};
export type FetcherResponse<T> = Omit<Response, "json"> & {
  json: () => Promise<T>;
};

const fetcher = async <Req, Res>(
  url: RequestInfo,
  { body, ...options }: FetcherRequestInit<Req> = {}
): Promise<FetcherResponse<Res>> => {
  const fetchOptions: RequestInit = options;
  if (
    fetchOptions &&
    (fetchOptions.method === "POST" ||
      fetchOptions.method === "PUT" ||
      fetchOptions.method === "PATCH")
  ) {
    if (!fetchOptions.headers) {
      fetchOptions.headers = {};
    }
    const headers = new Headers(fetchOptions.headers);
    headers.set("Content-Type", "application/json");
    fetchOptions.headers = headers;

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }
  }

  return await fetch(url, {
    ...fetchOptions,
  });
};

export const get = async <Res>(
  url: RequestInfo,
  options: FetcherRequestInit<null> = {}
) => {
  return await fetcher<null, Res>(url, { ...options, method: "GET" });
};

export const post = async <Req, Res>(
  url: RequestInfo,
  body: Req,
  options: Omit<FetcherRequestInit<Req>, "body"> = {}
) => {
  return await fetcher<Req, Res>(url, { ...options, body, method: "POST" });
};

export const put = async <Req, Res>(
  url: RequestInfo,
  body: Req,
  options: Omit<FetcherRequestInit<Req>, "body"> = {}
) => {
  return await fetcher<Req, Res>(url, { ...options, body, method: "PUT" });
};

export const patch = async <Req, Res>(
  url: RequestInfo,
  body: Req,
  options: Omit<FetcherRequestInit<Req>, "body"> = {}
) => {
  return await fetcher<Req, Res>(url, { ...options, body, method: "PATCH" });
};

export const del = async <Res>(
  url: RequestInfo,
  options: FetcherRequestInit<null> = {}
) => {
  return await fetcher<null, Res>(url, { ...options, method: "DELETE" });
};

export default {
  get,
  del,
  patch,
  put,
  post,
};
