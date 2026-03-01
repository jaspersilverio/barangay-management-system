import api from './api';

/** Session cache so blotter list/stats show immediately when navigating back (no loading) */
const blotterPageCache: Record<string, unknown> = {};

export function getBlottersListCached<T = unknown>(key: string): T | undefined {
  return blotterPageCache[key] as T | undefined;
}

export function setBlottersListCached(key: string, value: unknown): void {
  blotterPageCache[key] = value;
}

export function getBlotterStatsCached<T = unknown>(key: string): T | undefined {
  return blotterPageCache[key] as T | undefined;
}

export function setBlotterStatsCached(key: string, value: unknown): void {
  blotterPageCache[key] = value;
}

export function clearBlotterPageCache(): void {
  Object.keys(blotterPageCache).forEach((k) => delete blotterPageCache[k]);
}

export interface Blotter {
  id: number;
  case_number: string;
  complainant_id?: number;
  complainant_is_resident: boolean;
  complainant_full_name?: string;
  complainant_age?: number;
  complainant_address?: string;
  complainant_contact?: string;
  respondent_id?: number;
  respondent_is_resident: boolean;
  respondent_full_name?: string;
  respondent_age?: number;
  respondent_address?: string;
  respondent_contact?: string;
  assigned_official_name?: string;
  assigned_official_display?: string;
  incident_date: string;
  incident_time: string;
  incident_location: string;
  description: string;
  status: 'ongoing' | 'resolved';
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
  resolution?: string;
  attachments?: Array<{
    filename: string;
    path: string;
    size: number;
    mime_type: string;
  }>;
  created_by: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  complainant?: {
    id: number;
    first_name: string;
    last_name: string;
    middle_name?: string;
    contact_number?: string;
    address?: string;
  };
  respondent?: {
    id: number;
    first_name: string;
    last_name: string;
    middle_name?: string;
    contact_number?: string;
    address?: string;
  };
  creator?: {
    id: number;
    name: string;
  };
  updater?: {
    id: number;
    name: string;
  };
  // Computed attributes from backend
  complainant_name?: string;
  respondent_name?: string;
  complainant_type?: string;
  respondent_type?: string;
}

export interface CreateBlotterData {
  // Complainant fields
  complainant_is_resident: boolean;
  complainant_id?: number;
  complainant_full_name?: string;
  complainant_age?: number;
  complainant_address?: string;
  complainant_contact?: string;
  
  // Respondent fields
  respondent_is_resident: boolean;
  respondent_id?: number;
  respondent_full_name?: string;
  respondent_age?: number;
  respondent_address?: string;
  respondent_contact?: string;
  
  // Other fields
  assigned_official_name?: string;
  incident_date: string;
  incident_time: string;
  incident_location: string;
  description: string;
  status?: 'resolved';
  resolution?: string;
  attachments?: File[];
}

export interface UpdateBlotterData {
  // Complainant fields
  complainant_is_resident?: boolean;
  complainant_id?: number;
  complainant_full_name?: string;
  complainant_age?: number;
  complainant_address?: string;
  complainant_contact?: string;
  
  // Respondent fields
  respondent_is_resident?: boolean;
  respondent_id?: number;
  respondent_full_name?: string;
  respondent_age?: number;
  respondent_address?: string;
  respondent_contact?: string;
  
  // Other fields
  assigned_official_name?: string;
  incident_date?: string;
  incident_time?: string;
  incident_location?: string;
  description?: string;
  status?: 'resolved';
  resolution?: string;
  attachments?: File[];
}

export interface BlotterFilters {
  search?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  per_page?: number;
  page?: number;
}

export interface BlotterStatistics {
  total: number;
  ongoing: number;
  resolved: number;
  this_month: number;
  this_year: number;
}


