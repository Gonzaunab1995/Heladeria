import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth";
import Logo from "./Logo";

const linkClass = ({ isActive }) =>
  `rounded-full px-3 py-1.5 font-medium ${isActive ? "bg-menta" : "hover:bg-menta/60"}`;

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b-2 border-tinta bg-vainilla">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-11 w-11" />
          <span className="font-display text-2xl">IceCream</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          <NavLink to="/" end className={linkClass}>Armar helado</NavLink>
          {user ? (
            <>
              <NavLink to="/pedidos" className={linkClass}>Mis pedidos</NavLink>
              <NavLink to="/cuenta" className={linkClass}>Mi cuenta</NavLink>
              {user.is_admin && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
              <button onClick={logout} className="btn btn-plain ml-1">Salir</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Ingresar</NavLink>
              <NavLink to="/registro" className="btn ml-1 !py-1.5">Crear cuenta</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
