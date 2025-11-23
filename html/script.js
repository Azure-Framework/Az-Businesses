const root = document.getElementById('biz-root');
const closeBtn = document.getElementById('bizCloseBtn');

const tabs = document.querySelectorAll('.biz-tab');
const panelShop = document.getElementById('panel-shop');
const panelInv = document.getElementById('panel-inventory');
const panelEmp = document.getElementById('panel-employees');
const panelInfo = document.getElementById('panel-info');

const itemsEl = document.getElementById('bizItems');
const modeBadge = document.getElementById('bizModeBadge');
const employeeListEl = document.getElementById('bizEmployeeList');
const infoBlock = document.getElementById('bizInfoBlock');
const forSaleBlock = document.getElementById('bizForSaleBlock');
const forSaleText = document.getElementById('bizForSaleText');
const buyLocationBtn = document.getElementById('bizBuyLocationBtn');
const forSaleTitle = document.querySelector('#bizForSaleBlock h4');

const selectedItemTitle = document.querySelector('#bizSelectedItem .biz-selected-title');
const selectedItemDesc = document.querySelector('#bizSelectedItem .biz-selected-desc');
const selectedItemPrice = document.querySelector('#bizSelectedItem .biz-selected-price');
const buyItemBtn = document.getElementById('bizBuyItemBtn');

const ownerControls = document.getElementById('bizOwnerControls');
const withdrawAmountInput = document.getElementById('bizWithdrawAmount');
const withdrawBtn = document.getElementById('bizWithdrawBtn');

// NEW: deposit DOM
const depositAmountInput = document.getElementById('bizDepositAmount');
const depositBtn = document.getElementById('bizDepositBtn');

// Inventory controls (Stock)
const inventoryListEl = document.getElementById('bizInventoryList');
const inventoryControls = document.getElementById('bizInventoryControls');
const newItemLabelInput = document.getElementById('bizNewItemLabel');
const newItemIdInput = document.getElementById('bizNewItemId');
const newItemPriceInput = document.getElementById('bizNewItemPrice');
const addItemBtn = document.getElementById('bizAddItemBtn');

// Employee controls (Hire)
const employeeControlsEl = document.getElementById('bizEmployeeControls');
const newEmpServerIdInput = document.getElementById('bizNewEmployeeServerId');
const newEmpRoleSelect = document.getElementById('bizNewEmployeeRole');
const addEmployeeBtn = document.getElementById('bizAddEmployeeBtn');

// Promote / marketing
const adMessageInput = document.getElementById('bizAdMessage');
const adBtn = document.getElementById('bizAdBtn');
const adFeeText = document.getElementById('bizAdFeeText');

// Edit business info
const editNameInput = document.getElementById('bizEditName');
const editTypeInput = document.getElementById('bizEditType');
const editStatusSelect = document.getElementById('bizEditStatus');
const saveInfoBtn = document.getElementById('bizSaveInfoBtn');

// Toast for global ads
const adToast = document.getElementById('biz-ad-toast');
const adLine1 = document.getElementById('bizAdLine1');
const adLine2 = document.getElementById('bizAdLine2');
const adLine3 = document.getElementById('bizAdLine3');
let adToastTimeout = null;

let currentPayload = null;
let currentSelectedItem = null;

function getResourceName() {
  return (window.GetParentResourceName && GetParentResourceName()) || 'Az-Businesses';
}

function showRoot() {
  root.classList.remove('hidden');
}

function hideRoot() {
  root.classList.add('hidden');
}

function setActiveTab(tabName) {
  tabs.forEach(t => {
    const name = t.dataset.tab;
    t.classList.toggle('active', name === tabName);
  });

  panelShop.classList.toggle('hidden', tabName !== 'shop');
  panelInv.classList.toggle('hidden', tabName !== 'inventory');
  panelEmp.classList.toggle('hidden', tabName !== 'employees');
  panelInfo.classList.toggle('hidden', tabName !== 'info');
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    setActiveTab(tab.dataset.tab);
  });
});

function formatMoney(value) {
  if (typeof value !== 'number') value = Number(value) || 0;
  return '$' + value.toLocaleString();
}

function clearSelectedItem() {
  currentSelectedItem = null;
  selectedItemTitle.textContent = 'Select an item';
  selectedItemDesc.textContent = '';
  selectedItemPrice.textContent = '';
  buyItemBtn.disabled = true;
}

