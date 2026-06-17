import { Link } from "react-router-dom";
import { useEffect, useReducer } from "react";

type BookItem = {
  bookid: number;
  bookCode: string;
  name: string;
  Author: string;
  ISBN: string;
  status: string;
  borrowedById: string | null;
};
type State = {
  books: BookItem[];
  isLoading: boolean;
  errorMessage: string;
  searchTerm: string;
  searchType: string;
};
const initialState: State = {
  books: [],
  isLoading: true,
  errorMessage: "",
  searchTerm: "",
  searchType: "name",
};

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: BookItem[] }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "SET_SEARCH_TERM"; payload: string }
  | { type: "SET_SEARCH_TYPE"; payload: string };

function bookReducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return {
        ...state,
        isLoading: true,
        errorMessage: "",
      };

    case "FETCH_SUCCESS":
      return {
        ...state,
        books: action.payload,
        isLoading: false,
      };

    case "FETCH_ERROR":
      return {
        ...state,
        errorMessage: action.payload,
        isLoading: false,
      };

    case "SET_SEARCH_TERM":
      return {
        ...state,
        searchTerm: action.payload,
      };

    case "SET_SEARCH_TYPE":
      return {
        ...state,
        searchType: action.payload,
      };

    default:
      return state;
  }
}

type BooksResponse = {
  data: BookItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
const baseAPI = import.meta.env.VITE_BASE_API;
const fetchURL = import.meta.env.VITE_BOOK_GET;
const nameSearch = import.meta.env.VITE_SEARCH_BY_NAME;
const ISBNSearch = import.meta.env.VITE_SEARCH_BY_ISBN;
const authorSearch = import.meta.env.VITE_SEARCH_BY_AUTHOR;

const Book = () => {
  // const [books, setBooks] = useState<BookItem[]>([]);
  // const [isLoading, setIsLoading] = useState(true);
  // const [errorMessage, setErrorMessage] = useState("");
  // const [searchTerm, setSearchTerm] = useState("");
  // const [searchType, setSearchType] = useState("name");

  const [state, dispatch] = useReducer(bookReducer, initialState);
  const { books, isLoading, errorMessage, searchTerm, searchType } = state;
  const fetchBooks = async () => {
    try {
      dispatch({ type: "FETCH_START" });
      const response = await fetch(`${baseAPI}/${fetchURL}`);

      if (response.status === 404) {
        dispatch({
          type: "FETCH_SUCCESS",
          payload: [],
        });
        return;
      }

      const result: BooksResponse = await response.json();

      dispatch({
        type: "FETCH_SUCCESS",
        payload: result.data,
      });
    } catch {
      dispatch({
        type: "FETCH_ERROR",
        payload: "Could not load books right now.",
      });
    }
  };
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await fetchBooks();
      return;
    }

    let endpoint;

    switch (searchType) {
      case "name":
        endpoint = `${nameSearch}`;
        break;

      case "author":
        endpoint = `${authorSearch}`;
        break;

      case "isbn":
        endpoint = `${ISBNSearch}`;
        break;

      default:
        return;
    }

    try {
      dispatch({ type: "FETCH_START" });
      const URL = `${baseAPI}/${endpoint}/${encodeURIComponent(searchTerm)}`;
      const response = await fetch(URL);

      if (response.status === 404) {
        dispatch({
          type: "FETCH_SUCCESS",
          payload: [],
        });
        console.log("Error");
        return;
      }

      const result: BookItem = await response.json();
      dispatch({
        type: "FETCH_SUCCESS",
        payload: [result],
      });
    } catch {
      dispatch({
        type: "FETCH_ERROR",
        payload: "Search failed.",
      });
    }
  };
  useEffect(() => {
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
      <div className="search-container">
        <select
          value={searchType}
          onChange={(e) =>
            dispatch({
              type: "SET_SEARCH_TYPE",
              payload: e.target.value,
            })
          }
        >
          <option value="name">Book Name</option>
          <option value="author">Author</option>
          <option value="isbn">ISBN</option>
        </select>

        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          aria-label="Search Term"
          onChange={(e) =>
            dispatch({
              type: "SET_SEARCH_TERM",
              payload: e.target.value,
            })
          }
        />

        <button type="submit" onClick={handleSearch}>
          Search
        </button>

        <button
          onClick={() => {
            dispatch({
              type: "SET_SEARCH_TERM",
              payload: "",
            });
            fetchBooks();
          }}
          type="button"
        >
          Clear
        </button>
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
