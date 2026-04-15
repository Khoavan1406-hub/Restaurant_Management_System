import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { getMenu } from "../../api/menuApi";
import { createOrder, getOrdersBySession, closeSession } from "../../api/orderApi";
import useSocket from "../../hooks/useSocket";
import toast from "react-hot-toast";
import { FiPlus, FiMinus, FiShoppingCart, FiArrowLeft, FiCreditCard, FiCheckCircle } from "react-icons/fi";
import "./OrderPage.css";

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop";

const OrderPage = () => {
  const { tableNumber } = useParams();
  const [searchParams] = useSearchParams();
  const sessionID = searchParams.get("sessionID");
  const navigate = useNavigate();

  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [existingOrders, setExistingOrders] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
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

  const categories = ["All", ...new Set(menu.map((d) => d.category))];
  const filtered = activeCategory === "All" ? menu : menu.filter((d) => d.category === activeCategory);

  const addToCart = (dish) => {
    const existing = cart.find((c) => c.dishID === dish.dishID);
    if (existing) {
      if (existing.quantity >= dish.current_portion) {
        toast.error(`Only ${dish.current_portion} portions left`);
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
  const totalBill = existingOrders.reduce((sum, o) => sum + o.dish_price * o.quantity, 0) + totalCartPrice;

  const formatPrice = (price) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

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

  const handleClose = async () => {
    if (!window.confirm("Confirm checkout and close this table?")) return;
    try {
      const { data } = await closeSession(parseInt(sessionID));
      toast.success(`Checkout complete! Total: ${formatPrice(data.totalBill)}`);
      navigate("/waiter");
    } catch (err) {
      toast.error(err.response?.data?.message || "Checkout failed");
    }
  };

  const statusLabel = {
    "Not Started": { text: "Pending", class: "badge-danger" },
    "Cooking": { text: "Cooking", class: "badge-warning" },
    "Ready": { text: "Ready", class: "badge-success" },
    "Completed": { text: "Done", class: "badge-info" },
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

        <div className="menu-grid">
          {filtered.map((dish) => {
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
          })}
        </div>
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

        {existingOrders.length > 0 && (
          <div className="existing-orders">
            <h3>📋 Previous Orders</h3>
            {existingOrders.map((o, i) => (
              <div key={i} className="existing-order-item">
                <div>
                  <span style={{ fontWeight: 500 }}>{o.quantity}x {o.dish_name}</span>
                  <span className={`badge ${statusLabel[o.status]?.class || "badge-info"}`} style={{ marginLeft: 8 }}>
                    {statusLabel[o.status]?.text || o.status}
                  </span>
                </div>
                <span style={{ color: "var(--accent)", fontWeight: 600 }}>{formatPrice(o.dish_price * o.quantity)}</span>
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
            <FiCreditCard /> Checkout & Close Table
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
