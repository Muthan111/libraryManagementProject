import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getToken, parseJwt, removeToken } from "../utils/auth";

const Navbar = () => {
  const [user, setUser] = useState<{ email?: string; role?: string } | null>(
    null,
  );
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (token) {
      const payload: any = parseJwt(token);
      setUser({ email: payload?.email, role: payload?.role });
    } else {
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    removeToken();
    setUser(null);
    navigate("/");
  };

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
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/books">Books</Link>
        </li>
        <li>
          <Link to="/books/borrowed">Borrowed Books</Link>
        </li>
        <li>
          <Link to="/frontend/src/pages/profile.tsx">Profile</Link>
        </li>
        <li>
          <Link to="/frontend/src/pages/admin.tsx">Admin</Link>
        </li>
        {user ? (
          <>
            <li className="nav-user">
              <span>
                {user.email || "Member"} {user.role ? `(${user.role})` : ""}
              </span>
            </li>
            <li>
              <button className="link-button" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link to="/login">Login</Link>
          </li>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
