import api, { getResults } from "../api/client";

export async function listQuotations() {
  const { data } = await api.get("/quotations/");
  return getResults(data);
}

export async function createQuotation(payload) {
  const { data } = await api.post("/quotations/", payload);
  return data;
}

export async function submitQuotation(id) {
  const { data } = await api.post(`/quotations/${id}/submit/`);
  return data;
}

export async function selectQuotationForApproval(id) {
  const { data } = await api.post(`/quotations/${id}/select-for-approval/`);
  return data;
}
