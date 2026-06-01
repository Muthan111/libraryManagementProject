import Home from "./components/Home";
import Book from "./pages/book";
import BookDetail from "./pages/bookDetail";
import BorrowedBooks from "./pages/borrowedBooks";
import Profile from "./pages/profile";
import { Routes, Route } from "react-router-dom";
import "./App.css";
// const books = [
//   {
//     id: "atomic-habits",
//     title: "Atomic Habits",
//     author: "James Clear",
//     genre: "Self improvement",
//     available: true,
//     description: "A practical guide to building better habits.",
//   },
//   {
//     id: "clean-code",
//     title: "Clean Code",
//     author: "Robert C. Martin",
//     genre: "Programming",
//     available: false,
//     description: "A book about writing readable, maintainable code.",
//   },
// ];
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/books" element={<Book />} />
      <Route path="/books/:bookCode" element={<BookDetail />} />
      <Route path="/frontend/src/pages/book.tsx" element={<Book />} />
      <Route
        path="/frontend/src/pages/borrowedBooks.tsx"
        element={<BorrowedBooks />}
      />
      <Route path="/frontend/src/pages/profile.tsx" element={<Profile />} />
    </Routes>
  );
}

export default App;
