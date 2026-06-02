import { useEffect, useState } from "react";
import { getToken, parseJwt } from "../utils/auth";
type User = {
  name?: string;
  email: string;
  role: string;
};

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const decoded = parseJwt(token);

    setUser({
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    });
  }, []);

  if (!user) return <p>Loading profile...</p>;
  return (
    <div style={{ padding: "20px" }}>
      <h1>Profile</h1>

      <div>
        <p>
          <b>Name:</b> {user.name || "N/A"}
        </p>
        <p>
          <b>Email:</b> {user.email}
        </p>
        <p>
          <b>Role:</b> {user.role}
        </p>
      </div>
    </div>
  );
};

export default Profile;
