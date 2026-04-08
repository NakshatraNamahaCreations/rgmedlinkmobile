import API, { BASE_URL } from "./index";

/* ════════════════════════════════════════════════════
   PRESCRIPTION UPLOAD
════════════════════════════════════════════════════ */
export const uploadPrescriptionPDF = async (fileUri, patientId) => {
  const formData = new FormData();
  formData.append("file", {
    uri: fileUri,
    name: "prescription.pdf",
    type: "application/pdf",
  });
  formData.append("patientId", patientId);

  const res = await API.post("/upload/upload-prescription", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
  return res.data;
};

export const uploadPrescriptionImage = async (imageUri) => {
  const formData = new FormData();
  formData.append("file", {
    uri: imageUri,
    name: "prescription.jpg",
    type: "image/jpeg",
  });

  const res = await API.post("/upload/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
  return res.data;
};

/* ════════════════════════════════════════════════════
   PATIENT DETAILS
════════════════════════════════════════════════════ */
export const createPatient = async (data) => {
  const res = await API.post("/patient-details/create", data);
  return res.data;
};

export const getPatients = async (userId) => {
  const res = await API.get(`/patient-details/?userId=${userId}`);
  return res.data;
};

export const updatePatient = async (id, data) => {
  const res = await API.put(`/patient-details/${id}`, data);
  return res.data;
};

/* ════════════════════════════════════════════════════
   ADDRESS
════════════════════════════════════════════════════ */
export const saveAddress = async (data) => {
  const res = await API.post("/address/save", data);
  return res.data;
};

export const getAddresses = async (userId) => {
  const res = await API.get(`/address/${userId}`);
  return res.data;
};

export const updateAddress = async (id, data) => {
  const res = await API.put(`/address/update/${id}`, data);
  return res.data;
};

export const deleteAddress = async (id) => {
  const res = await API.delete(`/address/delete/${id}`);
  return res.data;
};

/* ════════════════════════════════════════════════════
   ORDERS
════════════════════════════════════════════════════ */
export const createOrder = async (data) => {
  const res = await API.post("/orders/create", data);
  return res.data;
};

export const getOrders = async (userId) => {
  const res = await API.get(`/orders?userId=${userId}`);
  return res.data;
};

export const getOrderById = async (id) => {
  const res = await API.get(`/orders/${id}`);
  return res.data;
};

export const markPaymentPaid = async (id) => {
  const res = await API.patch(`/orders/${id}/pay`);
  return res.data;
};

/* ════════════════════════════════════════════════════
   PRESCRIPTIONS
════════════════════════════════════════════════════ */
export const getPrescriptions = async (userId) => {
  const params = {};
  if (userId) params.userId = userId;
  const res = await API.get("/prescriptions", { params });
  return res.data;
};