function renderItems(biz) {
  itemsEl.innerHTML = '';
  clearSelectedItem();

  const inv = Array.isArray(biz.inventory) ? biz.inventory : [];
  if (!inv.length) {
    const empty = document.createElement('div');
    empty.style.padding = '10px 4px';
    empty.style.fontSize = '12px';
    empty.style.color = 'rgba(255,255,255,0.75)';
    empty.textContent = 'No items configured yet.';
    itemsEl.appendChild(empty);
    return;
  }

  inv.forEach(item => {
    const row = document.createElement('div');
    row.className = 'biz-item-row';

    const left = document.createElement('div');
    left.className = 'biz-item-name';
    left.textContent = item.label || item.id || 'Item';

    const right = document.createElement('div');
    right.className = 'biz-item-price';
    right.textContent = formatMoney(item.price || 0);

    row.appendChild(left);
    row.appendChild(right);

    row.addEventListener('click', () => {
      currentSelectedItem = item;
      selectedItemTitle.textContent = item.label || item.id || 'Item';
      selectedItemDesc.textContent = item.description || 'RP item – describe usage to your customers.';
      selectedItemPrice.textContent = formatMoney(item.price || 0);
      buyItemBtn.disabled = false;
    });

    itemsEl.appendChild(row);
  });
}

function renderInventory(biz) {
  if (!inventoryListEl) return;

  inventoryListEl.innerHTML = '';
  const inv = Array.isArray(biz.inventory) ? biz.inventory : [];
  if (!inv.length) {
    const empty = document.createElement('div');
    empty.style.padding = '6px 2px';
    empty.style.fontSize = '12px';
    empty.style.color = 'rgba(255,255,255,0.7)';
    empty.textContent = 'No items stocked yet.';
    inventoryListEl.appendChild(empty);
  } else {
    inv.forEach(item => {
      const row = document.createElement('div');
      row.className = 'biz-employee-row';

      const name = document.createElement('div');
      name.textContent = (item.label || item.id || 'Item') + ' (' + formatMoney(item.price || 0) + ')';

      const actions = document.createElement('div');
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.className = 'biz-secondary-btn';
      removeBtn.style.padding = '2px 6px';
      removeBtn.style.fontSize = '11px';
      removeBtn.addEventListener('click', () => {
        if (!currentPayload) return;
        fetch(`https://${getResourceName()}/bizRemoveItem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=UTF-8' },
          body: JSON.stringify({ slotId: currentPayload.slotId, itemId: item.id })
        }).catch(() => {});
      });

      actions.appendChild(removeBtn);

      row.appendChild(name);
      row.appendChild(actions);
      inventoryListEl.appendChild(row);
    });
  }

  const canManage = currentPayload && (currentPayload.myRole === 'owner' || currentPayload.myRole === 'manager');
  if (inventoryControls) {
    inventoryControls.classList.toggle('hidden', !canManage);
  }
}

function renderEmployees(biz) {
  employeeListEl.innerHTML = '';

  const emps = Array.isArray(biz.employees) ? biz.employees : [];
  if (!emps.length) {
    const empty = document.createElement('div');
    empty.style.padding = '6px 2px';
    empty.style.fontSize = '12px';
    empty.style.color = 'rgba(255,255,255,0.7)';
    empty.textContent = 'No employees configured.';
    employeeListEl.appendChild(empty);
    return;
  }

  const canManage = currentPayload && (currentPayload.myRole === 'owner' || currentPayload.myRole === 'manager');

  emps.forEach(emp => {
    const row = document.createElement('div');
    row.className = 'biz-employee-row';
    row.dataset.charId = emp.charId;

    const name = document.createElement('div');
    name.textContent = (emp.name || emp.charId || 'Employee');

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '6px';

    const role = document.createElement('span');
    role.textContent = (emp.role || 'staff').toUpperCase();

    actions.appendChild(role);

    if (canManage && emp.role !== 'owner') {
      const fireBtn = document.createElement('button');
      fireBtn.textContent = 'Fire';
      fireBtn.className = 'biz-secondary-btn';
      fireBtn.style.padding = '2px 6px';
      fireBtn.style.fontSize = '11px';
      fireBtn.addEventListener('click', () => {
        if (!currentPayload) return;
        fetch(`https://${getResourceName()}/bizRemoveEmployee`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=UTF-8' },
          body: JSON.stringify({ slotId: currentPayload.slotId, charId: emp.charId })
        }).catch(() => {});
      });
      actions.appendChild(fireBtn);
    }

    row.appendChild(name);
    row.appendChild(actions);
    employeeListEl.appendChild(row);
  });

  if (employeeControlsEl) {
    const canManage2 = currentPayload && (currentPayload.myRole === 'owner' || currentPayload.myRole === 'manager');
    employeeControlsEl.classList.toggle('hidden', !canManage2);
  }
}

