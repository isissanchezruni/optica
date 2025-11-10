import React, { useEffect, useState } from "react";
import { supabase } from "../../api/supabaseClient";

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [newAppointment, setNewAppointment] = useState({
    patient_id: "",
    specialist_id: "",
    scheduled_at: "",
  });
  const [patients, setPatients] = useState([]);
  const [specialists, setSpecialists] = useState([]);

  useEffect(() => {
    fetchAppointments();
    fetchLists();
  }, []);

  const fetchLists = async () => {
    const [{ data: pat }, { data: spec }] = await Promise.all([
      supabase.from("profiles").select("id, full_name").eq("role", "patient"),
      supabase
        .from("profiles")
        .select("id, full_name, role")
        .in("role", ["optometrist", "ortoptist"]),
    ]);
    setPatients(pat || []);
    setSpecialists(spec || []);
  };

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id, scheduled_at, status, specialist_role,
        patient:profiles!appointments_patient_id_fkey(full_name),
        specialist:profiles!appointments_specialist_id_fkey(full_name)
      `)
      .order("scheduled_at", { ascending: false });

    if (error) console.error(error);
    else setAppointments(data || []);
    setLoading(false);
  };

  const createAppointment = async (e) => {
    e.preventDefault();
    if (!newAppointment.patient_id || !newAppointment.specialist_id || !newAppointment.scheduled_at)
      return alert("Completa todos los campos");

    // Buscar el rol del especialista
    const specialist = specialists.find((s) => s.id === newAppointment.specialist_id);

    const { error } = await supabase.from("appointments").insert([
      {
        patient_id: newAppointment.patient_id,
        specialist_id: newAppointment.specialist_id,
        specialist_role: specialist?.role || null,
        scheduled_at: newAppointment.scheduled_at,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Error al crear cita");
    } else {
      alert("Cita creada correctamente");
      setNewAppointment({ patient_id: "", specialist_id: "", scheduled_at: "" });
      fetchAppointments();
    }
  };

  const deleteAppointment = async (id) => {
    if (!confirm("¿Eliminar cita?")) return;
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) alert("No se pudo eliminar");
    else fetchAppointments();
  };

  const filteredAppointments = appointments.filter(
    (a) =>
      a.patient?.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
      a.specialist?.full_name?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>Gestión de Citas</h2>

      {/* Formulario de creación */}
      <form
        onSubmit={createAppointment}
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          marginBottom: "2rem",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          maxWidth: 700,
        }}
      >
        <h3>Agendar nueva cita</h3>

        <label>Paciente:</label>
        <select
          value={newAppointment.patient_id}
          onChange={(e) =>
            setNewAppointment({ ...newAppointment, patient_id: e.target.value })
          }
          style={{ display: "block", width: "100%", marginBottom: "1rem", padding: "8px" }}
        >
          <option value="">-- Selecciona paciente --</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>

        <label>Especialista:</label>
        <select
          value={newAppointment.specialist_id}
          onChange={(e) =>
            setNewAppointment({ ...newAppointment, specialist_id: e.target.value })
          }
          style={{ display: "block", width: "100%", marginBottom: "1rem", padding: "8px" }}
        >
          <option value="">-- Selecciona especialista --</option>
          {specialists.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name} ({s.role})
            </option>
          ))}
        </select>

        <label>Fecha y hora:</label>
        <input
          type="datetime-local"
          value={newAppointment.scheduled_at}
          onChange={(e) =>
            setNewAppointment({ ...newAppointment, scheduled_at: e.target.value })
          }
          style={{ display: "block", width: "100%", marginBottom: "1rem", padding: "8px" }}
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

      {/* Filtro */}
      <input
        type="text"
        placeholder="Buscar por paciente o especialista..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{
          marginBottom: "1rem",
          padding: "8px",
          width: "100%",
          maxWidth: "400px",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      />

      {/* Tabla */}
      <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px" }}>
        {loading ? (
          <p>Cargando...</p>
        ) : filteredAppointments.length === 0 ? (
          <p>No hay citas.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0f4ff", textAlign: "left" }}>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Especialista</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td>{new Date(a.scheduled_at).toLocaleString()}</td>
                  <td>{a.patient?.full_name || "Sin nombre"}</td>
                  <td>
                    {a.specialist
                      ? a.specialist.full_name
                      : `No asignado (${a.specialist_role || "rol no definido"})`}
                  </td>
                  <td>{a.status}</td>
                  <td>
                    <button
                      onClick={() => deleteAppointment(a.id)}
                      style={{
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Eliminar
                    </button>
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
