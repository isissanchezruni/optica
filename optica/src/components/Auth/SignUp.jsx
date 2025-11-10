import { useState } from "react";
import { supabase } from "../../api/supabaseClient";
import { useNavigate, Link } from "react-router-dom";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    console.log("Respuesta Supabase:", data);

    const user = data?.user ?? data?.session?.user;

    if (user) {
      const { error: insertError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          full_name: fullName,
          email,
          role: "patient", // por defecto, paciente
        },
      ]);

      if (insertError) {
        console.error("Error al insertar en profiles:", insertError.message);
        alert("Error al crear el perfil: " + insertError.message);
        return;
      }
    }

    alert("Cuenta creada correctamente. Verifica tu correo.");
    navigate("/signin");
  };

  return (
    <div className="auth-container">
      <h2>Registro de Paciente</h2>
      <form onSubmit={handleSignUp}>
        <input
          type="text"
          placeholder="Nombre completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Registrarse</button>
      </form>

      {/* 🔹 Enlace para volver al login */}
      <p className="register-link">
        ¿Ya tienes cuenta?{" "}
        <Link to="/signin" className="link">
          Inicia sesión aquí
        </Link>
      </p>
    </div>
  );
}
