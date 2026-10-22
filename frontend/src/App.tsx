import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

type Entity = {
  id: number;
  name: string;
  type: string;
  status: string;
  latitude: number;
  longitude: number;
  description: string;
};

type EntityForm = {
  name: string;
  type: string;
  status: string;
  latitude: string;
  longitude: string;
  description: string;
};

const emptyForm: EntityForm = {
  name: "",
  type: "iot_device",
  status: "active",
  latitude: "",
  longitude: "",
  description: "",
};

const defaultCenter: [number, number] = [-6.2088, 106.8456];

function MapFocus({ entity }: { entity: Entity | null }) {
  const map = useMap();

  useEffect(() => {
    if (entity) {
      map.flyTo([entity.latitude, entity.longitude], 13, {
        duration: 0.8,
      });
    }
  }, [entity, map]);

  return null;
}

function getMarkerIcon(status: string) {
  const colors: Record<string, string> = {
    active: "#16a34a",
    inactive: "#64748b",
    maintenance: "#d97706",
  };

  const color = colors[status] ?? "#2563eb";

  return L.divIcon({
    className: "entity-marker-wrapper",
    html: `<div class="entity-marker" style="background:${color}"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function App() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEntityId, setEditingEntityId] = useState<number | null>(null);
  const [form, setForm] = useState<EntityForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadEntities() {
      try {
        const response = await fetch("/api/entities");

        if (!response.ok) {
          throw new Error("Failed to retrieve entity data from the server.");
        }

        const data: Entity[] = await response.json();
        setEntities(data);
        setSelectedEntity(data[0] ?? null);
      } catch {
        setError(
          "Unable to load the entity. Make sure the Go backend is running on port 8080.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadEntities();
  }, []);

  const activeCount = entities.filter(
    (entity) => entity.status === "active",
  ).length;

  const filteredEntities = entities.filter((entity) =>
    entity.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  async function handleCreateEntity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (!name) {
      setFormError("The entity name is required.");
      return;
    }

    if (
      form.latitude.trim() === "" ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      setFormError("Latitude must be a number between -90 and 90.");
      return;
    }

    if (
      form.longitude.trim() === "" ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      setFormError("Longitude must be a number between -180 and 180.");
      return;
    }

    setSaving(true);

    try {
      const isEditing = editingEntityId !== null;
      const url = isEditing
        ? `/api/entities/${editingEntityId}`
        : "/api/entities";

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          type: form.type,
          status: form.status,
          latitude,
          longitude,
          description: form.description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add an entity.");
      }

      const savedEntity = data as Entity;

      setEntities((current) =>
        isEditing
          ? current.map((entity) =>
              entity.id === savedEntity.id ? savedEntity : entity,
            )
          : [...current, savedEntity],
      );
      setSelectedEntity(savedEntity);
      setShowCreateForm(false);
      setEditingEntityId(null);
      setForm(emptyForm);
      setFormError("");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "An error occurred while saving the entity.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openEditForm(entity: Entity) {
    setEditingEntityId(entity.id);

    setForm({
      name: entity.name,
      type: entity.type,
      status: entity.status,
      latitude: String(entity.latitude),
      longitude: String(entity.longitude),
      description: entity.description,
    });

    setFormError("");
    setShowCreateForm(true);
  }

  async function handleDeleteEntity(entity: Entity) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${entity.name}"?`,
    );

    if (!confirmed) return;

    setError("");

    try {
      const response = await fetch(`/api/entities/${entity.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete the entity.");
      }

      const remainingEntities = entities.filter(
        (item) => item.id !== entity.id,
      );

      setEntities(remainingEntities);

      if (selectedEntity?.id === entity.id) {
        setSelectedEntity(remainingEntities[0] ?? null);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while deleting the entity.",
      );
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">G</div>
          <div>
            <h1>Geo Entity Manager</h1>
            <p>MANAGEMENT SYSTEM</p>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="section-label">WORKSPACE</p>
          <div className="nav-item active">
            <span>▦</span> Entity Overview
          </div>
          <div className="nav-item">
            <span>⌖</span> Entity Locations
          </div>
        </div>

        <div className="entity-heading">
          <div>
            <p className="section-label">YOUR ENTITIES</p>
            <h2>All Entities</h2>
          </div>
          <span className="count-badge">{entities.length}</span>
        </div>

        <div className="entity-list">
          <div className="entity-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="text"
              name="searchentities"
              aria-label="Search for entities by name"
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                name="clearsearch"
                aria-label="Clear search"
                onClick={() => setSearchQuery("")}
              >
                ×
              </button>
            )}
          </div>

          {loading && <p className="muted">Loading entities...</p>}

          {!loading && !error && filteredEntities.length === 0 && (
            <p className="muted">
              {searchQuery
                ? "No matching entities were found."
                : "No entity has been created yet."}
            </p>
          )}

          {filteredEntities.map((entity) => (
            <button
              className={`entity-item ${
                selectedEntity?.id === entity.id ? "selected" : ""
              }`}
              key={entity.id}
              onClick={() => setSelectedEntity(entity)}
            >
              <span className={`status-dot ${entity.status}`} />
              <span className="entity-item-content">
                <strong>{entity.name}</strong>
                <small>{entity.type.replace("_", " ")}</small>
              </span>
              <span className="entity-arrow">›</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <span className="connection-dot" />
          <span>API connection</span>
          <strong>Local</strong>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Workspace / Overview</p>
            <h2>Entity Overview</h2>
          </div>
          <div className="profile-chip">
            <div className="avatar">GE</div>
            <div>
              <strong>Administrator</strong>
              <small>Local workspace</small>
            </div>
          </div>
        </header>

        <div className="content-body">
          <div className="welcome-row">
            <div>
              <h2>Entity Locations</h2>
              <p>Monitor and manage your geographically located entities.</p>
            </div>
            <div className="welcome-actions">
              <button
                className="refresh-button"
                onClick={() => window.location.reload()}
              >
                ↻ Refresh
              </button>

              <button
                className="primary-button"
                onClick={() => {
                  setEditingEntityId(null);
                  setForm(emptyForm);
                  setFormError("");
                  setShowCreateForm(true);
                }}
              >
                + Add Entity
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <article className="stat-card">
              <div className="stat-icon purple">⌖</div>
              <p>Total Entities</p>
              <strong>{entities.length}</strong>
              <small>Registered locations</small>
            </article>

            <article className="stat-card">
              <div className="stat-icon green">✓</div>
              <p>Active Entities</p>
              <strong>{activeCount}</strong>
              <small>Currently active</small>
            </article>

            <article className="stat-card">
              <div className="stat-icon orange">◷</div>
              <p>Other Status</p>
              <strong>{entities.length - activeCount}</strong>
              <small>Inactive or maintenance</small>
            </article>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="map-card">
            <div className="map-card-header">
              <div>
                <h3>Live Entity Map</h3>
                <p>Explore entity positions and select a marker for details.</p>
              </div>
              <span className="map-label">OPENSTREETMAP</span>
            </div>

            <div className="map-container">
              <MapContainer
                center={defaultCenter}
                zoom={6}
                scrollWheelZoom
                className="leaflet-map"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapFocus entity={selectedEntity} />

                {entities.map((entity) => (
                  <Marker
                    key={entity.id}
                    position={[entity.latitude, entity.longitude]}
                    icon={getMarkerIcon(entity.status)}
                    eventHandlers={{
                      click: () => setSelectedEntity(entity),
                    }}
                  >
                    <Popup>
                      <strong>{entity.name}</strong>
                      <br />
                      {entity.type.replace("_", " ")}
                      <br />
                      Status: {entity.status}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              <div className="map-legend">
                <span>
                  <i className="legend-dot active" /> Active
                </span>
                <span>
                  <i className="legend-dot inactive" /> Inactive
                </span>
                <span>
                  <i className="legend-dot maintenance" /> Maintenance
                </span>
              </div>
            </div>
          </div>

          <div className="bottom-grid">
            <section className="details-card">
              <div className="card-heading">
                <div>
                  <h3>Entity Details</h3>
                  <p>Information about the selected entity</p>
                </div>
                <span className="detail-symbol">⌖</span>
              </div>

              {selectedEntity ? (
                <>
                  <div className="detail-title">
                    <div className="detail-avatar">⌖</div>
                    <div>
                      <h4>{selectedEntity.name}</h4>
                      <p>Entity ID: {selectedEntity.id}</p>
                    </div>
                    <div className="detail-actions">
                      <span className={`status-pill ${selectedEntity.status}`}>
                        {selectedEntity.status}
                      </span>

                      <button
                        type="button"
                        className="edit-button"
                        onClick={() => openEditForm(selectedEntity)}
                      >
                        ✎ Edit
                      </button>

                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => void handleDeleteEntity(selectedEntity)}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>

                  <div className="detail-fields">
                    <div>
                      <span>Entity Type</span>
                      <strong>{selectedEntity.type.replace("_", " ")}</strong>
                    </div>
                    <div>
                      <span>Latitude</span>
                      <strong>{selectedEntity.latitude}</strong>
                    </div>
                    <div>
                      <span>Longitude</span>
                      <strong>{selectedEntity.longitude}</strong>
                    </div>
                    <div className="description-field">
                      <span>Description</span>
                      <strong>
                        {selectedEntity.description || "No description"}
                      </strong>
                    </div>
                  </div>
                </>
              ) : (
                <p className="muted">
                  Select an entity from the list or map to see its details.
                </p>
              )}
            </section>

            <section className="locations-card">
              <div className="card-heading">
                <div>
                  <h3>Entity Directory</h3>
                  <p>All registered entities</p>
                </div>
                <span className="count-badge">{entities.length}</span>
              </div>

              {entities.map((entity) => (
                <button
                  key={entity.id}
                  className="directory-item"
                  onClick={() => setSelectedEntity(entity)}
                >
                  <span className={`status-dot ${entity.status}`} />
                  <span>
                    <strong>{entity.name}</strong>
                    <small>
                      {entity.latitude}, {entity.longitude}
                    </small>
                  </span>
                  <span className="entity-arrow">›</span>
                </button>
              ))}
            </section>
          </div>

          {showCreateForm && (
            <div
              className="modal-backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && !saving) {
                  setShowCreateForm(false);
                  setFormError("");
                }
              }}
            >
              <section
                className="entity-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-entity-title"
              >
                <div className="modal-heading">
                  <div>
                    <h3 id="create-entity-title">
                      {editingEntityId !== null
                        ? "Edit Entity"
                        : "Add New Entity"}
                    </h3>
                    <p>
                      {editingEntityId !== null
                        ? "Update the entity information and geographic location."
                        : "Enter the entity information and geographic location."}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="close-button"
                    aria-label="Close form"
                    disabled={saving}
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormError("");
                    }}
                  >
                    ×
                  </button>
                </div>

                <form className="entity-form" onSubmit={handleCreateEntity}>
                  <label>
                    Entity Name <span>*</span>
                    <input
                      name="entityname"
                      value={form.name}
                      onChange={(event) =>
                        setForm({ ...form, name: event.target.value })
                      }
                      placeholder="e.g. Sensor Gudang B"
                      maxLength={120}
                    />
                  </label>

                  <div className="form-row">
                    <label>
                      Entity Type <span>*</span>
                      <select
                        name="entitytype"
                        value={form.type}
                        onChange={(event) =>
                          setForm({ ...form, type: event.target.value })
                        }
                      >
                        <option value="iot_device">IoT Device</option>
                        <option value="vehicle">Vehicle</option>
                        <option value="facility">Facility</option>
                      </select>
                    </label>

                    <label>
                      Status <span>*</span>
                      <select
                        name="status"
                        value={form.status}
                        onChange={(event) =>
                          setForm({ ...form, status: event.target.value })
                        }
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </label>
                  </div>

                  <div className="form-row">
                    <label>
                      Latitude <span>*</span>
                      <input
                        type="number"
                        name="latitude"
                        step="any"
                        min="-90"
                        max="90"
                        value={form.latitude}
                        onChange={(event) =>
                          setForm({ ...form, latitude: event.target.value })
                        }
                        placeholder="-6.2088"
                      />
                    </label>

                    <label>
                      Longitude <span>*</span>
                      <input
                        type="number"
                        name="longitude"
                        step="any"
                        min="-180"
                        max="180"
                        value={form.longitude}
                        onChange={(event) =>
                          setForm({ ...form, longitude: event.target.value })
                        }
                        placeholder="106.8456"
                      />
                    </label>
                  </div>

                  <label>
                    Description
                    <textarea
                      name="desc"
                      value={form.description}
                      onChange={(event) =>
                        setForm({ ...form, description: event.target.value })
                      }
                      placeholder="Describe this entity..."
                      rows={3}
                      maxLength={1000}
                    />
                  </label>

                  {formError && (
                    <div className="form-error" role="alert">
                      {formError}
                    </div>
                  )}

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      disabled={saving}
                      onClick={() => {
                        setShowCreateForm(false);
                        setFormError("");
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      name="submit"
                      className="primary-button"
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : editingEntityId !== null
                          ? "Save Changes"
                          : "Save Entity"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}

          <footer className="page-footer">
            Geo Entity Manager <span>•</span> Fauzan Rizkyana Gunawan
          </footer>
        </div>
      </section>
    </main>
  );
}

export default App;