function renderInfo(payload) {
  const biz = payload.biz || {};
  const ownerName = biz.ownerName || 'Unowned';

  const lines = [
    `Name: ${biz.label || 'Business'}`,
    `Type: ${biz.type || 'custom'}`,
    `Owner: ${ownerName}`,
    `Balance: ${formatMoney(biz.balance || 0)}`,
    `Status: ${biz.open === false ? 'CLOSED' : 'OPEN'}`
  ];

  infoBlock.textContent = lines.join('\n');

  // For sale vs create vs normal
  if (payload.mode === 'for_sale') {
    forSaleBlock.classList.remove('hidden');
    if (forSaleTitle) forSaleTitle.textContent = 'This location is for sale';
    forSaleText.textContent = `Purchase this location for ${formatMoney(payload.buyPrice || 0)} and become the owner.`;
    buyLocationBtn.textContent = 'Purchase business';
  } else if (payload.mode === 'create') {
    forSaleBlock.classList.remove('hidden');
    if (forSaleTitle) forSaleTitle.textContent = 'Open a new business';
    forSaleText.textContent = `Open a new business here for ${formatMoney(payload.buyPrice || 0)}.`;
    buyLocationBtn.textContent = 'Open business';
  } else {
    forSaleBlock.classList.add('hidden');
  }

  const isOwnerOrManager = payload.mode === 'manage' && (payload.myRole === 'owner' || payload.myRole === 'manager');

  if (ownerControls) {
    ownerControls.classList.toggle('hidden', !isOwnerOrManager);
  }

  // Fill edit fields if owner/manager
  if (isOwnerOrManager) {
    if (editNameInput) editNameInput.value = biz.label || '';
    if (editTypeInput) editTypeInput.value = biz.type || '';
    if (editStatusSelect) editStatusSelect.value = biz.open === false ? 'closed' : 'open';
  }

  // Show marketing fee
  if (adFeeText) {
    const fee = payload.marketingFee || 0;
    if (fee > 0) {
      adFeeText.textContent = `Ad cost: ${formatMoney(fee)} (taken from business funds).`;
    } else {
      adFeeText.textContent = 'Ads are currently free.';
    }
  }
}

function renderModeBadge(mode) {
  let txt = 'CUSTOMER';
  if (mode === 'manage') txt = 'OWNER / MANAGER';
  if (mode === 'for_sale') txt = 'FOR SALE';
  if (mode === 'create') txt = 'OPEN NEW BUSINESS';
  modeBadge.textContent = txt;
}

function openBusinessUi(payload) {
  currentPayload = payload || null;

  const mode = payload.mode || 'customer';
  renderModeBadge(mode);

  renderItems(payload.biz || {});
  renderInventory(payload.biz || {});
  renderEmployees(payload.biz || {});
  renderInfo(payload);

  setActiveTab('shop');

  showRoot();
}

function closeBusinessUi() {
  currentPayload = null;
  clearSelectedItem();
  hideRoot();
}

function showBizAdToast(data) {
  if (!adToast) return;

  const label = data.label || 'Business';
  const msg = data.message || '';

  // Line 1: [Business Name]
  if (adLine1) adLine1.textContent = `[ ${label} ]`;

  // Line 2: promo text
  if (adLine2) adLine2.textContent = msg || '';

  // We don't use line3 – no money / funds / cost
  if (adLine3) adLine3.textContent = '';

  adToast.classList.remove('hidden');

  if (adToastTimeout) {
    clearTimeout(adToastTimeout);
    adToastTimeout = null;
  }

  // Fade out after a few seconds
  adToastTimeout = setTimeout(() => {
    adToast.classList.add('hidden');
  }, 7000);
}


// Close button
closeBtn.addEventListener('click', () => {
  fetch(`https://${getResourceName()}/bizClose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({})
  }).catch(() => {});
});

// Purchase location OR open new business
buyLocationBtn.addEventListener('click', () => {
  if (!currentPayload) return;

  if (currentPayload.mode === 'create') {
    fetch(`https://${getResourceName()}/bizCreateNew`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({})
    }).catch(() => {});
    return;
  }

  const slotId = currentPayload.slotId;
  if (!slotId) return;

  fetch(`https://${getResourceName()}/bizBuyLocation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ slotId })
  }).catch(() => {});
});

// Buy item
buyItemBtn.addEventListener('click', () => {
  if (!currentPayload || !currentSelectedItem) return;
  const slotId = currentPayload.slotId;
  if (!slotId) return;

  fetch(`https://${getResourceName()}/bizBuyItem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ slotId, itemId: currentSelectedItem.id })
  }).catch(() => {});
});

