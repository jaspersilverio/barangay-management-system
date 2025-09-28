import api from './api';

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
  official_id?: number;
  incident_date: string;
  incident_time: string;
  incident_location: string;
  description: string;
  status: 'Open' | 'Ongoing' | 'Resolved';
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
  official?: {
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
  official_id?: number;
  incident_date: string;
  incident_time: string;
  incident_location: string;
  description: string;
  status?: 'Open' | 'Ongoing' | 'Resolved';
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
  official_id?: number;
  incident_date?: string;
  incident_time?: string;
  incident_location?: string;
  description?: string;
  status?: 'Open' | 'Ongoing' | 'Resolved';
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
  open: number;
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
  async createBlotter(data: CreateBlotterData): Promise<Blotter> {
    const formData = new FormData();
    
    if (data.complainant_id !== undefined) {
      formData.append('complainant_id', data.complainant_id.toString());
    }
    if (data.respondent_id !== undefined) {
      formData.append('respondent_id', data.respondent_id.toString());
    }
    formData.append('incident_date', data.incident_date);
    formData.append('incident_time', data.incident_time);
    formData.append('incident_location', data.incident_location);
    formData.append('description', data.description);
    
    if (data.official_id) {
      formData.append('official_id', data.official_id.toString());
    }
    if (data.status) {
      formData.append('status', data.status);
    }
    if (data.resolution) {
      formData.append('resolution', data.resolution);
    }
    if (data.attachments) {
      data.attachments.forEach((file) => {
        formData.append('attachments[]', file);
      });
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
    
    if (data.complainant_id) {
      formData.append('complainant_id', data.complainant_id.toString());
    }
    if (data.respondent_id) {
      formData.append('respondent_id', data.respondent_id.toString());
    }
    if (data.official_id !== undefined) {
      formData.append('official_id', data.official_id?.toString() || '');
    }
    if (data.incident_date) {
      formData.append('incident_date', data.incident_date);
    }
    if (data.incident_time) {
      formData.append('incident_time', data.incident_time);
    }
    if (data.incident_location) {
      formData.append('incident_location', data.incident_location);
    }
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.status) {
      formData.append('status', data.status);
    }
    if (data.resolution !== undefined) {
      formData.append('resolution', data.resolution || '');
    }
    if (data.attachments) {
      data.attachments.forEach((file) => {
        formData.append('attachments[]', file);
      });
    }

    const response = await api.put(`/blotters/${id}`, formData, {
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

};

export default blotterService;
