import { useEffect, useState } from "react";
import { getToken, parseJwt } from "../utils/auth";
// type User = {
//   name?: string;
//   email: string;
//   role: string;
// };

const Profile = () => {
  // const [user, setUser] = useState<User | null>(null);
  const token = getToken();
  // const navigate = useNavigate();
  const user = token
    ? (() => {
        const payload: any = parseJwt(token);
        return {
          name: payload?.name,
          email: payload?.email,
          role: payload?.role,
        };
      })()
    : null;
  // useEffect(() => {
  //   const token = getToken();
  //   if (!token) return;

  //   const decoded = parseJwt(token);

  //   setUser({
  //     name: decoded.name,
  //     email: decoded.email,
  //     role: decoded.role,
  //   });
  // }, []);

  if (!user) return <p>Loading profile...</p>;
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.avatar}>
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <h2 style={styles.name}>{user.name || "Unknown User"}</h2>
            <p style={styles.role}>{user.role}</p>
          </div>
        </div>

        <hr style={styles.divider} />

        <div style={styles.info}>
          <p>
            <span>Email:</span> {user.email}
          </p>
          <p>
            <span>Role:</span> {user.role}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "80vh",
    background: "#f4f6f8",
  },
  card: {
    width: 350,
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    fontFamily: "sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: "50%",
    background: "#4f46e5",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: "bold",
  },
  name: {
    margin: 0,
  },
  role: {
    margin: 0,
    fontSize: 12,
    color: "gray",
  },
  divider: {
    margin: "15px 0",
  },
  info: {
    fontSize: 14,
    lineHeight: 1.8,
  },
};
