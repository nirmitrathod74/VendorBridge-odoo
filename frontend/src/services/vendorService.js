import api, { getResults } from "../api/client";

export async function listVendors() {
  const { data } = await api.get("/vendors/");
  return getResults(data);
}

export async function createVendor(payload) {
  const { data } = await api.post("/vendors/", payload);
  return data;
}
