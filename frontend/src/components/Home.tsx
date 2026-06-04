import { useEffect, useState } from "react";
import Form from "../components/form";
const highlights = [
  "Search for books and discover what is available.",
  "Create a member account to manage borrowing activity.",
  "Keep track of your reading with a simple library experience.",
];

const Home = () => {
  const [backendMessage, setBackendMessage] = useState(
    "Checking backend connection...",
  );

  useEffect(() => {
    fetch("http://localhost:3000")
      .then((response) => response.text())
      .then((message) => setBackendMessage(message))
      .catch(() => setBackendMessage("Backend is currently unavailable."));
  }, []);

  return (
    <main className="home-page">
      <section className="hero-section" id="welcome">
        <div className="hero-copy">
          <p className="eyebrow">Library Management System</p>
          <h1>Welcome to your library.</h1>
          <p className="hero-text">
            Find books, keep up with your borrowing, and create an account to
            get started with the library.
          </p>
          <ul className="highlight-list" aria-label="Library benefits">
            {highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
          <div className="status-panel">
            <span className="status-label">Library service</span>
            <p>{backendMessage}</p>
          </div>
        </div>
        <Form />
      </section>

      <section className="content-section" id="benefits">
        <div className="section-heading">
          <h2>Why members use the library</h2>
          <p>A simple home screen for readers, not a technical dashboard.</p>
        </div>

        <div className="feature-grid">
          {[
            {
              title: "Browse with confidence",
              description:
                "Look through the catalog and see what books are ready to borrow.",
            },
            {
              title: "Create your member profile",
              description:
                "Sign up from the homepage so you can begin using library services.",
            },
            {
              title: "Stay organized",
              description:
                "Keep your reading activity in one place with a straightforward experience.",
            },
          ].map((feature) => (
            <article className="feature-item" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Home;