export const blotterService = {
  // Get all blotters with filters
  async getBlotters(filters: BlotterFilters = {}): Promise<{
    data: Blotter[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.per_page) params.append('per_page', filters.per_page.toString());
    if (filters.page) params.append('page', filters.page.toString());

    const response = await api.get(`/blotters?${params.toString()}`);
    return response.data.data;
  },

  // Get single blotter
  async getBlotter(id: number): Promise<Blotter> {
    const response = await api.get(`/blotters/${id}`);
    return response.data.data;
  },

  // Create new blotter
  // Accepts either CreateBlotterData object or FormData directly
  async createBlotter(data: CreateBlotterData | FormData): Promise<Blotter> {
    let formData: FormData;
    
    // If FormData is passed directly, use it
    if (data instanceof FormData) {
      formData = data;
    } else {
      // Otherwise, build FormData from CreateBlotterData object
      formData = new FormData();
      
      // Required boolean fields
      formData.append('complainant_is_resident', data.complainant_is_resident ? '1' : '0');
      formData.append('respondent_is_resident', data.respondent_is_resident ? '1' : '0');
      
      // Complainant fields
      if (data.complainant_is_resident && data.complainant_id) {
        formData.append('complainant_id', data.complainant_id.toString());
      } else {
        if (data.complainant_full_name) {
          formData.append('complainant_full_name', data.complainant_full_name);
        }
        if (data.complainant_age) {
          formData.append('complainant_age', data.complainant_age.toString());
        }
        if (data.complainant_address) {
          formData.append('complainant_address', data.complainant_address);
        }
        if (data.complainant_contact) {
          formData.append('complainant_contact', data.complainant_contact);
        }
      }
      
      // Respondent fields
      if (data.respondent_is_resident && data.respondent_id) {
        formData.append('respondent_id', data.respondent_id.toString());
      } else {
        if (data.respondent_full_name) {
          formData.append('respondent_full_name', data.respondent_full_name);
        }
        if (data.respondent_age) {
          formData.append('respondent_age', data.respondent_age.toString());
        }
        if (data.respondent_address) {
          formData.append('respondent_address', data.respondent_address);
        }
        if (data.respondent_contact) {
          formData.append('respondent_contact', data.respondent_contact);
        }
      }
      
      // Other fields
      if (data.assigned_official_name) {
        formData.append('assigned_official_name', data.assigned_official_name);
      }
      formData.append('incident_date', data.incident_date);
      formData.append('incident_time', data.incident_time);
      formData.append('incident_location', data.incident_location);
      formData.append('description', data.description);
      
      if (data.resolution) {
        formData.append('resolution', data.resolution);
      }
      if (data.attachments) {
        data.attachments.forEach((file, index) => {
          formData.append(`attachments[${index}]`, file);
        });
      }
    }

    const response = await api.post('/blotters', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Update blotter
  async updateBlotter(id: number, data: UpdateBlotterData): Promise<Blotter> {
    const formData = new FormData();

    // Booleans (backend needs these for resident/non-resident logic)
    if (data.complainant_is_resident !== undefined) {
      formData.append('complainant_is_resident', data.complainant_is_resident ? '1' : '0');
    }
    if (data.respondent_is_resident !== undefined) {
      formData.append('respondent_is_resident', data.respondent_is_resident ? '1' : '0');
    }

    // Only append complainant_id when present (integer); required_if when complainant_is_resident is true
    if (data.complainant_id != null && data.complainant_id !== '' && Number.isInteger(Number(data.complainant_id))) {
      formData.append('complainant_id', String(data.complainant_id));
    }
    if (data.complainant_full_name !== undefined) formData.append('complainant_full_name', data.complainant_full_name ?? '');
    // Laravel: integer, nullable - do not send empty string
    if (data.complainant_age !== undefined && data.complainant_age !== null && data.complainant_age !== '') {
      const age = Number(data.complainant_age);
      if (!Number.isNaN(age) && age >= 1 && age <= 120) formData.append('complainant_age', String(age));
    }
    if (data.complainant_address !== undefined) formData.append('complainant_address', data.complainant_address ?? '');
    if (data.complainant_contact !== undefined) formData.append('complainant_contact', data.complainant_contact ?? '');

    if (data.respondent_id != null && data.respondent_id !== '' && Number.isInteger(Number(data.respondent_id))) {
      formData.append('respondent_id', String(data.respondent_id));
    }
    if (data.respondent_full_name !== undefined) formData.append('respondent_full_name', data.respondent_full_name ?? '');
    if (data.respondent_age !== undefined && data.respondent_age !== null && data.respondent_age !== '') {
      const age = Number(data.respondent_age);
      if (!Number.isNaN(age) && age >= 1 && age <= 120) formData.append('respondent_age', String(age));
    }
    if (data.respondent_address !== undefined) formData.append('respondent_address', data.respondent_address ?? '');
    if (data.respondent_contact !== undefined) formData.append('respondent_contact', data.respondent_contact ?? '');

    if (data.assigned_official_name !== undefined) {
      formData.append('assigned_official_name', data.assigned_official_name ?? '');
    }
    // Laravel: date_format:Y-m-d - only send non-empty
    if (data.incident_date !== undefined && data.incident_date !== null && String(data.incident_date).trim() !== '') {
      formData.append('incident_date', String(data.incident_date));
    }
    // Laravel: date_format:H:i (HH:MM) - normalize so HH:MM:SS from API is sent as HH:MM
    if (data.incident_time !== undefined && data.incident_time !== null && String(data.incident_time).trim() !== '') {
      const t = String(data.incident_time).trim();
      formData.append('incident_time', t.length >= 5 ? t.substring(0, 5) : t);
    }
    if (data.incident_location !== undefined) formData.append('incident_location', data.incident_location ?? '');
    if (data.description !== undefined) formData.append('description', data.description ?? '');
    if (data.status !== undefined) formData.append('status', data.status);
    if (data.resolution !== undefined) formData.append('resolution', data.resolution ?? '');
    if (data.attachments?.length) {
      data.attachments.forEach((file) => {
        formData.append('attachments[]', file);
      });
    }

    // PHP does not parse FormData for PUT requests. Use POST with _method=PUT so Laravel receives the body.
    formData.append('_method', 'PUT');

    const response = await api.post(`/blotters/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Delete blotter
  async deleteBlotter(id: number): Promise<void> {
    await api.delete(`/blotters/${id}`);
  },

  // Get statistics
  async getStatistics(): Promise<BlotterStatistics> {
    const response = await api.get('/blotters/statistics');
    return response.data.data;
  },

  // Approve blotter (captain only)
  async approveBlotter(id: number): Promise<Blotter> {
    const response = await api.post(`/blotters/${id}/approve`);
    return response.data.data;
  },

  // Reject blotter (captain only)
  async rejectBlotter(id: number, remarks: string): Promise<Blotter> {
    const response = await api.post(`/blotters/${id}/reject`, { remarks });
    return response.data.data;
  },

};

export default blotterService;
