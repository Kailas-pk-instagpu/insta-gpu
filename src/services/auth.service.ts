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
}
