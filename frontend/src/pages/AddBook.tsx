import { useState, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../utils/auth";

type State = {
  name: string;
  Author: string;
  ISBN: string;
  status: string;
  submitting: boolean;
};

type Action =
  | { type: "SET_FIELD"; field: keyof Omit<State, "submitting">; value: string }
  | { type: "SET_SUBMITTING"; value: boolean }
  | { type: "RESET" };

const initialState: State = {
  name: "",
  Author: "",
  ISBN: "",
  status: "available",
  submitting: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
      };

    case "SET_SUBMITTING":
      return {
        ...state,
        submitting: action.value,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

const AddBook = () => {
  const baseAPI = import.meta.env.VITE_BASE_API;
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(reducer, initialState);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "SET_SUBMITTING", value: true });

    try {
      const res = await fetch(`${baseAPI}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: state.name,
          Author: state.Author,
          ISBN: state.ISBN,
          status: state.status,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to create book");
      }

      navigate("/admin");
    } catch (err) {
      alert((err as Error).message || "Error creating book");
    } finally {
      dispatch({ type: "SET_SUBMITTING", value: false });
    }
  };

  return (
    <div className="form-box" style={{ maxWidth: 700, margin: "24px auto" }}>
      <h2 style={{ marginTop: 0 }}>Add Book</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            value={state.name}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                field: "name",
                value: e.target.value,
              })
            }
            required
          />
        </div>

        <div>
          <label htmlFor="Author">Author</label>
          <input
            id="Author"
            value={state.Author}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                field: "Author",
                value: e.target.value,
              })
            }
            required
          />
        </div>

        <div>
          <label htmlFor="ISBN">ISBN</label>
          <input
            id="ISBN"
            value={state.ISBN}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                field: "ISBN",
                value: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label htmlFor="Status">Status</label>
          <select
            value={status}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                field: "status",
                value: e.target.value,
              })
            }
          >
            <option value="available">Available</option>
            <option value="borrowed">Borrowed</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="primary-button"
            type="submit"
            disabled={state.submitting}
          >
            {state.submitting ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={() => navigate("/admin")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBook;
