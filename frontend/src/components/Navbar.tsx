import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="top-nav" aria-label="Primary">
      <div className="brand-block">
        <span className="brand-mark">LM</span>
        <div>
          <p className="brand-name">Library Management System</p>
          <p className="brand-subtitle">Welcome readers and members</p>
        </div>
      </div>

      <div className="nav-links">
        <li>
          <Link to="/frontend/src/components/Home.tsx">Home</Link>
        </li>
        <li>
          <Link to="/frontend/src/pages/book.tsx">Books</Link>
        </li>
        <li>
          <Link to="/frontend/src/pages/borrowedBooks.tsx">Borrowed Books</Link>
        </li>
        <li>
          <Link to="/frontend/src/pages/profile.tsx">Profile</Link>
        </li>
      </div>
    </nav>
  );
};

export default Navbar;
