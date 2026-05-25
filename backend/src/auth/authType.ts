import { Role } from '../user/user.enum';
export type AuthUser = {
  id: number;
  email: string;
  role: Role;
};
