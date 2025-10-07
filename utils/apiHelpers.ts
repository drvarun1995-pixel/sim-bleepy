/**
 * Safely parse JSON response from API calls
 * Prevents "JSON.parse: unexpected character" errors when server returns non-JSON responses
 * 
 * @param response - Fetch Response object
 * @returns Parsed JSON data
 * @throws Error with user-friendly message
 */
export async function safeJsonParse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type');
  
  // Check if response is actually JSON
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  // Response is not JSON (probably an error page)
  const text = await response.text();
  console.error('Non-JSON response:', text);
  
  // Provide user-friendly error messages based on status code
  const errorMessages: Record<number, string> = {
    413: 'Request is too large. Please try with a smaller file or contact support.',
    502: 'Server is temporarily unavailable. Please try again in a moment.',
    503: 'Service temporarily unavailable. Please try again later.',
    504: 'Request timed out. Please try again or use a smaller file.',
  };
  
  const defaultMessage = `Request failed with status ${response.status}. The server returned an unexpected response.`;
  
  throw new Error(errorMessages[response.status] || defaultMessage);
}

/**
 * Make an API request with automatic error handling
 * 
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Parsed response data
 * @throws Error with user-friendly message
 */
export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);
    const data = await safeJsonParse(response);
    
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

/**
 * Upload file with progress tracking and proper error handling
 * 
 * @param url - Upload endpoint URL
 * @param formData - FormData containing the file and metadata
 * @param onProgress - Optional progress callback (if supported by the browser)
 * @returns Response data
 */
export async function uploadFile<T = any>(
  url: string,
  formData: FormData,
  onProgress?: (progress: number) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Track upload progress if callback provided
    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });
    }
    
    xhr.addEventListener('load', async () => {
      try {
        const contentType = xhr.getResponseHeader('content-type');
        
        // Check if response is JSON
        if (contentType && contentType.includes('application/json')) {
          const data = JSON.parse(xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            reject(new Error(data.error || `Upload failed with status ${xhr.status}`));
          }
        } else {
          // Non-JSON response
          console.error('Non-JSON upload response:', xhr.responseText);
          
          if (xhr.status === 413) {
            reject(new Error('File is too large to upload. Please try a smaller file or contact support.'));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}. The server returned an unexpected response.`));
          }
        }
      } catch (error) {
        reject(new Error('Failed to process upload response'));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Network error occurred during upload. Please check your connection and try again.'));
    });
    
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled'));
    });
    
    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timed out. The file may be too large or your connection is slow.'));
    });
    
    xhr.open('POST', url);
    xhr.send(formData);
  });
}

