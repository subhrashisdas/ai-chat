"use client";

export function getAccessToken() {
  return localStorage.getItem("access_token");
}

export function removeAccessToken() {
  localStorage.removeItem("access_token");
}

export function setAccessToken(token: string) {
  localStorage.setItem("access_token", token);
}

interface FetchRequest {
  url: string;
  method: string;
  body?: object;
  headers?: Record<string, string>;
}

export async function fetchData(req: FetchRequest): Promise<any> {
  const options: any = {
    method: req.method,
    headers: req.headers ? { ...req.headers } : {},
  };

  if (req.body && req.method !== "GET") {
    options.body = JSON.stringify(req.body);
    options.headers["Content-Type"] = "application/json";
  }

  const url = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/${req.url}`;
  const response = await fetch(url, options);
  const responseJson = await response.json();

  if (!response.ok) {
    try {
      if (responseJson.detail === "Could not validate credentials") {
        removeAccessToken();
      }
    } catch (e) {
      throw new Error(`Network response was not ok: ${e}`);
    }
  }

  return responseJson;
}

export async function fetchAuthenticated(req: FetchRequest): Promise<any> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("Access Token Not Found");
  }

  const authenticatedRequest: FetchRequest = {
    ...req,
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      ...req.headers,
    },
  };

  return fetchData(authenticatedRequest);
}
