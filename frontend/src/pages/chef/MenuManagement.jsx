import { useEffect, useState, useRef } from "react";
import { getMenu, createDish, createDishesBulk, updateDish, deleteDish } from "../../api/menuApi";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiBookOpen, FiUpload, FiX } from "react-icons/fi";
import Modal from "../../components/Modal";

const PLACEHOLDER_IMG = "https://www.iconarchive.com/download/i136446/microsoft/fluentui-emoji-3d/Fork-And-Knife-With-Plate-3d.1024.png";

const MenuManagement = () => {
  const [dishes, setDishes] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", note: "", category: "", price: "", daily_portion: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [copyInput, setCopyInput] = useState("");
  const [copySubmitting, setCopySubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const fetchMenu = async () => {
    try {
      const { data } = await getMenu();
      setDishes(data);
    } catch (err) {
      toast.error("Failed to load menu");
    }
  };

  useEffect(() => { fetchMenu(); }, []);

  const openCreate = () => {
    setEditingDish(null);
    setForm({ name: "", description: "", note: "", category: "", price: "", daily_portion: "" });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEdit = (dish) => {
    setEditingDish(dish);
    setForm({
      name: dish.name,
      description: dish.description || "",
      note: dish.note || "",
      category: dish.category,
      price: dish.price,
      daily_portion: dish.daily_portion,
    });
    setImageFile(null);
    setImagePreview(dish.image_url || null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("note", form.note);
      fd.append("category", form.category);
      fd.append("price", form.price);
      fd.append("daily_portion", form.daily_portion);
      if (imageFile) {
        fd.append("image", imageFile);
      } else if (editingDish && imagePreview) {
        // Keep existing image
        fd.append("image_url", imagePreview);
      }

      if (editingDish) {
        await updateDish(editingDish.dishID, fd);
        toast.success("Dish updated!");
      } else {
        await createDish(fd);
        toast.success("Dish added!");
      }
      setShowModal(false);
      fetchMenu();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (dishID, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteDish(dishID);
      toast.success("Deleted");
      fetchMenu();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const handleCopySubmit = async (e) => {
    e.preventDefault();
    setCopySubmitting(true);
    try {
      const parsed = JSON.parse(copyInput);
      const items = Array.isArray(parsed) ? parsed : parsed?.items;
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("JSON must be an array or an object with an items array");
      }

      const { data } = await createDishesBulk({ items });
      const createdCount = data?.createdCount ?? 0;
      const updatedCount = data?.updatedCount ?? 0;
      const zeroedCount = data?.zeroedCount ?? 0;
      toast.success(`Imported ${createdCount} new, updated ${updatedCount}, zeroed ${zeroedCount}`);
      setShowCopyModal(false);
      setCopyInput("");
      fetchMenu();
    } catch (err) {
      toast.error("Invalid JSON");
    } finally {
      setCopySubmitting(false);
    }
  };

  const filtered = dishes.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(dishes.map((d) => d.category))];
  const groupedByCategory = filtered.reduce((acc, dish) => {
    const category = dish.category || "Uncategorized";
    if (!acc.has(category)) acc.set(category, []);
    acc.get(category).push(dish);
    return acc;
  }, new Map());
  const groupedCategories = Array.from(groupedByCategory.keys());

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const getDishImage = (dish) => {
    if (!dish.image_url) return PLACEHOLDER_IMG;
    // If it starts with /uploads, it's a local file
    if (dish.image_url.startsWith("/uploads")) return dish.image_url;
    return dish.image_url;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Menu Management</h1>
        <p>Add, edit, and manage dishes and daily portion</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon amber"><FiBookOpen /></div>
          <div className="stat-info"><h3>{dishes.length}</h3><p>Total Dishes</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiBookOpen /></div>
          <div className="stat-info"><h3>{dishes.filter((d) => d.is_available).length}</h3><p>Available</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><FiBookOpen /></div>
          <div className="stat-info"><h3>{dishes.filter((d) => !d.is_available).length}</h3><p>Sold Out</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><FiBookOpen /></div>
          <div className="stat-info"><h3>{categories.length}</h3><p>Categories</p></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, position: "relative", minWidth: 200 }}>
            <FiSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: 10, border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none", fontFamily: "inherit" }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowCopyModal(true)}>Copy Menu</button>
          <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Add Dish</button>
        </div>
      </div>

      {filtered.length > 0 ? (
        groupedCategories.map((category) => (
          <div key={category} className="category-section">
            <div className="category-title">
              <span>{category}</span>
            </div>
            <div className="dish-grid">
              {groupedByCategory.get(category).map((d) => (
                <div key={d.dishID} className={`dish-card ${!d.is_available ? "sold-out" : ""}`}>
                  <div className="dish-card-img">
                    <img src={getDishImage(d)} alt={d.name} onError={(e) => { e.target.src = PLACEHOLDER_IMG; }} />
                    {!d.is_available && <div className="dish-sold-overlay">Sold Out</div>}
                  </div>
                  <div className="dish-card-body">
                    <div className="dish-card-header">
                      <h3>{d.name}</h3>
                      <span className="badge badge-info">{d.category}</span>
                    </div>
                    {d.description && <p className="dish-desc">{d.description}</p>}
                    {d.note && <p className="dish-desc">Note: {d.note}</p>}
                    <div className="dish-card-footer">
                      <div>
                        <span className="dish-price">{formatPrice(d.price)}</span>
                        <span className="dish-portion">{d.current_portion} left</span>
                      </div>
                      <div className="dish-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(d)}><FiEdit2 /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.dishID, d.name)}><FiTrash2 /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <p>No dishes in the menu yet</p>
          </div>
        </div>
      )}

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h2>{editingDish ? "Edit Dish" : "Add New Dish"}</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="input-group">
              <label>Dish Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Note</label>
              <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>

            {/* Image Upload */}
            <div className="input-group">
              <label><FiUpload style={{ marginRight: 4 }} /> Dish Photo</label>
              {imagePreview ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border-color)" }}
                    onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    style={{
                      position: "absolute", top: 6, right: 6, width: 28, height: 28,
                      borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.7)",
                      color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    height: 120, borderRadius: 8, border: "2px dashed var(--border-color)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "var(--text-muted)", transition: "border-color 0.2s",
                    background: "var(--bg-input)",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
                >
                  <FiUpload style={{ fontSize: "1.5rem", marginBottom: 8 }} />
                  <span style={{ fontSize: "0.8rem" }}>Click to upload image</span>
                  <span style={{ fontSize: "0.7rem", marginTop: 4 }}>JPG, PNG, WebP (max 5MB)</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label>Category *</label>
                <input required placeholder="Appetizer, Main..." value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Price (VND) *</label>
                <input type="number" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
            </div>
            <div className="input-group">
              <label>Daily Portion *</label>
              <input type="number" min="0" required value={form.daily_portion} onChange={(e) => setForm({ ...form, daily_portion: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editingDish ? "Update" : "Add Dish"}</button>
            </div>
          </form>
        </Modal>
      )}

      {showCopyModal && (
        <Modal onClose={() => setShowCopyModal(false)}>
          <h2>Copy Menu</h2>
          <form onSubmit={handleCopySubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="input-group">
              <label>Paste JSON here *</label>
              <textarea
                required
                rows={10}
                value={copyInput}
                onChange={(e) => setCopyInput(e.target.value)}
                placeholder={`e.g.,
[
  {
    "name": "Pho",
    "description": "Traditional beef noodle soup",
    "note": "Serve hot",
    "category": "Main Course",
    "price": 45000,
    "daily_portion": 20
  },
  {
    "name": "Spring Rolls",
    "description": "Crispy rolls with pork",
    "note": "Best with sweet chili sauce",
    "category": "Appetizer",
    "price": 25000,
    "daily_portion": 30
  }
]`}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCopyModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={copySubmitting || !copyInput.trim()}>
                {copySubmitting ? "Importing..." : "Import Menu"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MenuManagement;
