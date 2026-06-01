import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

type BookItem = {
  bookid: number;
  bookCode: string;
  name: string;
  Author: string;
  ISBN: string;
  status: string;
  borrowedById: string | null;
};

const BookDetail = () => {
  const { bookCode } = useParams<{ bookCode: string }>();
  const [book, setBook] = useState<BookItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchBook = async () => {
      if (!bookCode) {
        setErrorMessage("Book code is missing.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/book/${encodeURIComponent(bookCode)}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch book");
        }

        const result: BookItem | null = await response.json();

        if (!result) {
          setErrorMessage("Book not found.");
          return;
        }

        setBook(result);
      } catch {
        setErrorMessage("Could not load this book right now.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [bookCode]);

  if (isLoading) {
    return (
      <main className="books-page">
        <p>Loading book details...</p>
      </main>
    );
  }

  if (errorMessage || !book) {
    return (
      <main className="books-page">
        <Link className="back-link" to="/books">
          Back to books
        </Link>
        <p>{errorMessage || "Book not found."}</p>
      </main>
    );
  }

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
