import { useEffect, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getToken } from "../utils/auth";
import { useQuery } from "@tanstack/react-query";
const baseAPI = import.meta.env.VITE_BASE_API;
type State = {
  name: string;
  Author: string;
  ISBN: string;
  bookCode: string;
  submitting: boolean;
};

const initialState: State = {
  name: "",
  Author: "",
  ISBN: "",
  bookCode: "",
  submitting: false,
};

type Action =
  | { type: "SET_FIELD"; field: keyof State; value: string }
  | { type: "SET_BOOK"; payload: Omit<State, "submitting"> }
  | { type: "SET_SUBMITTING"; payload: boolean };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
      };

    case "SET_BOOK":
      return {
        ...state,
        ...action.payload,
      };

    case "SET_SUBMITTING":
      return {
        ...state,
        submitting: action.payload,
      };

    default:
      return state;
  }
}
const EditBook = () => {
  const token = getToken();
  // const decoded = token ? parseJwt(token) : null;
  // const customerCode = decoded?.customerCode;
  // const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const [state, dispatch] = useReducer(reducer, initialState);

  const { data: book, isLoading } = useQuery({
    queryKey: ["book", id],
    enabled: !!id,
    queryFn: async () => {
      const response = await fetch(`${baseAPI}/book/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch book");
      }

      return response.json();
    },
  });
  const b = book?.data || book;

  useEffect(() => {
    // const b = book?.data || book;
    if (!b) return;

    dispatch({
      type: "SET_BOOK",
      payload: {
        name: b.name ?? "",
        Author: b.Author ?? "",
        ISBN: b.ISBN ?? "",
        bookCode: b.bookCode ?? "",
      },
    });
  }, [book]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    dispatch({
      type: "SET_SUBMITTING",
      payload: true,
    });

    try {
      const res = await fetch(`${baseAPI}/book/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: state.name,
          Author: state.Author,
          ISBN: state.ISBN,
          bookCode: state.bookCode,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to update book");
      }

      navigate("/admin");
    } catch (err) {
      alert((err as Error).message || "Error updating book");
    } finally {
      dispatch({
        type: "SET_SUBMITTING",
        payload: false,
      });
    }
  };

  if (isLoading) return <p>Loading book...</p>;
  if (!b) return <p>No book found</p>;

  return (
    <div>
      <h2>Edit Book</h2>
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
          <label htmlFor="BookCode">Book Code</label>
          <input
            id="BookCode"
            value={state.bookCode}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                field: "bookCode",
                value: e.target.value,
              })
            }
          />
        </div>

        <div>
          <button type="submit" disabled={state.submitting}>
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

export default EditBook;
