import React, { useEffect, useState } from "react";
import { supabase } from "../../api/supabaseClient";
import { useAuth } from "../../hooks/useAuth";

export default function PatientAppointments() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [newAppointment, setNewAppointment] = useState({
    specialist_role: "optometrist",
    scheduled_at: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) fetchAppointments();
  }, [profile]);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id, scheduled_at, status, specialist_role, 
        created_at, specialist_id, 
        profiles!appointments_specialist_id_fkey(full_name)
      `)
      .eq("patient_id", profile.id)
      .order("scheduled_at", { ascending: false });

    if (error) console.error(error);
    else setAppointments(data || []);
    setLoading(false);
  };

  const createAppointment = async (e) => {
    e.preventDefault();
    if (!newAppointment.scheduled_at) return alert("Selecciona una fecha y hora");

    const { error } = await supabase.from("appointments").insert([
      {
        patient_id: profile.id,
        specialist_role: newAppointment.specialist_role,
        scheduled_at: newAppointment.scheduled_at,
        created_by: profile.id,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Error al crear la cita");
    } else {
      alert("Cita creada correctamente");
      setNewAppointment({ specialist_role: "optometrist", scheduled_at: "" });
      fetchAppointments();
    }
  };

  const cancelAppointment = async (id) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "canceled" })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("No se pudo cancelar la cita");
    } else {
      fetchAppointments();
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>Mis Citas</h2>

      {/* Crear nueva cita */}
      <form
        onSubmit={createAppointment}
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          marginBottom: "2rem",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          maxWidth: 500,
        }}
      >
        <h3>Agendar nueva cita</h3>

        <label>Tipo de especialista:</label>
        <select
          value={newAppointment.specialist_role}
          onChange={(e) =>
            setNewAppointment({ ...newAppointment, specialist_role: e.target.value })
          }
          style={{ display: "block", margin: "0.5rem 0", width: "100%", padding: "8px" }}
        >
          <option value="optometrist">Optometrista</option>
          <option value="ortoptist">Ortoptista</option>
        </select>

        <label>Fecha y hora:</label>
        <input
          type="datetime-local"
          value={newAppointment.scheduled_at}
          onChange={(e) =>
            setNewAppointment({ ...newAppointment, scheduled_at: e.target.value })
          }
          style={{ display: "block", margin: "0.5rem 0 1rem 0", width: "100%", padding: "8px" }}
        />

        <button
          type="submit"
          style={{
            background: "#007bff",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Crear cita
        </button>
      </form>

      {/* Listado de citas */}
      <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px" }}>
        <h3>Historial de citas</h3>
        {loading ? (
          <p>Cargando...</p>
        ) : appointments.length === 0 ? (
          <p>No tienes citas registradas.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
            <thead>
              <tr style={{ background: "#f0f4ff", textAlign: "left" }}>
                <th>Fecha</th>
                <th>Especialista</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td>{new Date(a.scheduled_at).toLocaleString()}</td>
                  <td>{a.specialist_role}</td>
                  <td>{a.status}</td>
                  <td>
                    {a.status === "scheduled" && (
                      <button
                        onClick={() => cancelAppointment(a.id)}
                        style={{
                          background: "#dc3545",
                          color: "white",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
