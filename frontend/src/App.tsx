import Home from "./components/Home";
import Book from "./pages/book";
import BookDetail from "./pages/bookDetail";
import BorrowedBooks from "./pages/borrowedBooks";
import Profile from "./pages/profile";
import Login from "./components/Login";
import Admin from "./pages/admin";
import AddBook from "./pages/AddBook";
import EditBook from "./pages/EditBook";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Chatbot from "./components/Chatbot";
import Button from "./components/button";
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
    <div>
      <Navbar />
      <Chatbot />
      <Button label="Click me" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/books" element={<Book />} />
        <Route path="/books/:bookCode" element={<BookDetail />} />
        <Route path="/books/borrowed" element={<BorrowedBooks />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/add" element={<AddBook />} />
        <Route path="/admin/edit/:id" element={<EditBook />} />
      </Routes>
    </div>
  );
}

export default App;
