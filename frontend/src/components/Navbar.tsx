import { Link, useNavigate } from "react-router-dom";
import { getToken, parseJwt, removeToken } from "../utils/auth";

const Navbar = () => {
  // const [user, setUser] = useState<{ email?: string; role?: string } | null>(
  //   null,
  // );
  const token = getToken();
  const navigate = useNavigate();
  const user = token
    ? (() => {
        const payload: any = parseJwt(token);
        return { email: payload?.email, role: payload?.role };
      })()
    : null;

  const handleLogout = () => {
    removeToken();
    navigate("/");
  };

  // useEffect(() => {
  //   const token = getToken();
  //   if (token) {
  //     const payload: any = parseJwt(token);
  //     setUser({ email: payload?.email, role: payload?.role });
  //   } else {
  //     setUser(null);
  //   }
  // }, []);

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
          <Link to="/profile">Profile</Link>
        </li>
        <li>
          <Link to="/admin">Admin</Link>
        </li>

        {user ? (
          <>
            <li className="nav-user">
              <span>
                {user.email || "Member"} {user.role ? `(${user.role})` : ""}
              </span>
            </li>

            <li>
              <button
                type="button"
                className="link-button"
                onClick={handleLogout}
              >
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
