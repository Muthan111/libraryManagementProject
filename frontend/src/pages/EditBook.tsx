import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getToken, parseJwt } from "../utils/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
const baseAPI = import.meta.env.VITE_BASE_API;
const EditBook = () => {
  const token = getToken();
  const decoded = token ? parseJwt(token) : null;
  const customerCode = decoded?.customerCode;
  // const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [Author, setAuthor] = useState("");
  const [ISBN, setISBN] = useState("");
  const [bookCode, setBookCode] = useState("");
  // const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    data: book,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["book", id],
    enabled: !!id,
    queryFn: async () => {
      const response = await fetch(`${baseAPI}/book/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch book");
      }

      return response.json();
    },
  });
  const b = book?.data || book;

  useEffect(() => {
    // const b = book?.data || book;
    if (!b) return;

    setName(b.name ?? "");
    setAuthor(b.Author ?? "");
    setISBN(b.ISBN ?? "");
    setBookCode(b.bookCode ?? "");
  }, [book]);
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

  if (isLoading) return <p>Loading book...</p>;
  if (!b) return <p>No book found</p>;

  return (
    <div>
      <h2>Edit Book</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="Author">Author</label>
          <input
            id="Author"
            value={Author}
            onChange={(e) => setAuthor(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="ISBN">ISBN</label>
          <input
            id="ISBN"
            value={ISBN}
            onChange={(e) => setISBN(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="BookCode">Book Code</label>
          <input
            id="BookCode"
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
