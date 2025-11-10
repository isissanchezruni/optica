import React, { useEffect, useState } from "react";
import { supabase } from "../../api/supabaseClient";

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [editingExam, setEditingExam] = useState(null);
  const [updatedFields, setUpdatedFields] = useState({});
  const [newExam, setNewExam] = useState({
    patient_id: "",
    scheduled_at: "",
    observations: "",
    specialist_role: "optometrist",
  });

  useEffect(() => {
    fetchExams();
    fetchPatients();
  }, [filterState, filterRole]);

  // 🔹 Cargar exámenes
  const fetchExams = async () => {
    setLoading(true);
    let query = supabase
      .from("exams")
      .select(`
        id,
        patient_id,
        scheduled_at,
        performed,
        observations,
        diagnosis,
        specialist_role,
        storage_path,
        created_at,
        profiles!exams_patient_id_fkey(full_name)
      `)
      .order("created_at", { ascending: false });

    if (filterState === "pending") query = query.eq("performed", false);
    if (filterState === "done") query = query.eq("performed", true);
    if (filterRole !== "all") query = query.eq("specialist_role", filterRole);

    const { data, error } = await query;
    if (error) console.error("Error al obtener exámenes:", error);
    else setExams(data || []);
    setLoading(false);
  };

  // 🔹 Cargar pacientes
  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "patient");
    if (error) console.error(error);
    else setPatients(data || []);
  };

  // 🔹 Crear nuevo examen
  const createExam = async (e) => {
    e.preventDefault();
    if (!newExam.patient_id || !newExam.scheduled_at) {
      alert("Selecciona un paciente y una fecha");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("exams").insert([
      {
        patient_id: newExam.patient_id,
        scheduled_at: newExam.scheduled_at,
        observations: newExam.observations,
        specialist_role: newExam.specialist_role,
        created_by: user.id,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Error al crear examen");
    } else {
      alert("Examen creado correctamente");
      setNewExam({
        patient_id: "",
        scheduled_at: "",
        observations: "",
        specialist_role: "optometrist",
      });
      fetchExams();
    }
  };

  // 🔹 Subir archivo PDF
  const uploadFile = async (examId, file) => {
    if (!file) return;
    const filePath = `exams/${examId}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("exams-pdfs")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error(uploadError);
      alert("Error al subir archivo");
      return;
    }

    const { error: updateError } = await supabase
      .from("exams")
      .update({ storage_path: filePath })
      .eq("id", examId);

    if (updateError) console.error(updateError);
    else alert("Archivo subido correctamente");
    fetchExams();
  };

  // 🔹 Guardar edición
  const handleSave = async (examId) => {
    const fields = updatedFields[examId];
    if (!fields) return;

    const { error } = await supabase.from("exams").update(fields).eq("id", examId);
    if (error) {
      console.error(error);
      alert("Error al guardar cambios");
    } else {
      alert("Cambios guardados correctamente");
      setEditingExam(null);
      setUpdatedFields((prev) => {
        const copy = { ...prev };
        delete copy[examId];
        return copy;
      });
      fetchExams();
    }
  };

  // 🔹 Eliminar examen
  const deleteExam = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este examen?")) return;
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Error al eliminar examen");
    } else {
      alert("Examen eliminado correctamente");
      fetchExams();
    }
  };

  // 🔹 Alternar estado realizado
  const togglePerformed = async (exam) => {
    const { error } = await supabase
      .from("exams")
      .update({ performed: !exam.performed })
      .eq("id", exam.id);
    if (error) console.error(error);
    else fetchExams();
  };

  const getPublicUrl = (path) => {
    if (!path) return null;
    const { data } = supabase.storage.from("exams-pdfs").getPublicUrl(path);
    return data?.publicUrl || null;
  };

  return (
    <div>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>Gestión de Exámenes</h2>

      {/* 🔹 Filtros */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <label style={{ fontWeight: 600, marginRight: "8px" }}>Estado:</label>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "6px" }}
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="done">Realizados</option>
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 600, marginRight: "8px" }}>Especialista:</label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "6px" }}
          >
            <option value="all">Ambos</option>
            <option value="optometrist">Optometrista</option>
            <option value="ortoptist">Ortoptista</option>
          </select>
        </div>
      </div>

      {/* 🔹 Crear examen */}
      <form
        onSubmit={createExam}
        className="card"
        style={{ marginBottom: "2rem", maxWidth: 700 }}
      >
        <h3>Crear nuevo examen</h3>
        <label>Paciente:</label>
        <select
          value={newExam.patient_id}
          onChange={(e) => setNewExam({ ...newExam, patient_id: e.target.value })}
          style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
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
          value={newExam.specialist_role}
          onChange={(e) => setNewExam({ ...newExam, specialist_role: e.target.value })}
          style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
        >
          <option value="optometrist">Optometrista</option>
          <option value="ortoptist">Ortoptista</option>
        </select>

        <label>Fecha programada:</label>
        <input
          type="datetime-local"
          value={newExam.scheduled_at}
          onChange={(e) => setNewExam({ ...newExam, scheduled_at: e.target.value })}
          style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
        />

        <label>Observaciones iniciales:</label>
        <textarea
          value={newExam.observations}
          onChange={(e) => setNewExam({ ...newExam, observations: e.target.value })}
          rows="3"
          style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
        />

        <button className="save-btn" type="submit">
          ➕ Crear examen
        </button>
      </form>

      {/* 🔹 Tabla */}
      <div className="card">
        {loading ? (
          <p>Cargando...</p>
        ) : exams.length === 0 ? (
          <p>No hay exámenes en este estado.</p>
        ) : (
          <table className="exams-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Especialista</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Observaciones</th>
                <th>Diagnóstico</th>
                <th>Archivo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id}>
                  <td>{exam.profiles?.full_name || "—"}</td>
                  <td>{exam.specialist_role}</td>
                  <td>{new Date(exam.scheduled_at).toLocaleString()}</td>
                  <td>
                    <button
                      className={`status-btn ${exam.performed ? "done" : "pending"}`}
                      onClick={() => togglePerformed(exam)}
                    >
                      {exam.performed ? "Realizado" : "Pendiente"}
                    </button>
                  </td>
                  <td>
                    {editingExam === exam.id ? (
                      <textarea
                        value={updatedFields[exam.id]?.observations ?? exam.observations ?? ""}
                        onChange={(e) =>
                          setUpdatedFields({
                            ...updatedFields,
                            [exam.id]: {
                              ...updatedFields[exam.id],
                              observations: e.target.value,
                            },
                          })
                        }
                        rows="3"
                        style={{ width: "100%", padding: "6px" }}
                      />
                    ) : (
                      exam.observations || "—"
                    )}
                  </td>
                  <td>
                    {editingExam === exam.id ? (
                      <input
                        type="text"
                        value={updatedFields[exam.id]?.diagnosis ?? exam.diagnosis ?? ""}
                        onChange={(e) =>
                          setUpdatedFields({
                            ...updatedFields,
                            [exam.id]: {
                              ...updatedFields[exam.id],
                              diagnosis: e.target.value,
                            },
                          })
                        }
                        style={{ width: "100%", padding: "6px" }}
                      />
                    ) : (
                      exam.diagnosis || "—"
                    )}
                  </td>
                  <td>
                    {exam.storage_path ? (
                      <a
                        href={getPublicUrl(exam.storage_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📄 Ver archivo
                      </a>
                    ) : (
                      <input type="file" onChange={(e) => uploadFile(exam.id, e.target.files[0])} />
                    )}
                  </td>
                  <td>
                    {editingExam === exam.id ? (
                      <>
                        <button className="save-btn" onClick={() => handleSave(exam.id)}>
                          💾 Guardar
                        </button>
                        <button className="cancel-btn" onClick={() => setEditingExam(null)}>
                          ✖ Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="edit-btn" onClick={() => setEditingExam(exam.id)}>
                          ✏️ Editar
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => deleteExam(exam.id)}
                          style={{ marginLeft: "6px" }}
                        >
                          🗑 Eliminar
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
