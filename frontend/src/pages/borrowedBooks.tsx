import { useEffect, useState } from "react";
import { getToken, parseJwt } from "../utils/auth";

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
const BorrowedBooks = () => {
  const baseAPI = import.meta.env.VITE_BASE_API;
  const [records, setRecords] = useState<borrowUsers[]>([]);
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const decoded = parseJwt(token);
    console.log(decoded.customerCode);
    const fetchRecords = async () => {
      const response = await fetch(
        `${baseAPI}/borrow/user/${decoded.customerCode}`,
      );
      if (!response.ok) {
        console.error("Failed to fetch borrow records");
        return;
      }
      const data = await response.json();
      setRecords(data);
      console.log(data);
      return data;
    };
    fetchRecords();
  }, []);
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
        {records.length > 0 ? (
          records.map((record) => (
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
