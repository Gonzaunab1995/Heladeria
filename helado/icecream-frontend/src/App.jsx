import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import Register from "./pages/Register";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/pedidos" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/cuenta" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute admin><Admin /></ProtectedRoute>} />
        <Route path="*" element={<main className="p-12 text-center"><h1 className="font-display text-4xl">No encontramos esa página</h1></main>} />
      </Routes>
    </>
  );
}
