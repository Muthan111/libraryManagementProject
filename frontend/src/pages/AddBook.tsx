import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../utils/auth";

const AddBook = () => {
  const baseAPI = import.meta.env.VITE_BASE_API;
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [Author, setAuthor] = useState("");
  const [ISBN, setISBN] = useState("");
  const [status, setStatus] = useState("available");

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`${baseAPI}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ name, Author, ISBN, status }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to create book");
      }

      navigate("/admin");
    } catch (err) {
      alert((err as Error).message || "Error creating book");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-box" style={{ maxWidth: 700, margin: "24px auto" }}>
      <h2 style={{ marginTop: 0 }}>Add Book</h2>
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
          <label htmlFor="Status">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="available">Available</option>
            <option value="borrowed">Borrowed</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="primary-button"
            type="submit"
            disabled={submitting}
          >
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

export default AddBook;
