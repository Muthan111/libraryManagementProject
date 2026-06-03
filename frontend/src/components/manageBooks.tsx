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
const ManageBooks = () => {
  const baseAPI = import.meta.env.VITE_BASE_API;
  const fetchURL = import.meta.env.VITE_BOOK_GET;
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const fetchBooks = async () => {
    try {
      const res = await fetch(`${baseAPI}/${fetchURL}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      console.log("Token:", getToken());
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

    fetchBooks();
  }, [navigate]);

  if (loading) return <p>Loading books...</p>;
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
      </div>
    </div>
  );
};

export default ManageBooks;