// Withdraw funds
withdrawBtn.addEventListener('click', () => {
  if (!currentPayload) return;
  const slotId = currentPayload.slotId;
  if (!slotId) return;

  const amount = Number(withdrawAmountInput.value || 0);
  if (!amount || amount <= 0) return;

  fetch(`https://${getResourceName()}/bizWithdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ slotId, amount })
  }).catch(() => {});
});

// DEPOSIT: add funds from player → business
if (depositBtn) {
  depositBtn.addEventListener('click', () => {
    if (!currentPayload) return;
    const slotId = currentPayload.slotId;
    if (!slotId) return;

    const amount = Number(depositAmountInput.value || 0);
    if (!amount || amount <= 0) return;

    fetch(`https://${getResourceName()}/bizDeposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ slotId, amount })
    }).catch(() => {});
  });
}

// STOCK: add inventory item
if (addItemBtn) {
  addItemBtn.addEventListener('click', () => {
    if (!currentPayload) return;
    const slotId = currentPayload.slotId;
    if (!slotId) return;

    const label = (newItemLabelInput.value || '').trim();
    const itemId = (newItemIdInput.value || '').trim();
    const price = Number(newItemPriceInput.value || 0);

    if (!label || !itemId || price < 0) return;

    fetch(`https://${getResourceName()}/bizAddItem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ slotId, label, itemId, price })
    }).catch(() => {});
  });
}

// HIRE: add employee
if (addEmployeeBtn) {
  addEmployeeBtn.addEventListener('click', () => {
    if (!currentPayload) return;
    const slotId = currentPayload.slotId;
    if (!slotId) return;

    const serverId = (newEmpServerIdInput.value || '').trim();
    const role = newEmpRoleSelect.value || 'staff';

    if (!serverId) return;

    fetch(`https://${getResourceName()}/bizAddEmployee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ slotId, serverId, role })
    }).catch(() => {});
  });
}

// PROMOTE: advertise business
if (adBtn) {
  adBtn.addEventListener('click', () => {
    if (!currentPayload) return;
    const slotId = currentPayload.slotId;
    if (!slotId) return;

    const msg = (adMessageInput.value || '').trim();
    if (!msg) return;

    fetch(`https://${getResourceName()}/bizAdvertise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ slotId, message: msg })
    }).catch(() => {});
  });
}

// Save edited business info
if (saveInfoBtn) {
  saveInfoBtn.addEventListener('click', () => {
    if (!currentPayload) return;
    const slotId = currentPayload.slotId;
    if (!slotId) return;

    const label = (editNameInput.value || '').trim();
    const type = (editTypeInput.value || '').trim();
    const status = editStatusSelect.value || 'open';

    fetch(`https://${getResourceName()}/bizUpdateInfo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ slotId, label, type, status })
    }).catch(() => {});
  });
}

// ESC key
document.addEventListener('keyup', (ev) => {
  if (ev.key === 'Escape' || ev.key === 'Esc' || ev.keyCode === 27) {
    fetch(`https://${getResourceName()}/bizEsc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({})
    }).catch(() => {});
  }
});

// NUI events
window.addEventListener('message', (event) => {
  const data = event.data || {};
  if (!data.action) return;

  if (data.action === 'openBusinessUi') {
    openBusinessUi(data.payload);
  } else if (data.action === 'closeBusinessUi') {
    closeBusinessUi();
  } else if (data.action === 'refreshBusiness') {
    if (!currentPayload) return;
    if (!data.payload || data.payload.slotId !== currentPayload.slotId) return;
    currentPayload.biz = data.payload.biz || currentPayload.biz;
    renderItems(currentPayload.biz);
    renderInventory(currentPayload.biz);
    renderEmployees(currentPayload.biz);
    renderInfo(currentPayload);
  } else if (data.action === 'showBizAd') {
    showBizAdToast(data.payload || {});
  }
});

// NUI wrappers (if ever needed from client.lua)
function nuiOpenBusiness(payload) {
  openBusinessUi(payload);
}

function nuiCloseBusiness() {
  closeBusinessUi();
}
