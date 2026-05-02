import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { getMenu } from "../../api/menuApi";
import { createOrder, getOrdersBySession, closeSession, updateOrderItems } from "../../api/orderApi";
import useSocket from "../../hooks/useSocket";
import toast from "react-hot-toast";
import { FiPlus, FiMinus, FiShoppingCart, FiArrowLeft, FiCreditCard, FiCheckCircle } from "react-icons/fi";
import Modal from "../../components/Modal";
import "./OrderPage.css";

const PLACEHOLDER_IMG = "https://www.iconarchive.com/download/i136446/microsoft/fluentui-emoji-3d/Fork-And-Knife-With-Plate-3d.1024.png";

const OrderPage = () => {
  const { tableNumber } = useParams();
  const [searchParams] = useSearchParams();
  const sessionID = searchParams.get("sessionID");
  const navigate = useNavigate();

  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [existingOrders, setExistingOrders] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showBillModal, setShowBillModal] = useState(false);
  const [closing, setClosing] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const socketRef = useSocket();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: menuData } = await getMenu();
        setMenu(menuData);
        if (sessionID) {
          const { data: ordersData } = await getOrdersBySession(sessionID);
          setExistingOrders(ordersData);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [sessionID]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on("order-status-update", ({ orderID, status }) => {
      if (status === "Ready") {
        toast.success(`🍽️ Order #${orderID} is ready to serve!`);
      }
      if (sessionID) {
        getOrdersBySession(sessionID).then(({ data }) => setExistingOrders(data));
      }
    });
    return () => socket.off("order-status-update");
  }, [socketRef, sessionID]);

  const categoryList = [...new Set(menu.map((d) => d.category))];
  const categories = ["All", ...categoryList];
  const filtered = activeCategory === "All" ? menu : menu.filter((d) => d.category === activeCategory);
  const groupedMenu = categoryList.map((category) => ({
    category,
    items: menu.filter((d) => d.category === category),
  }));

  const addToCart = (dish) => {
    const existing = cart.find((c) => c.dishID === dish.dishID);
    if (existing) {
      if (existing.quantity >= dish.current_portion) {
        toast.error(`Only ${dish.current_portion} portion left`);
        return;
      }
      setCart(cart.map((c) => c.dishID === dish.dishID ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { dishID: dish.dishID, name: dish.name, price: dish.price, image_url: dish.image_url, quantity: 1, special_note: "" }]);
    }
  };

  const removeFromCart = (dishID) => {
    setCart(cart.map((c) => c.dishID === dishID ? { ...c, quantity: c.quantity - 1 } : c).filter((c) => c.quantity > 0));
  };

  const updateNote = (dishID, note) => {
    setCart(cart.map((c) => c.dishID === dishID ? { ...c, special_note: note } : c));
  };

  const totalCartPrice = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const totalBill = existingOrders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.dish_price * o.quantity, 0);
  const billItems = Array.from(
    existingOrders
      .filter((o) => o.status !== "Cancelled")
      .reduce((acc, o) => {
        const key = `${o.dish_name}::${o.dish_price}`;
        if (!acc.has(key)) {
          acc.set(key, {
            name: o.dish_name,
            price: o.dish_price,
            quantity: 0,
            total: 0,
          });
        }
        const entry = acc.get(key);
        entry.quantity += o.quantity;
        entry.total += o.dish_price * o.quantity;
        return acc;
      }, new Map())
      .values()
  );
  const groupedOrders = Array.from(
    existingOrders.reduce((acc, o) => {
      if (!acc.has(o.orderID)) {
        acc.set(o.orderID, {
          orderID: o.orderID,
          status: o.status,
          items: [],
        });
      }
      acc.get(o.orderID).items.push({
        itemID: o.itemID,
        dishID: o.dishID,
        dish_name: o.dish_name,
        quantity: o.quantity,
        special_note: o.special_note || "",
        dish_price: o.dish_price,
      });
      return acc;
    }, new Map()).values()
  );

  const formatPrice = (price) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const renderDishCard = (dish) => {
    const inCart = cart.find((c) => c.dishID === dish.dishID);
    return (
      <div key={dish.dishID} className={`menu-item-card ${!dish.is_available ? "unavailable" : ""}`}>
        <img
          className="menu-item-img"
          src={dish.image_url || PLACEHOLDER_IMG}
          alt={dish.name}
          onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
        />
        <div className="menu-item-info">
          <div className="menu-item-name">{dish.name}</div>
          <div className="menu-item-price">{formatPrice(dish.price)}</div>
          <div className="menu-item-portion">{dish.current_portion} left</div>
        </div>
        {dish.is_available ? (
          <div className="menu-item-actions">
            {inCart ? (
              <div className="qty-control">
                <button onClick={() => removeFromCart(dish.dishID)}><FiMinus /></button>
                <span>{inCart.quantity}</span>
                <button onClick={() => addToCart(dish)}><FiPlus /></button>
              </div>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => addToCart(dish)}><FiPlus /> Add</button>
            )}
          </div>
        ) : (
          <span className="badge badge-danger" style={{ marginTop: 8 }}>Sold Out</span>
        )}
      </div>
    );
  };

  const handleOrder = async () => {
    if (cart.length === 0) return toast.error("No items selected");
    try {
      const items = cart.map(({ dishID, quantity, special_note }) => ({ dishID, quantity, special_note }));
      await createOrder(parseInt(sessionID), items);
      toast.success("Order placed successfully!");
      setCart([]);
      const { data } = await getOrdersBySession(sessionID);
      setExistingOrders(data);
      const { data: menuData } = await getMenu();
      setMenu(menuData);
    } catch (err) {
      toast.error(err.response?.data?.message || "Order failed");
    }
  };

  const handleClose = () => {
    setShowBillModal(true);
  };

  const confirmClose = async () => {
    setClosing(true);
    try {
      const { data } = await closeSession(parseInt(sessionID));
      toast.success(`Checkout complete!`);
      setShowBillModal(false);
      navigate("/waiter");
    } catch (err) {
      toast.error(err.response?.data?.message || "Checkout failed");
    } finally {
      setClosing(false);
    }
  };

  const openEdit = (order) => {
    setEditOrder(order);
    setEditItems(order.items.map((item) => ({
      itemID: item.itemID,
      dishID: item.dishID,
      dish_name: item.dish_name,
      quantity: item.quantity,
      original_quantity: item.quantity,
      special_note: item.special_note || "",
    })));
  };

  const closeEdit = () => {
    if (savingEdit) return;
    setEditOrder(null);
    setEditItems([]);
  };

  const updateEditItem = (itemID, updates) => {
    setEditItems((prev) =>
      prev.map((item) => {
        if (item.itemID !== itemID) return item;
        const next = { ...item, ...updates };

        if ("quantity" in updates) {
          const desiredQty = updates.quantity;
          const dish = menu.find((d) => d.dishID === item.dishID);

          if (!dish) {
            toast.error("Dish not found in menu.");
            return item;
          }

          const maxQty = dish.current_portion + item.original_quantity;
          if (desiredQty > maxQty) {
            toast.error(`Only ${maxQty} portions left`, { id: `edit-qty-${itemID}` });
            next.quantity = maxQty;
          } else if (desiredQty < 0) {
            next.quantity = 0;
          } else {
            next.quantity = desiredQty;
          }
        }

        return next;
      })
    );
  };

  const saveEdit = async () => {
    if (!editOrder) return;
    setSavingEdit(true);
    try {
      const missingDish = editItems.find((item) => !menu.find((d) => d.dishID === item.dishID));
      if (missingDish) {
        toast.error("Dish not found in menu.");
        return;
      }

      const payload = editItems.map((item) => ({
        itemID: item.itemID,
        quantity: Number(item.quantity),
        special_note: item.special_note,
      }));
      await updateOrderItems(editOrder.orderID, payload);
      toast.success(`Order #${editOrder.orderID} updated`);
      setEditOrder(null);
      setEditItems([]);
      const { data } = await getOrdersBySession(sessionID);
      setExistingOrders(data);
      const { data: menuData } = await getMenu();
      setMenu(menuData);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update order");
    } finally {
      setSavingEdit(false);
    }
  };

  const statusLabel = {
    "Not Started": { text: "Pending", class: "badge-pending" },
    "Cooking": { text: "Cooking", class: "badge-warning" },
    "Ready": { text: "Ready", class: "badge-info" },
    "Completed": { text: "Done", class: "badge-success" },
    "Cancelled": { text: "Cancelled", class: "badge-danger" },
  };

  return (
    <div className="order-page">
      <div className="order-left">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate("/waiter")}><FiArrowLeft /></button>
          <div>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 700 }}>Table {tableNumber}</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Session #{sessionID}</p>
          </div>
        </div>

        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-tab ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {activeCategory === "All" ? (
          <div className="menu-category-list">
            {groupedMenu.map(({ category, items }) => (
              <div key={category} className="category-section">
                <div className="category-title">
                  <span>{category}</span>
                </div>
                <div className="menu-grid">
                  {items.map(renderDishCard)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="menu-grid">
            {filtered.map(renderDishCard)}
          </div>
        )}
      </div>

      <div className="order-right">
        <div className="cart-section">
          <h3><FiShoppingCart /> Current Order ({cart.length})</h3>
          {cart.length > 0 ? (
            <>
              {cart.map((item) => (
                <div key={item.dishID} className="cart-item">
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-price">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                  <div className="cart-item-controls">
                    <div className="qty-control small">
                      <button onClick={() => removeFromCart(item.dishID)}><FiMinus /></button>
                      <span>{item.quantity}</span>
                      <button onClick={() => addToCart({ ...item, current_portion: 999 })}><FiPlus /></button>
                    </div>
                    <input
                      className="cart-note"
                      placeholder="Note..."
                      value={item.special_note}
                      onChange={(e) => updateNote(item.dishID, e.target.value)}
                    />
                  </div>
                </div>
              ))}
              <div className="cart-total">
                <span>Subtotal:</span>
                <span>{formatPrice(totalCartPrice)}</span>
              </div>
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleOrder}>
                <FiCheckCircle /> Place Order ({cart.length} items)
              </button>
            </>
          ) : (
            <div className="empty-state" style={{ padding: 20 }}>
              <p>No items selected</p>
            </div>
          )}
        </div>

        {groupedOrders.length > 0 && (
          <div className="existing-orders">
            <h3>📋 Previous Orders</h3>
            {groupedOrders.map((order) => (
              <div key={order.orderID} className="existing-order-group">
                <div className="existing-order-header">
                  <div className="existing-order-title">
                    <span style={{ fontWeight: 600 }}>Order #{order.orderID}</span>
                    <span className={`badge ${statusLabel[order.status]?.class || "badge-info"}`}>
                      {statusLabel[order.status]?.text || order.status}
                    </span>
                  </div>
                  {order.status === "Not Started" && (
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(order)}>
                      Edit
                    </button>
                  )}
                </div>
                {order.items.map((item) => (
                  <div key={item.itemID} className="existing-order-item">
                    <div>
                      <span style={{ fontWeight: 500 }}>{item.quantity}x {item.dish_name}</span>
                      {item.special_note && (
                        <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>({item.special_note})</span>
                      )}
                    </div>
                    <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                      {formatPrice(item.dish_price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="bill-summary">
          <div className="bill-total">
            <span>Total Bill:</span>
            <span className="bill-amount">{formatPrice(totalBill)}</span>
          </div>
          <button className="btn btn-success" style={{ width: "100%" }} onClick={handleClose}>
            <FiCreditCard /> Checkout & Close Session
          </button>
        </div>
      </div>

      {showBillModal && (
        <Modal onClose={() => !closing && setShowBillModal(false)} className="modal-wide">
          <div className="bill-modal-header">
            <h2>Final Bill</h2>
            <p>Table {tableNumber} | Session #{sessionID}</p>
          </div>

          <div className="bill-modal-table">
            {billItems.length === 0 ? (
              <div className="empty-state" style={{ padding: 16 }}>
                <p>No order items for this session.</p>
              </div>
            ) : (
              <table className="data-table bill-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((item) => (
                    <tr key={`${item.name}-${item.price}`}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatPrice(item.price)}</td>
                      <td>{formatPrice(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bill-total-row">
                    <td colSpan={3}>Total Bill</td>
                    <td colSpan={1}>{formatPrice(totalBill)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          <div className="modal-actions">
            <button className="btn btn-danger" onClick={() => setShowBillModal(false)} disabled={closing}>
              Cancel
            </button>
            <button className="btn btn-success" onClick={confirmClose} disabled={closing}>
              <FiCreditCard /> Confirm Checkout
            </button>
          </div>
        </Modal>
      )}

      {editOrder && (
        <Modal onClose={closeEdit} className="modal-wide">
          <div className="edit-modal-header">
            <h2>Edit Order #{editOrder.orderID}</h2>
          </div>

          <div className="edit-items-table">
            {editItems.length === 0 ? (
              <div className="empty-state" style={{ padding: 16 }}>
                <p>No items to edit for this order.</p>
              </div>
            ) : (
              <table className="data-table edit-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {editItems.map((item) => (
                    <tr key={item.itemID}>
                      <td className="edit-item-name">{item.dish_name}</td>
                      <td>
                        <input
                          className="edit-qty-input"
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => updateEditItem(item.itemID, { quantity: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="edit-note-input"
                          type="text"
                          placeholder="Add note"
                          value={item.special_note}
                          onChange={(e) => updateEditItem(item.itemID, { special_note: e.target.value })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={closeEdit} disabled={savingEdit}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={saveEdit} disabled={savingEdit}>
              Save Changes
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OrderPage;
