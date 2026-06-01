import { Link } from "react-router-dom";
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
type BooksResponse = {
  data: BookItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const Book = () => {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/book?page=1&limit=10",
        );

        if (!response.ok) {
          throw new Error("Failed to fetch books");
        }

        const result: BooksResponse = await response.json();

        setBooks(result.data);
      } catch {
        setErrorMessage("Could not load books right now.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (isLoading) {
    return (
      <main className="books-page">
        <p>Loading books...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="books-page">
        <p>{errorMessage}</p>
      </main>
    );
  }

  return (
    <main className="books-page">
      <div className="section-heading">
        <h1>Browse books</h1>
        <p>Select a book to view more details.</p>
      </div>

      <section className="book-grid">
        {books.length > 0 ? (
          books.map((book) => (
            <Link
              className="book-card"
              to={`/books/${book.bookCode}`}
              key={book.bookCode}
            >
              <h2>{book.name}</h2>
              <p>by {book.Author}</p>
              <p>ISBN: {book.ISBN}</p>
              <span>{book.status}</span>
            </Link>
          ))
        ) : (
          <p>No books found.</p>
        )}
      </section>
    </main>
  );
};

export default Book;
