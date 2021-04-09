import { NextApiResponse } from "next";

export enum ApiErrorCodes {
  NOT_FOUND = 0,
}

export type ApiError = {
  code: ApiErrorCodes;
  message: string;
  details?: any;
};

export type ApiErrorResponse<D = never> = (
  res: NextApiResponse<ApiError>,
  details?: D
) => void;

export const ErrorNotFound: ApiErrorResponse = (res) => {
  res.statusCode = 404;
  return res.json({
    code: ApiErrorCodes.NOT_FOUND,
    message: "Not found",
  });
};
