const STORAGE_KEYS = {
  menu: "sibs_menu",
  cart: "sibs_cart",
  bills: "sibs_bills",
  billCounter: "sibs_bill_counter",
};

const defaultMenu = [
  {
    id: "idly",
    name: "Idly",
    price: 40,
    category: "veg",
    image:
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "puttu",
    name: "Puttu",
    price: 55,
    category: "veg",
    image:
      "https://images.unsplash.com/photo-1626132647523-66f6fdd4f8cf?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "poori",
    name: "Poori",
    price: 60,
    category: "veg",
    image:
      "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "dosai",
    name: "Dosai",
    price: 70,
    category: "veg",
    image:
      "https://images.unsplash.com/photo-1666190092159-3171cf0fbb12?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "coffee",
    name: "Coffee",
    price: 25,
    category: "beverage",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "tea",
    name: "Tea",
    price: 20,
    category: "beverage",
    image:
      "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=600&q=80",
  },
];

const state = {
  menu: load(STORAGE_KEYS.menu, defaultMenu),
  cart: load(STORAGE_KEYS.cart, {}),
  bills: load(STORAGE_KEYS.bills, []),
  billCounter: load(STORAGE_KEYS.billCounter, 1),
  selectedMonth: "",
  editingId: null,
  generatedBill: null,
};

const menuGrid = document.getElementById("menuGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const cartBody = document.getElementById("cartBody");
const grandTotalEl = document.getElementById("grandTotal");
const clearCartBtn = document.getElementById("clearCartBtn");
const generateBillBtn = document.getElementById("generateBillBtn");
const billContent = document.getElementById("billContent");
const payNowBtn = document.getElementById("payNowBtn");
const printBillBtn = document.getElementById("printBillBtn");
const paymentArea = document.getElementById("paymentArea");
const qrcodeEl = document.getElementById("qrcode");
const monthFilter = document.getElementById("monthFilter");
const salesBody = document.getElementById("salesBody");
const summaryBills = document.getElementById("summaryBills");
const summarySales = document.getElementById("summarySales");
const summaryAvg = document.getElementById("summaryAvg");
const itemForm = document.getElementById("itemForm");
const itemIdInput = document.getElementById("itemId");
const itemNameInput = document.getElementById("itemName");
const itemPriceInput = document.getElementById("itemPrice");
const itemCategoryInput = document.getElementById("itemCategory");
const itemImageInput = document.getElementById("itemImage");
const formTitle = document.getElementById("formTitle");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const adminItemsBody = document.getElementById("adminItemsBody");
const totalItems = document.getElementById("totalItems");
const resetSalesBtn = document.getElementById("resetSalesBtn");
const toast = document.getElementById("toast");

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(amount) {
  return Number(amount).toFixed(2);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1600);
}

function persistMenu() {
  save(STORAGE_KEYS.menu, state.menu);
}

function persistCart() {
  save(STORAGE_KEYS.cart, state.cart);
}

function persistBills() {
  save(STORAGE_KEYS.bills, state.bills);
}

function persistCounter() {
  save(STORAGE_KEYS.billCounter, state.billCounter);
}

function renderMenu() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const filtered = state.menu.filter((item) => {
    const matchText = item.name.toLowerCase().includes(query) || item.id.toLowerCase().includes(query);
    const matchCategory = category === "all" || item.category === category;
    return matchText && matchCategory;
  });

  if (filtered.length === 0) {
    menuGrid.innerHTML = `<p>No items found.</p>`;
    return;
  }

  menuGrid.innerHTML = filtered
    .map(
      (item) => `
        <article class="menu-card">
          <img src="${item.image}" alt="${item.name}" />
          <div class="menu-content">
            <div class="menu-meta">
              <h3>${item.name}</h3>
              <span class="pill ${item.category}">${item.category}</span>
            </div>
            <p>₹${money(item.price)}</p>
            <button class="btn btn-primary add-cart-btn" data-id="${item.id}">Add to Cart</button>
          </div>
        </article>
      `
    )
    .join("");

  document.querySelectorAll(".add-cart-btn").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.dataset.id));
  });
}

