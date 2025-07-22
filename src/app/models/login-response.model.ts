export interface LoginResponse {
  token: string;
  refreshToken?: string;
  userName: string;
  roles?: string[];
}
