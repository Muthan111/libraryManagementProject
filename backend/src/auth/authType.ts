import { Role } from '../user/user.enum';
export type AuthUser = {
  id: number;
  name: string;
  customerCode: string; // Optional customer code for borrowers
  email: string;
  role: Role;
};
