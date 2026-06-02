import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getToken } from "../utils/auth";

const EditBook = () => {
  const { id } = useParams<{ id: string }>();
  const baseAPI = import.meta.env.VITE_BASE_API;
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [Author, setAuthor] = useState("");
  const [ISBN, setISBN] = useState("");
  const [bookCode, setBookCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchBook = async () => {
      try {
        const res = await fetch(`${baseAPI}/book/${id}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error("Failed to fetch book");
        const json = await res.json();
        const book = json.data || json;
        setName(book.name || "");
        setAuthor(book.Author || "");
        setISBN(book.ISBN || "");
        setBookCode(book.bookCode || "");
      } catch (err) {
        alert((err as Error).message || "Error fetching book");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);

    try {
      const res = await fetch(`${baseAPI}/book/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ name, Author, ISBN, bookCode }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to update book");
      }

      navigate("/admin");
    } catch (err) {
      alert((err as Error).message || "Error updating book");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading book...</p>;

  return (
    <div>
      <h2>Edit Book</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Author</label>
          <input
            value={Author}
            onChange={(e) => setAuthor(e.target.value)}
            required
          />
        </div>

        <div>
          <label>ISBN</label>
          <input value={ISBN} onChange={(e) => setISBN(e.target.value)} />
        </div>

        <div>
          <label>Book Code</label>
          <input
            value={bookCode}
            onChange={(e) => setBookCode(e.target.value)}
          />
        </div>

        <div>
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={() => navigate("/admin")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditBook;
