import React, { useEffect, useState } from "react";
import { supabase } from "../../api/supabaseClient";
import { useAuth } from "../../hooks/useAuth";

export default function SpecialistReferrals() {
  const { profile } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReferral, setNewReferral] = useState({
    patient_id: "",
    to_role: "",
    reason: "",
  });

  useEffect(() => {
    if (profile?.id) {
      fetchReferrals();
      fetchPatients();
    }
  }, [profile]);

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "patient");

    if (error) console.error(error);
    else setPatients(data || []);
  };

  const fetchReferrals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("referrals")
      .select(`
        id,
        patient_id,
        from_role,
        to_role,
        reason,
        created_at,
        profiles!referrals_patient_id_fkey(full_name)
      `)
      .or(`from_role.eq.${profile.role},to_role.eq.${profile.role}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Error al cargar remisiones");
    } else {
      setReferrals(data || []);
    }
    setLoading(false);
  };

  const createReferral = async (e) => {
    e.preventDefault();

    if (!newReferral.patient_id || !newReferral.to_role || !newReferral.reason) {
      alert("Por favor completa todos los campos.");
      return;
    }

    const { error } = await supabase.from("referrals").insert([
      {
        patient_id: newReferral.patient_id,
        from_role: profile.role,
        to_role: newReferral.to_role,
        reason: newReferral.reason,
        created_by: profile.id,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Error al crear la remisión");
    } else {
      alert("Remisión creada correctamente");
      setNewReferral({ patient_id: "", to_role: "", reason: "" });
      fetchReferrals();
    }
  };

  return (
    <div className="referrals-container">
      <h2 className="section-title">
        Remisiones de {profile.role === "optometrist" ? "Optometrista" : "Ortoptista"}
      </h2>

      <form onSubmit={createReferral} className="form-card">
        <h3>Crear nueva remisión</h3>

        <label>Paciente:</label>
        <select
          value={newReferral.patient_id}
          onChange={(e) =>
            setNewReferral({ ...newReferral, patient_id: e.target.value })
          }
        >
          <option value="">-- Selecciona paciente --</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>

        <label>Especialista destinatario:</label>
        <select
          value={newReferral.to_role}
          onChange={(e) =>
            setNewReferral({ ...newReferral, to_role: e.target.value })
          }
        >
          <option value="">-- Selecciona el tipo de especialista --</option>
          {profile.role === "optometrist" ? (
            <option value="ortoptist">Ortoptista</option>
          ) : (
            <option value="optometrist">Optometrista</option>
          )}
        </select>

        <label>Motivo:</label>
        <textarea
          value={newReferral.reason}
          onChange={(e) =>
            setNewReferral({ ...newReferral, reason: e.target.value })
          }
          rows="3"
          placeholder="Describe brevemente la razón de la remisión..."
        />

        <button type="submit" className="btn-primary">
          Crear remisión
        </button>
      </form>

      <div className="table-card">
        <h3>Historial de remisiones</h3>

        {loading ? (
          <p>Cargando...</p>
        ) : referrals.length === 0 ? (
          <p>No hay remisiones registradas.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>De</th>
                <th>Para</th>
                <th>Motivo</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id}>
                  <td>{r.profiles?.full_name || "—"}</td>
                  <td>{r.from_role === "optometrist" ? "Optometrista" : "Ortoptista"}</td>
                  <td>{r.to_role === "optometrist" ? "Optometrista" : "Ortoptista"}</td>
                  <td>{r.reason}</td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
