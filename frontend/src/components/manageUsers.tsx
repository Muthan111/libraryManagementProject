import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, parseJwt } from "../utils/auth";
type User = {
  userid: number;
  customerCode: string;
  email: string;
  role: string;
};
const ManageUsers = () => {
  const baseAPI = import.meta.env.VITE_BASE_API;

  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  console.log("getToken:", getToken());
  console.log("parsed:", parseJwt(getToken() || ""));

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${baseAPI}/user?page=1&limit=10`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      console.log("Token:", getToken());
      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();
      console.log("Users data:", data);
      console.log("Users array:", data.data);
      setUsers(data.data);
    } catch (err) {
      console.error(err);
    }
  };
  const deleteUser = async (customerCode: string) => {
    const confirmDelete = window.confirm("Delete this user?");

    if (!confirmDelete) return;

    await fetch(`${baseAPI}/user/${customerCode}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    setUsers((prev) => prev.filter((u) => u.customerCode !== customerCode));
  };

  useEffect(() => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    const user = parseJwt(token);

    if (user?.role !== "admin") {
      navigate("/");
      return;
    }

    fetchUsers();
  }, [navigate]);
  return (
    <div style={{ maxWidth: 960, margin: "24px auto" }}>
      <div className="form-box">
        <h1 style={{ marginTop: 0 }}>Admin Panel</h1>

        <h2>Users</h2>

        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.customerCode}>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button
                    onClick={() => navigate(`/admin/users/edit/${user.userid}`)}
                  >
                    Edit
                  </button>

                  <button onClick={() => deleteUser(user.customerCode)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;
