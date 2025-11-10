import React, { useEffect, useState } from "react";
import { supabase } from "../../api/supabaseClient";
import { useAuth } from "../../hooks/useAuth";

export default function SpecialistAppointments() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAppointment, setNewAppointment] = useState({
    patient_id: "",
    scheduled_at: "",
  });
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    if (profile?.id) {
      fetchAppointments();
      fetchPatients();
    }
  }, [profile]);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id, scheduled_at, status, specialist_role,
        patient_id, created_at,
        patient:profiles!appointments_patient_id_fkey(full_name)
      `)
      .eq("specialist_role", profile.role)
      .order("scheduled_at", { ascending: true });

    if (error) console.error(error);
    else setAppointments(data || []);
    setLoading(false);
  };

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "patient")
      .order("full_name", { ascending: true });
    if (!error) setPatients(data || []);
  };

  const createAppointment = async (e) => {
    e.preventDefault();
    if (!newAppointment.patient_id || !newAppointment.scheduled_at)
      return alert("Completa todos los campos");

    const { error } = await supabase.from("appointments").insert([
      {
        patient_id: newAppointment.patient_id,
        specialist_id: profile.id,
        specialist_role: profile.role,
        scheduled_at: newAppointment.scheduled_at,
        created_by: profile.id,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Error al crear cita");
    } else {
      alert("Cita creada correctamente");
      setNewAppointment({ patient_id: "", scheduled_at: "" });
      fetchAppointments();
    }
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Error al actualizar cita");
    } else {
      fetchAppointments();
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>
        Citas Asignadas ({profile.role})
      </h2>

      {/* Crear cita */}
      <form
        onSubmit={createAppointment}
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          marginBottom: "2rem",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          maxWidth: 600,
        }}
      >
        <h3>Agendar nueva cita</h3>

        <label>Paciente:</label>
        <select
          value={newAppointment.patient_id}
          onChange={(e) =>
            setNewAppointment({ ...newAppointment, patient_id: e.target.value })
          }
          style={{ display: "block", margin: "0.5rem 0", width: "100%", padding: "8px" }}
        >
          <option value="">-- Selecciona un paciente --</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
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

      {/* Listado */}
      <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px" }}>
        {loading ? (
          <p>Cargando...</p>
        ) : appointments.length === 0 ? (
          <p>No hay citas registradas.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0f4ff", textAlign: "left" }}>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td>{new Date(a.scheduled_at).toLocaleString()}</td>
                  <td>{a.patient?.full_name || "Desconocido"}</td>
                  <td>{a.status}</td>
                  <td>
                    {a.status === "scheduled" && (
                      <>
                        <button
                          onClick={() => updateStatus(a.id, "done")}
                          style={{
                            background: "#28a745",
                            color: "white",
                            border: "none",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            marginRight: "8px",
                          }}
                        >
                          Hecha
                        </button>
                        <button
                          onClick={() => updateStatus(a.id, "canceled")}
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
                      </>
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