function addToCart(id) {
  if (!state.menu.some((m) => m.id === id)) return;
  state.cart[id] = (state.cart[id] || 0) + 1;
  persistCart();
  renderCart();
  showToast("Item added to cart");
}

function clearCart() {
  state.cart = {};
  persistCart();
  state.generatedBill = null;
  paymentArea.classList.add("hidden");
  qrcodeEl.innerHTML = "";
  renderCart();
  renderBill();
}

function cartRows() {
  return Object.entries(state.cart)
    .map(([id, qty]) => {
      const item = state.menu.find((m) => m.id === id);
      if (!item) return null;
      const total = item.price * qty;
      return { id, name: item.name, price: item.price, qty, total };
    })
    .filter(Boolean);
}

function renderCart() {
  const rows = cartRows();
  if (rows.length === 0) {
    cartBody.innerHTML = `<tr><td colspan="4">Cart is empty.</td></tr>`;
    grandTotalEl.textContent = "0.00";
    return;
  }

  let grandTotal = 0;
  cartBody.innerHTML = rows
    .map((row) => {
      grandTotal += row.total;
      return `
        <tr>
          <td>${row.name}</td>
          <td>${row.qty}</td>
          <td>₹${money(row.price)}</td>
          <td>₹${money(row.total)}</td>
        </tr>
      `;
    })
    .join("");
  grandTotalEl.textContent = money(grandTotal);
}

function formatDateTime(iso) {
  const dt = new Date(iso);
  return dt.toLocaleString();
}

