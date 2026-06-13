import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE, authFetch, getToken, parseJwt } from "../utils/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
type BookItem = {
  bookid: number;
  bookCode: string;
  name: string;
  Author: string;
  ISBN: string;
  status: string;
  borrowedById: string | null;
};
const baseAPI = import.meta.env.VITE_BASE_API;
const BookDetail = () => {
  const token = getToken();
  const decoded = token ? parseJwt(token) : null;
  const customerCode = decoded?.customerCode;
  const queryClient = useQueryClient();
  const { bookCode } = useParams<{ bookCode: string }>();
  // const [book, setBook] = useState<BookItem | null>(null);
  // const [isLoading, setIsLoading] = useState(true);
  // const [errorMessage, setErrorMessage] = useState("");
  const [borrowing, setBorrowing] = useState(false);
  async function handleBorrow() {
    const token = getToken();
    if (!token) {
      alert("Please log in to borrow books.");
      return;
    }

    if (!customerCode) {
      alert(
        "Customer code not found in token. Update backend to include it or fetch current user.",
      );
      return;
    }

    setBorrowing(true);
    try {
      const dueDate = new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000,
      ).toISOString(); // default 14 days
      // const bookCode = book?.bookCode;
      if (!bookCode) {
        console.error("No book selected to borrow");
        return; // or show UI error / set state
      }
      const res = await authFetch(`${API_BASE}/borrow`, {
        method: "POST",
        body: JSON.stringify({
          customerCode,
          bookCode,
          dueDate,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to borrow");
      }

      // update UI locally
      await queryClient.invalidateQueries({ queryKey: ["book", bookCode] });
      alert("Book borrowed");
    } catch (e: any) {
      alert(e.message || "Could not borrow book");
    } finally {
      setBorrowing(false);
    }
  }
  // useEffect(() => {
  //   const fetchBook = async () => {
  //     if (!bookCode) {
  //       setErrorMessage("Book code is missing.");
  //       setIsLoading(false);
  //       return;
  //     }

  //     try {
  //       const response = await fetch(
  //         `${baseAPI}/book/${encodeURIComponent(bookCode)}`,
  //       );

  //       if (!response.ok) {
  //         throw new Error("Failed to fetch book");
  //       }

  //       const result: BookItem | null = await response.json();

  //       if (!result) {
  //         setErrorMessage("Book not found.");
  //         return;
  //       }

  //       setBook(result);
  //     } catch {
  //       setErrorMessage("Could not load this book right now.");
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchBook();
  // }, [bookCode]);
  const {
    data: book,
    isLoading,
    error,
  } = useQuery<BookItem>({
    queryKey: ["book", bookCode, token],
    enabled: !!bookCode,
    queryFn: async () => {
      const response = await fetch(`${baseAPI}/book/${bookCode}`, {
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

  if (isLoading) {
    return (
      <main className="books-page">
        <p>Loading book details...</p>
      </main>
    );
  }

  if (error || !book) {
    return (
      <main className="books-page">
        <Link className="back-link" to="/books">
          Back to books
        </Link>
        <p>{error instanceof Error ? error.message : "Book not found."}</p>
      </main>
    );
  }
  const isBorrowed = book.status === "BORROWED";
  return (
    <main className="books-page">
      <Link className="back-link" to="/books">
        Back to books
      </Link>

      <section className="book-detail">
        <div>
          <p className="book-code">{book.bookCode}</p>
          <h1>{book.name}</h1>
          <p className="book-author">by {book.Author}</p>
          {!isBorrowed ? (
            <button type="button" onClick={handleBorrow} disabled={borrowing}>
              {borrowing ? "Borrowing…" : "Borrow this book"}
            </button>
          ) : (
            <button type="button" disabled>
              Already borrowed
            </button>
          )}
        </div>

        <dl className="book-detail-list">
          <div>
            <dt>Book ID</dt>
            <dd>{book.bookid}</dd>
          </div>
          <div>
            <dt>ISBN</dt>
            <dd>{book.ISBN}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{book.status}</dd>
          </div>
          <div>
            <dt>Borrowed By</dt>
            <dd>{book.borrowedById ?? "Not borrowed"}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
};

export default BookDetail;
