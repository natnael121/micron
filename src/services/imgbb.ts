const IMGBB_API_KEY = 'f6f560dbdcf0c91aea57b3cd55097799';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

export interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: string;
    height: string;
    size: string;
    time: string;
    expiration: string;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    medium: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

class ImgBBService {
  async uploadImage(file: File, name?: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('key', IMGBB_API_KEY);
      formData.append('image', file);
      if (name) {
        formData.append('name', name);
      }

      const response = await fetch(IMGBB_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ImgBBResponse = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to upload image to ImgBB');
      }

      return result.data.display_url;
    } catch (error) {
      console.error('Error uploading image to ImgBB:', error);
      throw error;
    }
  }

  async uploadImageFromBase64(base64Data: string, name?: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('key', IMGBB_API_KEY);
      formData.append('image', base64Data);
      if (name) {
        formData.append('name', name);
      }

      const response = await fetch(IMGBB_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ImgBBResponse = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to upload image to ImgBB');
      }

      return result.data.display_url;
    } catch (error) {
      console.error('Error uploading base64 image to ImgBB:', error);
      throw error;
    }
  }
}

export const imgbbService = new ImgBBService();