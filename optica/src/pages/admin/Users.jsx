// src/pages/admin/Users.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../api/supabaseClient";
import ProfileForm from "../../components/ProfileForm";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) console.error(error);
      else setUsers(data);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  if (loading) return <p>Cargando usuarios...</p>;

  return (
    <div style={{ display: "flex", gap: 32 }}>
      <div style={{ flex: 1 }}>
        <h2>Usuarios registrados</h2>
        <ul>
          {users.map((u) => (
            <li
              key={u.id}
              onClick={() => setSelected(u.id)}
              style={{
                cursor: "pointer",
                padding: "8px",
                background: selected === u.id ? "#dbeafe" : "#f9f9f9",
                marginBottom: "6px",
                borderRadius: "6px",
              }}
            >
              {u.full_name} ({u.role})
            </li>
          ))}
        </ul>
      </div>

      <div style={{ flex: 2 }}>
        {selected ? (
          <ProfileForm userId={selected} />
        ) : (
          <p>Selecciona un usuario para editar</p>
        )}
      </div>
    </div>
  );
}
