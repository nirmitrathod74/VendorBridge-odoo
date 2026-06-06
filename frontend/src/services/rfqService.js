import api, { getResults } from "../api/client";

export async function listRFQs() {
  const { data } = await api.get("/rfqs/");
  return getResults(data);
}

export async function createRFQ(payload) {
  const { data } = await api.post("/rfqs/", payload);
  return data;
}

export async function publishRFQ(id) {
  const { data } = await api.post(`/rfqs/${id}/publish/`);
  return data;
}

export async function getRFQ(id) {
  const { data } = await api.get(`/rfqs/${id}/`);
  return data;
}

export async function closeRFQ(id) {
  const { data } = await api.post(`/rfqs/${id}/close/`);
  return data;
}

export async function rejectRFQ(id) {
  const { data } = await api.post(`/rfqs/${id}/reject/`);
  return data;
}

export async function deleteRFQ(id) {
  const { data } = await api.delete(`/rfqs/${id}/`);
  return data;
}
