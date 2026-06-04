import { useState, type ChangeEvent, type FormEvent } from "react";
const initialForm = {
  name: "",
  email: "",
  password: "",
  isAdmin: false,
};

const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password: string) => {
  return password.length >= 8;
};
const Form = () => {
  const [formData, setFormData] = useState(initialForm);
  const [accountMessage, setAccountMessage] = useState(
    "Create an account to start using the library.",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccountMessage("Creating your account...");

    // Client-side validation to avoid obvious backend rejections
    if (!formData.name.trim()) {
      setAccountMessage("Please enter your full name.");
      return;
    }

    if (!validateEmail(formData.email)) {
      setAccountMessage("Please enter a valid email address.");
      return;
    }

    if (!validatePassword(formData.password)) {
      setAccountMessage("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:3000/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.isAdmin ? "ADMIN" : "MEMBER",
        }),
      });

      if (response.status === 409) {
        setAccountMessage("An account with that email already exists.");
        return;
      }

      if (response.status === 400) {
        // attempt to show backend validation message
        try {
          const data = await response.json();
          setAccountMessage(data.message || "Invalid signup details.");
        } catch {
          setAccountMessage("Invalid signup details.");
        }
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to create account.");
      }

      setFormData(initialForm);
      setAccountMessage("Your account has been created. You can now sign in.");
    } catch (err) {
      setAccountMessage("We could not create your account right now.");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div>
      <section
        className="signup-panel"
        aria-label="Create account"
        id="membership"
      >
        <div className="signup-heading">
          <h2>Make an account</h2>
          <p>Join as a library member and start managing your books.</p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Full name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <label htmlFor="isAdmin">Are you an admin?</label>
          <input
            id="isAdmin"
            name="isAdmin"
            type="checkbox"
            checked={formData.isAdmin}
            onChange={handleChange}
          />

          <button
            className="primary-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="account-message">{accountMessage}</p>
      </section>
    </div>
  );
};

export default Form;
