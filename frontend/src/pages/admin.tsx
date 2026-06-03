import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, parseJwt } from "../utils/auth";

type Book = {
  bookid: number;
  bookCode: string;
  name: string;
  Author: string;
  ISBN: string;
};

type User = {
  userid: number;
  customerCode: string;
  email: string;
  role: string;
};

const Admin = () => {
  const baseAPI = import.meta.env.VITE_BASE_API;
  const fetchURL = import.meta.env.VITE_BOOK_GET;
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${baseAPI}/user?page=1&limit=10`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();
      setUsers(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${baseAPI}/${fetchURL}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch books");

      const data = await res.json();
      console.log("Fetched books:", data.data);
      setBooks(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteBook = async (id: number) => {
    const confirmDelete = window.confirm("Delete this book?");
    if (!confirmDelete) return;

    await fetch(`${baseAPI}/book/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    setBooks((prev) => prev.filter((b) => b.bookid !== id));
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

    Promise.all([fetchBooks(), fetchUsers()]);
  }, [navigate]);

  if (loading) return <p>Loading books...</p>;

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

  return (
    <div style={{ maxWidth: 960, margin: "24px auto" }}>
      <div className="form-box">
        <h1 style={{ marginTop: 0 }}>Admin Panel</h1>

        <div style={{ marginBottom: 12 }}>
          <button
            className="primary-button"
            onClick={() => navigate("/admin/add")}
          >
            Add Book
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {books.map((book) => (
              <tr key={book.bookid}>
                <td>{book.name}</td>
                <td>{book.Author}</td>
                <td>
                  <button
                    onClick={() => navigate(`/admin/edit/${book.bookid}`)}
                  >
                    Edit
                  </button>

                  <button onClick={() => deleteBook(book.bookid)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Users</h2>

        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.userid}>
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

export default Admin;