function renderBill() {
  if (!state.generatedBill) {
    billContent.innerHTML = `<h3>Generated Bill</h3><p>Generate a bill to view details.</p>`;
    return;
  }

  const bill = state.generatedBill;
  billContent.innerHTML = `
    <h3>Generated Bill</h3>
    <p><strong>Bill Number:</strong> ${bill.billNo}</p>
    <p><strong>Date & Time:</strong> ${formatDateTime(bill.createdAt)}</p>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${bill.items
          .map(
            (it) => `
          <tr>
            <td>${it.name}</td>
            <td>${it.qty}</td>
            <td>₹${money(it.price)}</td>
            <td>₹${money(it.total)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
    <h3>Total Amount: ₹${money(bill.totalAmount)}</h3>
  `;
}

function generateBill() {
  const items = cartRows();
  if (!items.length) {
    showToast("Cart is empty");
    return;
  }

  const totalAmount = items.reduce((sum, it) => sum + it.total, 0);
  const newBill = {
    billNo: state.billCounter,
    createdAt: new Date().toISOString(),
    items,
    totalAmount,
  };

  state.generatedBill = newBill;
  state.bills.push(newBill);
  state.billCounter += 1;
  state.cart = {};
  persistBills();
  persistCounter();
  persistCart();
  paymentArea.classList.add("hidden");
  qrcodeEl.innerHTML = "";
  renderCart();
  renderBill();
  renderReport();
  showToast("Bill generated");
}

function handlePayment() {
  if (!state.generatedBill) {
    showToast("Generate bill first");
    return;
  }
  paymentArea.classList.remove("hidden");
  qrcodeEl.innerHTML = "";

  const payload = `SOUTH_INDIAN_RESTAURANT|BILL:${state.generatedBill.billNo}|AMOUNT:${money(
    state.generatedBill.totalAmount
  )}|TIME:${state.generatedBill.createdAt}`;

  // QRCode class is provided by qrcodejs library loaded in HTML.
  new QRCode(qrcodeEl, {
    text: payload,
    width: 160,
    height: 160,
  });

  showToast("QR code ready");
}

function printBill() {
  if (!state.generatedBill) {
    showToast("No bill to print");
    return;
  }
  window.print();
}

function currentMonthValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function renderReport() {
  const targetMonth = state.selectedMonth || currentMonthValue();
  monthFilter.value = targetMonth;
  const monthlyBills = state.bills.filter((bill) => bill.createdAt.startsWith(targetMonth));

  const dayMap = {};
  monthlyBills.forEach((bill) => {
    const day = bill.createdAt.slice(0, 10);
    if (!dayMap[day]) dayMap[day] = { bills: 0, sales: 0 };
    dayMap[day].bills += 1;
    dayMap[day].sales += bill.totalAmount;
  });

  const days = Object.keys(dayMap).sort();
  if (!days.length) {
    salesBody.innerHTML = `<tr><td colspan="3">No sales data for selected month.</td></tr>`;
  } else {
    salesBody.innerHTML = days
      .map(
        (day) => `
        <tr>
          <td>${day}</td>
          <td>${dayMap[day].bills}</td>
          <td>₹${money(dayMap[day].sales)}</td>
        </tr>
      `
      )
      .join("");
  }

  const totalBills = monthlyBills.length;
  const totalSales = monthlyBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const avg = totalBills ? totalSales / totalBills : 0;
  summaryBills.textContent = totalBills;
  summarySales.textContent = money(totalSales);
  summaryAvg.textContent = money(avg);
}

function resetAdminForm() {
  itemForm.reset();
  state.editingId = null;
  itemIdInput.disabled = false;
  formTitle.textContent = "Add Menu Item";
  cancelEditBtn.classList.add("hidden");
}

function renderAdminItems() {
  totalItems.textContent = state.menu.length;
  adminItemsBody.innerHTML = state.menu
    .map(
      (item) => `
      <tr>
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>₹${money(item.price)}</td>
        <td>${item.category}</td>
        <td>
          <button class="btn edit-btn" data-id="${item.id}">Edit</button>
          <button class="btn btn-danger delete-btn" data-id="${item.id}">Delete</button>
        </td>
      </tr>
    `
    )
    .join("");

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => startEdit(btn.dataset.id));
  });
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteItem(btn.dataset.id));
  });
}

function startEdit(id) {
  const item = state.menu.find((m) => m.id === id);
  if (!item) return;
  state.editingId = id;
  formTitle.textContent = "Edit Menu Item";
  itemIdInput.value = item.id;
  itemIdInput.disabled = true;
  itemNameInput.value = item.name;
  itemPriceInput.value = item.price;
  itemCategoryInput.value = item.category;
  itemImageInput.value = item.image;
  cancelEditBtn.classList.remove("hidden");
}

function deleteItem(id) {
  state.menu = state.menu.filter((m) => m.id !== id);
  delete state.cart[id];
  persistMenu();
  persistCart();
  renderAll();
  showToast("Menu item deleted");
}

function upsertItem(event) {
  event.preventDefault();
  const payload = {
    id: itemIdInput.value.trim().toLowerCase(),
    name: itemNameInput.value.trim(),
    price: Number(itemPriceInput.value),
    category: itemCategoryInput.value,
    image: itemImageInput.value.trim(),
  };

  if (!payload.id || !payload.name || !payload.price || !payload.image) return;

  if (state.editingId) {
    state.menu = state.menu.map((m) => (m.id === state.editingId ? payload : m));
    showToast("Menu item updated");
  } else {
    const exists = state.menu.some((m) => m.id === payload.id);
    if (exists) {
      showToast("ID already exists");
      return;
    }
    state.menu.push(payload);
    showToast("Menu item added");
  }

  persistMenu();
  resetAdminForm();
  renderAll();
}

function resetSalesData() {
  state.bills = [];
  state.billCounter = 1;
  state.generatedBill = null;
  persistBills();
  persistCounter();
  renderBill();
  renderReport();
  showToast("Sales data reset");
}

function renderAll() {
  renderMenu();
  renderCart();
  renderAdminItems();
  renderReport();
}

searchInput.addEventListener("input", renderMenu);
categoryFilter.addEventListener("change", renderMenu);
clearCartBtn.addEventListener("click", clearCart);
generateBillBtn.addEventListener("click", generateBill);
payNowBtn.addEventListener("click", handlePayment);
printBillBtn.addEventListener("click", printBill);
monthFilter.addEventListener("change", () => {
  state.selectedMonth = monthFilter.value;
  renderReport();
});
itemForm.addEventListener("submit", upsertItem);
cancelEditBtn.addEventListener("click", resetAdminForm);
resetSalesBtn.addEventListener("click", resetSalesData);

state.selectedMonth = currentMonthValue();
renderAll();
renderBill();
