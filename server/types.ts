export interface TokenResponse {
    userId: string;
    email: string | null;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
    accessToken: string;
    refreshToken: string;
  }