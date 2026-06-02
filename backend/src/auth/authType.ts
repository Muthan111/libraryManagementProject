import { Role } from '../user/user.enum';
export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
};
