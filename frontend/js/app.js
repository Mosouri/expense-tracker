const API_URL = "http://localhost:5000/api/expenses";

const categories = ["Food", "Transport", "Shopping", "Bills", "Entertainment"];
const colors = {
  Food: "bg-success",
  Transport: "bg-info text-dark",
  Shopping: "bg-warning text-dark",
  Bills: "bg-danger",
  Entertainment: "bg-primary",
};

const alertBox = document.getElementById("alert-box");
const spinner = document.getElementById("spinner");
const tableBody = document.getElementById("table-body");
const filterSelect = document.getElementById("filter-category");
const addForm = document.getElementById("add-form");
const editForm = document.getElementById("edit-form");
const editModal = new bootstrap.Modal(document.getElementById("edit-modal"));

let allExpenses = [];

function showAlert(message, type = "danger") {
  alertBox.innerHTML = "";

  const div = document.createElement("div");
  div.className = "alert alert-" + type + " alert-dismissible";
  div.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.className = "btn-close";
  closeBtn.setAttribute("data-bs-dismiss", "alert");

  div.appendChild(closeBtn);
  alertBox.appendChild(div);
}

const serverOffMessage =
  "Cannot connect to the server. Please make sure it is running and try again.";

async function getExpenses() {
  spinner.classList.remove("d-none"); // اظهر السبينر
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (!response.ok) {
      showAlert(data.message);
      return;
    }

    allExpenses = data.result;
    showSummary();
    showTable();
  } catch (error) {
    showAlert(serverOffMessage);
  } finally {
    spinner.classList.add("d-none");
  }
}

function showSummary() {
  let total = 0;
  let highest = null;

  for (const expense of allExpenses) {
    total = total + expense.amount;
    if (highest === null || expense.amount > highest.amount) {
      highest = expense;
    }
  }

  document.getElementById("sum-total").textContent = total.toFixed(2);
  document.getElementById("sum-count").textContent = allExpenses.length;

  if (highest === null) {
    document.getElementById("sum-max").textContent = "-";
    document.getElementById("sum-max-title").textContent = "";
  } else {
    document.getElementById("sum-max").textContent = highest.amount.toFixed(2);
    document.getElementById("sum-max-title").textContent = highest.title;
  }
}

function showTable() {
  tableBody.innerHTML = "";

  let list = allExpenses;
  if (filterSelect.value !== "All") {
    list = allExpenses.filter(function (expense) {
      return expense.category === filterSelect.value;
    });
  }

  if (list.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.className = "text-center text-muted py-4";
    td.textContent = "No expenses to show.";
    tr.appendChild(td);
    tableBody.appendChild(tr);
    return;
  }

  for (const expense of list) {
    const tr = document.createElement("tr");

    const titleTd = document.createElement("td");
    titleTd.textContent = expense.title;

    const amountTd = document.createElement("td");
    amountTd.textContent = expense.amount.toFixed(2);

    const categoryTd = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "badge " + (colors[expense.category] || "bg-secondary");
    badge.textContent = expense.category;
    categoryTd.appendChild(badge);

    const dateTd = document.createElement("td");
    dateTd.textContent = expense.date;

    const actionsTd = document.createElement("td");
    actionsTd.className = "text-end text-nowrap";

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-sm btn-outline-primary me-1";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", function () {
      openEditModal(expense);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-sm btn-outline-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", function () {
      deleteExpense(expense.id);
    });

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(deleteBtn);

    tr.appendChild(titleTd);
    tr.appendChild(amountTd);
    tr.appendChild(categoryTd);
    tr.appendChild(dateTd);
    tr.appendChild(actionsTd);
    tableBody.appendChild(tr);
  }
}

function setError(input, message) {
  const feedback = input.nextElementSibling;
  if (message) {
    input.classList.add("is-invalid");
    feedback.textContent = message;
  } else {
    input.classList.remove("is-invalid");
    feedback.textContent = "";
  }
}

function validateForm(prefix) {
  const title = document.getElementById(prefix + "-title");
  const amount = document.getElementById(prefix + "-amount");
  const category = document.getElementById(prefix + "-category");
  const date = document.getElementById(prefix + "-date");

  let valid = true;

  if (title.value.trim() === "") {
    setError(title, "Title is required.");
    valid = false;
  } else {
    setError(title, "");
  }

  if (amount.value === "") {
    setError(amount, "Amount is required.");
    valid = false;
  } else if (Number(amount.value) <= 0) {
    setError(amount, "Amount must be greater than zero.");
    valid = false;
  } else {
    setError(amount, "");
  }

  if (category.value === "") {
    setError(category, "Please choose a category.");
    valid = false;
  } else {
    setError(category, "");
  }

  if (date.value === "") {
    setError(date, "Date is required.");
    valid = false;
  } else {
    setError(date, "");
  }

  return valid;
}

async function addExpense(event) {
  event.preventDefault();
  alertBox.innerHTML = "";

  if (!validateForm("add")) {
    return;
  }

  const newExpense = {
    title: document.getElementById("add-title").value.trim(),
    amount: Number(document.getElementById("add-amount").value),
    category: document.getElementById("add-category").value,
    date: document.getElementById("add-date").value,
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newExpense),
    });
    const data = await response.json();

    if (!response.ok) {
      showAlert(data.message);
      return;
    }

    addForm.reset();
    document.getElementById("add-date").value = todayDate();
    showAlert("Expense added successfully.", "success");
    await getExpenses();
  } catch (error) {
    showAlert(serverOffMessage);
  }
}

async function deleteExpense(id) {
  if (!confirm("Delete this expense?")) {
    return;
  }

  try {
    const response = await fetch(API_URL + "/" + id, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      showAlert(data.message);
      return;
    }

    showAlert("Expense deleted.", "success");
    await getExpenses();
  } catch (error) {
    showAlert(serverOffMessage);
  }
}

function openEditModal(expense) {
  document.getElementById("edit-id").value = expense.id;
  document.getElementById("edit-title").value = expense.title;
  document.getElementById("edit-amount").value = expense.amount;
  document.getElementById("edit-category").value = expense.category;
  document.getElementById("edit-date").value = expense.date;

  setError(document.getElementById("edit-title"), "");
  setError(document.getElementById("edit-amount"), "");
  setError(document.getElementById("edit-category"), "");
  setError(document.getElementById("edit-date"), "");

  editModal.show();
}

async function updateExpense(event) {
  event.preventDefault();

  if (!validateForm("edit")) {
    return;
  }

  const id = document.getElementById("edit-id").value;
  const updated = {
    title: document.getElementById("edit-title").value.trim(),
    amount: Number(document.getElementById("edit-amount").value),
    category: document.getElementById("edit-category").value,
    date: document.getElementById("edit-date").value,
  };

  try {
    const response = await fetch(API_URL + "/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    const data = await response.json();

    editModal.hide();

    if (!response.ok) {
      showAlert(data.message);
      return;
    }

    showAlert("Expense updated successfully.", "success");
    await getExpenses();
  } catch (error) {
    editModal.hide();
    showAlert(serverOffMessage);
  }
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function fillCategories(select) {
  for (const name of categories) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  }
}

fillCategories(document.getElementById("add-category"));
fillCategories(document.getElementById("edit-category"));
fillCategories(filterSelect);
document.getElementById("add-date").value = todayDate();

addForm.addEventListener("submit", addExpense);
editForm.addEventListener("submit", updateExpense);
filterSelect.addEventListener("change", showTable);

getExpenses();
