import { useEffect, useState } from "react";
const Page1 = () => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000")
      .then((res) => res.text())
      .then((data) => setMessage(data))
      .catch((err) => console.error(err));
  }, []);
  return <div>{message}</div>;
};

export default Page1;
