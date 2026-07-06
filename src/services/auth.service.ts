export class AuthService {
  private static baseUrl = 'http://localhost:3000/api/auth';

  static async login(email: string, password: string) {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Handle backend error format like VALIDATION_ERROR or custom messages
        if (data.error && data.error.details && data.error.details.length > 0) {
          throw new Error(data.error.details[0]);
        }
        if (data.error && data.error.message) {
          throw new Error(data.error.message);
        }
        throw new Error(data.message || 'Login failed');
      }

      return data.data; // Returns { token, user }
    } catch (error: any) {
      throw new Error(error.message || 'An unexpected error occurred during login');
    }
  }
  static async getProfile(token: string) {
    try {
      const response = await fetch('http://localhost:3000/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      return data.data;
    } catch (error: any) {
      throw new Error(error.message || 'An unexpected error occurred while fetching profile');
    }
  }

  static async updateProfile(token: string, updates: any) {
    try {
      const response = await fetch('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.error && data.error.details && data.error.details.length > 0) {
          throw new Error(data.error.details[0]);
        }
        throw new Error(data.message || 'Failed to update profile');
      }

      return data.data;
    } catch (error: any) {
      throw new Error(error.message || 'An unexpected error occurred while updating profile');
    }
  }
  static async logout(token: string) {
    try {
      const response = await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return await response.json();
    } catch (error: any) {
      console.error('Logout API call failed:', error);
    }
  }
}
