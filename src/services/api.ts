// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://omr.msiproject.space';

export const api = {
  // Templates
  getTemplates: () => fetch(`${API_BASE_URL}/api/templates`).then(res => res.json()),
  getTemplate: (id: number) => fetch(`${API_BASE_URL}/api/templates/${id}`).then(res => res.json()),
  createTemplate: (data: any) => 
    fetch(`${API_BASE_URL}/api/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
  deleteTemplate: (id: number) => 
    fetch(`${API_BASE_URL}/api/templates/${id}`, { method: 'DELETE' }).then(res => res.json()),

  // OMR Sheets
  uploadOMRSheet: async (templateId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/api/omr-sheets/upload?template_id=${templateId}`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }
    return response.json();
  },
  uploadOMRSheetByAnswerKey: async (answerKeyId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/api/omr-sheets/upload-by-answer-key?answer_key_id=${answerKeyId}`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }
    return response.json();
  },
  extractName: async (file: File, rect: {x:number;y:number;w:number;h:number}) => {
    const formData = new FormData();
    formData.append('file', file);
    const qs = new URLSearchParams({
      x: String(rect.x), y: String(rect.y), w: String(rect.w), h: String(rect.h)
    }).toString();
    const response = await fetch(`${API_BASE_URL}/api/extract-name?${qs}`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Extraction failed' }));
      throw new Error(error.detail || 'Extraction failed');
    }
    return response.json();
  },
  extractNameFromCropped: async (croppedFile: File) => {
    const formData = new FormData();
    formData.append('file', croppedFile);
    const response = await fetch(`${API_BASE_URL}/api/extract-name-from-cropped`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Extraction failed' }));
      throw new Error(error.detail || 'Extraction failed');
    }
    return response.json();
  },
  processCroppedByAnswerKey: async (answerKeyId: number, file: File, rect: {x:number;y:number;w:number;h:number}) => {
    const formData = new FormData();
    formData.append('file', file);
    const qs = new URLSearchParams({
      answer_key_id: String(answerKeyId),
      x: String(rect.x), y: String(rect.y), w: String(rect.w), h: String(rect.h)
    }).toString();
    const response = await fetch(`${API_BASE_URL}/api/omr-sheets/process-cropped-by-answer-key?${qs}`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Processing failed' }));
      throw new Error(error.detail || 'Processing failed');
    }
    return response.json();
  },
  processCroppedOMRByAnswerKey: async (answerKeyId: number, croppedFile: File, studentName?: string, usn?: string, examDate?: string) => {
    const formData = new FormData();
    formData.append('file', croppedFile);
    let url = `${API_BASE_URL}/api/omr-sheets/process-cropped-omr-by-answer-key?answer_key_id=${answerKeyId}`;
    if (studentName) {
      url += `&student_name=${encodeURIComponent(studentName)}`;
    }
    if (usn) {
      url += `&roll_number=${encodeURIComponent(usn)}`;
    }
    if (examDate) {
      url += `&exam_date=${encodeURIComponent(examDate)}`;
    }
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Processing failed' }));
      throw new Error(error.detail || 'Processing failed');
    }
    return response.json();
  },
  processMultipleOMRCrops: async (answerKeyId: number, croppedFiles: File[], studentName?: string, usn?: string, examDate?: string) => {
    const formData = new FormData();
    // Append all 5 files
    croppedFiles.forEach((file) => {
      formData.append('files', file);
    });
    let url = `${API_BASE_URL}/api/omr-sheets/process-multiple-omr-crops?answer_key_id=${answerKeyId}`;
    if (studentName) {
      url += `&student_name=${encodeURIComponent(studentName)}`;
    }
    if (usn) {
      url += `&roll_number=${encodeURIComponent(usn)}`;
    }
    if (examDate) {
      url += `&exam_date=${encodeURIComponent(examDate)}`;
    }
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Processing failed' }));
      throw new Error(error.detail || 'Processing failed');
    }
    return response.json();
  },
  getOMRSheets: () => fetch(`${API_BASE_URL}/api/omr-sheets`).then(res => res.json()),
  getOMRSheet: (id: number) => fetch(`${API_BASE_URL}/api/omr-sheets/${id}`).then(res => res.json()),
  deleteOMRSheet: (id: number) => 
    fetch(`${API_BASE_URL}/api/omr-sheets/${id}`, { method: 'DELETE' }).then(res => res.json()),

  // Answer Keys
  createAnswerKey: async (name: string, description: string | null, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    if (description) formData.append('description', description);
    const response = await fetch(`${API_BASE_URL}/api/answer-keys/create`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to create answer key' }));
      throw new Error(error.detail || 'Failed to create answer key');
    }
    return response.json();
  },
  getAnswerKeys: () => fetch(`${API_BASE_URL}/api/answer-keys`).then(res => res.json()),
  getAnswerKey: (id: number) => fetch(`${API_BASE_URL}/api/answer-keys/${id}`).then(res => res.json()),
  deleteAnswerKey: (id: number) => 
    fetch(`${API_BASE_URL}/api/answer-keys/${id}`, { method: 'DELETE' }).then(res => res.json()),
};

