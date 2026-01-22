import api from './api';

export interface IncidentReport {
  id: number;
  incident_title: string;
  description: string;
  incident_date: string;
  incident_time: string;
  location: string;
  persons_involved?: string[] | string | null;
  reporting_officer_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'Recorded' | 'Monitoring' | 'Resolved';
  approved_by?: number;
  rejected_by?: number;
  approved_at?: string;
  rejected_at?: string;
  rejection_remarks?: string;
  approver?: {
    id: number;
    name: string;
  };
  rejector?: {
    id: number;
    name: string;
  };
  notes?: string | null;
  created_by: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  reporting_officer?: {
    id: number;
    name: string;
    email?: string;
  };
  creator?: {
    id: number;
    name: string;
  };
  updater?: {
    id: number;
    name: string;
  };
}

export interface CreateIncidentReportData {
  incident_title: string;
  description: string;
  incident_date: string;
  incident_time: string;
  location: string;
  persons_involved?: string;
  reporting_officer_id: number;
  status?: 'pending' | 'approved' | 'rejected' | 'Recorded' | 'Monitoring' | 'Resolved';
  notes?: string;
}

export interface UpdateIncidentReportData {
  incident_title?: string;
  description?: string;
  incident_date?: string;
  incident_time?: string;
  location?: string;
  persons_involved?: string;
  reporting_officer_id?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'Recorded' | 'Monitoring' | 'Resolved';
  notes?: string;
}

export interface IncidentReportListParams {
  search?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

export interface IncidentReportListResponse {
  success: boolean;
  data: {
    data: IncidentReport[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface IncidentReportResponse {
  success: boolean;
  data: IncidentReport;
  message: string;
}

/**
 * Get list of incident reports
 */
export const listIncidentReports = async (
  params: IncidentReportListParams = {}
): Promise<IncidentReportListResponse> => {
  const response = await api.get('/incident-reports', { params });
  return response.data;
};

/**
 * Get a single incident report by ID
 */
export const getIncidentReport = async (
  id: number
): Promise<IncidentReportResponse> => {
  const response = await api.get(`/incident-reports/${id}`);
  return response.data;
};

/**
 * Create a new incident report
 */
export const createIncidentReport = async (
  data: CreateIncidentReportData
): Promise<IncidentReportResponse> => {
  const formData = new FormData();
  
  formData.append('incident_title', data.incident_title);
  formData.append('description', data.description);
  formData.append('incident_date', data.incident_date);
  formData.append('incident_time', data.incident_time);
  formData.append('location', data.location);
  formData.append('reporting_officer_id', data.reporting_officer_id.toString());
  
  if (data.persons_involved) {
    formData.append('persons_involved', data.persons_involved);
  }
  
  if (data.status) {
    formData.append('status', data.status);
  }
  
  if (data.notes) {
    formData.append('notes', data.notes);
  }

  const response = await api.post('/incident-reports', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Update an existing incident report
 */
export const updateIncidentReport = async (
  id: number,
  data: UpdateIncidentReportData
): Promise<IncidentReportResponse> => {
  const formData = new FormData();
  
  if (data.incident_title !== undefined) {
    formData.append('incident_title', data.incident_title);
  }
  if (data.description !== undefined) {
    formData.append('description', data.description);
  }
  if (data.incident_date !== undefined) {
    formData.append('incident_date', data.incident_date);
  }
  if (data.incident_time !== undefined) {
    formData.append('incident_time', data.incident_time);
  }
  if (data.location !== undefined) {
    formData.append('location', data.location);
  }
  if (data.reporting_officer_id !== undefined) {
    formData.append('reporting_officer_id', data.reporting_officer_id.toString());
  }
  if (data.persons_involved !== undefined) {
    formData.append('persons_involved', data.persons_involved || '');
  }
  if (data.status !== undefined) {
    formData.append('status', data.status);
  }
  if (data.notes !== undefined) {
    formData.append('notes', data.notes || '');
  }

  // Use _method for PUT request
  formData.append('_method', 'PUT');

  const response = await api.post(`/incident-reports/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Delete an incident report
 */
export const deleteIncidentReport = async (
  id: number
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/incident-reports/${id}`);
  return response.data;
};

/**
 * Approve an incident report (captain only)
 */
export const approveIncidentReport = async (
  id: number
): Promise<IncidentReportResponse> => {
  const response = await api.post(`/incident-reports/${id}/approve`);
  return response.data;
};

/**
 * Reject an incident report (captain only)
 */
export const rejectIncidentReport = async (
  id: number,
  remarks: string
): Promise<IncidentReportResponse> => {
  const response = await api.post(`/incident-reports/${id}/reject`, { remarks });
  return response.data;
};

