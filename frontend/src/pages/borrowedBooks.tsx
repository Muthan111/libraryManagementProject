import { useEffect, useState } from "react";
import { getToken, parseJwt } from "../utils/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type borrowUsers = {
  id: number;
  borrowCode: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  book: {
    bookid: number;
    bookCode: string;
    name: string;
    Author: string;
    ISBN: string;
    status: string;
    borrowedById: number | null;
  };
};
const baseAPI = import.meta.env.VITE_BASE_API;
const BorrowedBooks = () => {
  const token = getToken();
  const decoded = token ? parseJwt(token) : null;
  const customerCode = decoded?.customerCode;
  const queryClient = useQueryClient();
  // const [records, setRecords] = useState<borrowUsers[]>([]);
  const handleReturnBook = async (borrowId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${baseAPI}/borrow/return`, {
        method: "POST", // or POST depending on your backend
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          borrowCode: borrowId,
        }),
      });

      if (!response.ok) {
        console.error("Failed to return book");
        return;
      }

      // update UI after success
      await queryClient.invalidateQueries({
        queryKey: ["borrowedBooks", customerCode],
      });
    } catch (err) {
      console.error("Error returning book:", err);
    }
  };
  // useEffect(() => {
  //   const token = getToken();
  //   if (!token) return;
  //   const decoded = parseJwt(token);
  //   console.log(decoded.customerCode);
  //   const fetchRecords = async () => {
  //     const response = await fetch(
  //       `${baseAPI}/borrow/user/${decoded.customerCode}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${getToken()}`,
  //         },
  //       },
  //     );
  //     if (!response.ok) {
  //       console.error("Failed to fetch borrow records");
  //       return;
  //     }
  //     const data = await response.json();
  //     setRecords(data);
  //     console.log(data);
  //     return data;
  //   };
  //   fetchRecords();
  // }, []);

  const {
    data: records = [],
    isLoading,
    error,
  } = useQuery<borrowUsers[]>({
    queryKey: ["borrowedBooks", customerCode],
    enabled: !!customerCode,
    queryFn: async () => {
      const response = await fetch(`${baseAPI}/borrow/user/${customerCode}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch borrow records");
      }

      return response.json();
    },
  });

  if (isLoading) {
    return <p>Loading borrowed books...</p>;
  }

  if (error) {
    return <p>Failed to load borrowed books.</p>;
  }
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1
        style={{
          textAlign: "center",
          marginBottom: "24px",
          fontSize: "2rem",
        }}
      >
        Borrowed Books
      </h1>

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {records?.length > 0 ? (
          records?.map((record) => (
            <div
              key={record.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                backgroundColor: "#fff",
              }}
            >
              <h3
                style={{
                  margin: "0 0 8px 0",
                }}
              >
                {record.book.name}
              </h3>

              <p>
                <strong>Author:</strong> {record.book.Author}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    color: record.status === "BORROWED" ? "#d97706" : "#16a34a",
                    fontWeight: "bold",
                  }}
                >
                  {record.status}
                </span>
              </p>

              <p>
                <strong>Borrowed:</strong>{" "}
                {new Date(record.borrowDate).toLocaleDateString()}
              </p>

              <p>
                <strong>Due:</strong>{" "}
                {new Date(record.dueDate).toLocaleDateString()}
              </p>

              {record.returnDate && (
                <p>
                  <strong>Returned:</strong>{" "}
                  {new Date(record.returnDate).toLocaleDateString()}
                </p>
              )}
              {record.status === "BORROWED" && (
                <button
                  onClick={() => handleReturnBook(record.borrowCode)}
                  style={{
                    marginTop: "12px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: "#2563eb",
                    color: "white",
                    fontWeight: "bold",
                  }}
                  type="button"
                >
                  Return Book
                </button>
              )}
            </div>
          ))
        ) : (
          <p
            style={{
              textAlign: "center",
              color: "#666",
            }}
          >
            No borrow records found.
          </p>
        )}
      </section>
    </div>
  );
};

export default BorrowedBooks;
