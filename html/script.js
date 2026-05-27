const root = document.getElementById('biz-root');
const closeBtn = document.getElementById('bizCloseBtn');
const bottomCloseBtn = document.getElementById('bizBottomCloseBtn');
const footerNote = document.getElementById('bizFooterNote');

const tabs = document.querySelectorAll('.biz-tab');
const panelShop = document.getElementById('panel-shop');
const panelInv = document.getElementById('panel-inventory');
const panelEmp = document.getElementById('panel-employees');
const panelInfo = document.getElementById('panel-info');
const catalogColumn = document.getElementById('bizCatalogColumn');
const panelsColumn = document.getElementById('bizPanelsColumn');

const itemsEl = document.getElementById('bizItems');
const modeBadge = document.getElementById('bizModeBadge');
const itemCountEl = document.getElementById('bizItemCount');
const searchInput = document.getElementById('bizSearchInput');
const sortSelect = document.getElementById('bizSortSelect');
const bizTitle = document.getElementById('bizTitle');
const bizSubtitle = document.getElementById('bizSubtitle');
const bizTypeBadge = document.getElementById('bizTypeBadge');

const employeeListEl = document.getElementById('bizEmployeeList');
const inventoryListEl = document.getElementById('bizInventoryList');
const infoBlock = document.getElementById('bizInfoBlock');
const forSaleBlock = document.getElementById('bizForSaleBlock');
const forSaleText = document.getElementById('bizForSaleText');
const buyLocationBtn = document.getElementById('bizBuyLocationBtn');
const forSaleTitle = document.querySelector('#bizForSaleBlock h4');

const selectedItemEl = document.getElementById('bizSelectedItem');
const selectedItemTitle = document.querySelector('#bizSelectedItem .biz-selected-title');
const selectedItemDesc = document.querySelector('#bizSelectedItem .biz-selected-desc');
const selectedItemPrice = document.querySelector('#bizSelectedItem .biz-selected-price');
const selectedVisual = document.getElementById('bizSelectedVisual');
const selectedImage = document.getElementById('bizSelectedImage');
const buyItemBtn = document.getElementById('bizBuyItemBtn');
const clearSelectedBtn = document.getElementById('bizClearSelectedBtn');

const ownerControls = document.getElementById('bizOwnerControls');
const withdrawAmountInput = document.getElementById('bizWithdrawAmount');
const withdrawBtn = document.getElementById('bizWithdrawBtn');
const depositAmountInput = document.getElementById('bizDepositAmount');
const depositBtn = document.getElementById('bizDepositBtn');

const inventoryControls = document.getElementById('bizInventoryControls');
const newItemLabelInput = document.getElementById('bizNewItemLabel');
const newItemIdInput = document.getElementById('bizNewItemId');
const newItemPriceInput = document.getElementById('bizNewItemPrice');
const addItemBtn = document.getElementById('bizAddItemBtn');

const employeeControlsEl = document.getElementById('bizEmployeeControls');
const newEmpServerIdInput = document.getElementById('bizNewEmployeeServerId');
const newEmpRoleSelect = document.getElementById('bizNewEmployeeRole');
const addEmployeeBtn = document.getElementById('bizAddEmployeeBtn');

const adMessageInput = document.getElementById('bizAdMessage');
const adBtn = document.getElementById('bizAdBtn');
const adFeeText = document.getElementById('bizAdFeeText');

const editNameInput = document.getElementById('bizEditName');
const editTypeInput = document.getElementById('bizEditType');
const editStatusSelect = document.getElementById('bizEditStatus');
const saveInfoBtn = document.getElementById('bizSaveInfoBtn');

const adToast = document.getElementById('biz-ad-toast');
const adLine1 = document.getElementById('bizAdLine1');
const adLine2 = document.getElementById('bizAdLine2');
const adLine3 = document.getElementById('bizAdLine3');
const notifyStack = document.getElementById('biz-notify-stack');
let adToastTimeout = null;
let notifySeed = 0;

let currentPayload = null;
let currentSelectedItem = null;
let activeTab = 'shop';
let currentSearch = '';
let currentSort = 'default';

function getResourceName() {
  return (window.GetParentResourceName && GetParentResourceName()) || 'Az-Businesses';
}

function showRoot() {
  root.classList.remove('hidden');
  root.dataset.tab = activeTab;
}

function hideRoot() {
  root.classList.add('hidden');
}

function formatMoney(value) {
  if (typeof value !== 'number') value = Number(value) || 0;
  return '$' + value.toLocaleString();
}

function getItemImage(item) {
  if (!item || typeof item !== 'object') return '';
  const keys = ['image', 'imageUrl', 'image_url', 'img', 'icon', 'photo', 'imageSrc'];
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function setSelectedImage(item) {
  const imageUrl = getItemImage(item);
  if (!selectedItemEl || !selectedVisual || !selectedImage) return;

  if (imageUrl) {
    selectedItemEl.classList.add('has-image');
    selectedVisual.classList.remove('hidden');
    selectedImage.src = imageUrl;
  } else {
    selectedItemEl.classList.remove('has-image');
    selectedVisual.classList.add('hidden');
    selectedImage.removeAttribute('src');
  }
}

function getModeText(mode) {
  if (mode === 'manage') return 'OWNER / MANAGER';
  if (mode === 'for_sale') return 'FOR SALE';
  if (mode === 'create') return 'NEW LOCATION';
  return 'CUSTOMER';
}

function getShopSubtitle(payload) {
  const biz = payload.biz || {};
  if (payload.mode === 'for_sale') {
    return 'This location is available for purchase. Review the site details and acquire the property to begin operations.';
  }
  if (payload.mode === 'create') {
    return 'Set up a new storefront here, configure your catalog, and start serving customers through a clean lore-friendly interface.';
  }
  if (payload.mode === 'manage') {
    return 'Review your catalog, update pricing, manage employees, and monitor business funds from a single in-world portal.';
  }
  return `Browse ${biz.label || 'store'} inventory, review prices, and make quick purchases without leaving the counter.`;
}

function setHero(payload) {
  const biz = payload.biz || {};
  const type = String(biz.type || 'Retail Store').replace(/_/g, ' ');
  if (bizTitle) bizTitle.textContent = (biz.label || 'BUSINESS PORTAL').toUpperCase();
  if (bizSubtitle) bizSubtitle.textContent = getShopSubtitle(payload);
  if (bizTypeBadge) {
    const badge = payload.mode === 'for_sale'
      ? 'LOCATION AVAILABLE'
      : payload.mode === 'create'
        ? 'NEW BUSINESS SETUP'
        : `${type}`.toUpperCase();
    bizTypeBadge.textContent = badge;
  }
}

function setModeBadge(mode) {
  if (modeBadge) modeBadge.textContent = getModeText(mode);
}

function setSearchPlaceholder() {
  if (!searchInput) return;
  const placeholders = {
    shop: 'Search stock',
    inventory: 'Search stockroom',
    employees: 'Search employees',
    info: 'Search unavailable here'
  };
  searchInput.placeholder = placeholders[activeTab] || 'Search';
}

function setActiveTab(tabName) {
  activeTab = tabName;
  if (root) root.dataset.tab = tabName;

  tabs.forEach(t => {
    const name = t.dataset.tab;
    t.classList.toggle('active', name === tabName);
  });

  const isShopTab = tabName === 'shop';
  panelShop.classList.toggle('hidden', !isShopTab);
  if (isShopTab && !currentSelectedItem) panelShop.classList.add('selection-empty');
  panelInv.classList.toggle('hidden', tabName !== 'inventory');
  panelEmp.classList.toggle('hidden', tabName !== 'employees');
  panelInfo.classList.toggle('hidden', tabName !== 'info');

  if (catalogColumn) catalogColumn.classList.toggle('hidden', !isShopTab);
  if (panelsColumn) {
    panelsColumn.classList.toggle('shop-layout', isShopTab);
    panelsColumn.classList.toggle('center-layout', !isShopTab);
  }

  if (sortSelect) {
    sortSelect.disabled = !isShopTab;
    sortSelect.parentElement.style.opacity = isShopTab ? '1' : '0.55';
  }

  setSearchPlaceholder();
  refreshUi();
}

function clearSelectedItem() {
  currentSelectedItem = null;
  if (panelShop) panelShop.classList.add('selection-empty');
  selectedItemTitle.textContent = 'Select an item';
  selectedItemDesc.textContent = 'Choose a listing from the catalog to review its price and purchase it.';
  selectedItemPrice.textContent = '';
  setSelectedImage(null);
  buyItemBtn.disabled = true;
  if (footerNote) footerNote.textContent = 'Select an item from this business and continue your purchase.';
}

function dismissSelectedItem(rerender = true) {
  clearSelectedItem();
  if (rerender && currentPayload && activeTab === 'shop') {
    renderItems(currentPayload.biz || {});
  }
}

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function matchesSearch(fields) {
  if (!currentSearch) return true;
  const needle = normalizeText(currentSearch);
  return fields.some(field => normalizeText(field).includes(needle));
}

function getSortedItems(list) {
  const items = Array.isArray(list) ? [...list] : [];
  if (currentSort === 'label') {
    items.sort((a, b) => String(a.label || a.id || '').localeCompare(String(b.label || b.id || '')));
  } else if (currentSort === 'price_asc') {
    items.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  } else if (currentSort === 'price_desc') {
    items.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  }
  return items;
}

function renderEmptyState(target, message) {
  target.innerHTML = '';
  const empty = document.createElement('div');
  empty.className = target === itemsEl ? 'biz-catalog-empty' : 'biz-empty-state';
  empty.textContent = message;
  target.appendChild(empty);
}

function renderItems(biz) {
  itemsEl.innerHTML = '';
  const inventory = getSortedItems((biz.inventory || []).filter(item => matchesSearch([
    item.label,
    item.id,
    item.description,
    biz.label,
    biz.type
  ])));

  if (itemCountEl) {
    itemCountEl.textContent = inventory.length
      ? `${inventory.length} item${inventory.length === 1 ? '' : 's'} available`
      : 'No matching items found';
  }

  if (!inventory.length) {
    renderEmptyState(itemsEl, currentSearch ? 'No stock matched your search.' : 'No items are configured for this business yet.');
    if (currentSelectedItem && !(biz.inventory || []).some(item => item.id === currentSelectedItem.id)) {
      clearSelectedItem();
    }
    return;
  }

  inventory.forEach(item => {
    const card = document.createElement('div');
    card.className = 'biz-card';
    if (currentSelectedItem && currentSelectedItem.id === item.id) {
      card.classList.add('active');
    }

    const imageUrl = getItemImage(item);
    if (imageUrl) {
      card.classList.add('has-image');
      const media = document.createElement('div');
      media.className = 'biz-card-media';
      const img = document.createElement('img');
      img.className = 'biz-card-image';
      img.src = imageUrl;
      img.alt = item.label || item.id || 'Item image';
      media.appendChild(img);
      card.appendChild(media);
    }

    const cardContent = document.createElement('div');
    cardContent.className = 'biz-card-content';

    const kicker = document.createElement('div');
    kicker.className = 'biz-card-kicker';
    kicker.textContent = (biz.type || 'Retail Listing').toUpperCase();

    const title = document.createElement('div');
    title.className = 'biz-card-title';
    title.textContent = item.label || item.id || 'Item';

    const desc = document.createElement('div');
    desc.className = 'biz-card-desc';
    desc.textContent = item.description || `Item ID: ${item.id || 'unknown'}`;

    const footer = document.createElement('div');
    footer.className = 'biz-card-footer';

    const meta = document.createElement('div');
    meta.className = 'biz-card-meta';

    const price = document.createElement('div');
    price.className = 'biz-card-price';
    price.textContent = formatMoney(item.price || 0);

    const chip = document.createElement('div');
    chip.className = 'biz-data-chip';
    chip.textContent = item.id || 'catalog';

    const action = document.createElement('button');
    action.className = 'biz-secondary-btn biz-card-action';
    action.textContent = currentSelectedItem && currentSelectedItem.id === item.id ? 'Selected' : 'Review';
    action.addEventListener('click', (event) => {
      event.stopPropagation();
      if (currentSelectedItem && currentSelectedItem.id === item.id) {
        dismissSelectedItem();
        return;
      }
      selectItem(item);
    });

    meta.appendChild(price);
    meta.appendChild(chip);
    footer.appendChild(meta);
    footer.appendChild(action);

    cardContent.appendChild(kicker);
    cardContent.appendChild(title);
    cardContent.appendChild(desc);
    cardContent.appendChild(footer);
    card.appendChild(cardContent);
    card.addEventListener('click', () => {
      if (currentSelectedItem && currentSelectedItem.id === item.id) {
        dismissSelectedItem();
        return;
      }
      selectItem(item);
    });

    itemsEl.appendChild(card);
  });

}

function selectItem(item, rerender = true) {
  if (!item) return;
  currentSelectedItem = item;
  if (panelShop) panelShop.classList.remove('selection-empty');
  selectedItemTitle.textContent = item.label || item.id || 'Item';
  selectedItemDesc.textContent = item.description || 'Store item available for purchase at this location.';
  selectedItemPrice.textContent = formatMoney(item.price || 0);
  setSelectedImage(item);
  buyItemBtn.disabled = false;
  if (footerNote) footerNote.textContent = `Selected ${item.label || item.id || 'item'} for purchase.`;
  if (rerender && currentPayload) renderItems(currentPayload.biz || {});
  if (activeTab === 'shop' && panelShop) {
    requestAnimationFrame(() => {
      try { panelShop.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
    });
  }
}

function renderInventory(biz) {
  inventoryListEl.innerHTML = '';
  const inv = (biz.inventory || []).filter(item => matchesSearch([item.label, item.id, item.description]));

  if (!inv.length) {
    renderEmptyState(inventoryListEl, currentSearch ? 'No stockroom entries matched your search.' : 'No items stocked yet.');
  } else {
    inv.forEach(item => {
      const row = document.createElement('div');
      row.className = 'biz-data-row';

      const main = document.createElement('div');
      main.className = 'biz-data-row-main';

      const title = document.createElement('div');
      title.className = 'biz-data-row-title';
      title.textContent = item.label || item.id || 'Item';

      const sub = document.createElement('div');
      sub.className = 'biz-data-row-sub';
      sub.textContent = `${item.id || 'unknown id'} • ${formatMoney(item.price || 0)}`;

      const actions = document.createElement('div');
      actions.className = 'biz-data-actions';

      const priceChip = document.createElement('div');
      priceChip.className = 'biz-data-chip';
      priceChip.textContent = formatMoney(item.price || 0);
      actions.appendChild(priceChip);

      const canManage = currentPayload && (currentPayload.myRole === 'owner' || currentPayload.myRole === 'manager');
      if (canManage) {
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.className = 'biz-secondary-btn';
        removeBtn.addEventListener('click', () => {
          if (!currentPayload) return;
          fetch(`https://${getResourceName()}/bizRemoveItem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify({ slotId: currentPayload.slotId, itemId: item.id })
          }).catch(() => {});
        });
        actions.appendChild(removeBtn);
      }

      main.appendChild(title);
      main.appendChild(sub);
      row.appendChild(main);
      row.appendChild(actions);
      inventoryListEl.appendChild(row);
    });
  }

  const canManage = currentPayload && (currentPayload.myRole === 'owner' || currentPayload.myRole === 'manager');
  if (inventoryControls) inventoryControls.classList.toggle('hidden', !canManage);

  if (itemCountEl && activeTab === 'inventory') {
    itemCountEl.textContent = inv.length
      ? `${inv.length} stock item${inv.length === 1 ? '' : 's'} listed`
      : 'No stock entries found';
  }
}

function renderEmployees(biz) {
  employeeListEl.innerHTML = '';
  const emps = (biz.employees || []).filter(emp => matchesSearch([emp.name, emp.charId, emp.role]));
  const canManage = currentPayload && (currentPayload.myRole === 'owner' || currentPayload.myRole === 'manager');

  if (!emps.length) {
    renderEmptyState(employeeListEl, currentSearch ? 'No employees matched your search.' : 'No employees configured.');
  } else {
    emps.forEach(emp => {
      const row = document.createElement('div');
      row.className = 'biz-data-row';
      row.dataset.charId = emp.charId;

      const main = document.createElement('div');
      main.className = 'biz-data-row-main';

      const title = document.createElement('div');
      title.className = 'biz-data-row-title';
      title.textContent = emp.name || emp.charId || 'Employee';

      const sub = document.createElement('div');
      sub.className = 'biz-data-row-sub';
      sub.textContent = `Character ID: ${emp.charId || 'unknown'}`;

      const actions = document.createElement('div');
      actions.className = 'biz-data-actions';

      const role = document.createElement('div');
      role.className = 'biz-data-chip';
      role.textContent = (emp.role || 'staff').toUpperCase();
      actions.appendChild(role);

      if (canManage && emp.role !== 'owner') {
        const fireBtn = document.createElement('button');
        fireBtn.textContent = 'Fire';
        fireBtn.className = 'biz-secondary-btn';
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

      main.appendChild(title);
      main.appendChild(sub);
      row.appendChild(main);
      row.appendChild(actions);
      employeeListEl.appendChild(row);
    });
  }

  if (employeeControlsEl) employeeControlsEl.classList.toggle('hidden', !canManage);

  if (itemCountEl && activeTab === 'employees') {
    itemCountEl.textContent = emps.length
      ? `${emps.length} employee${emps.length === 1 ? '' : 's'} on record`
      : 'No employee records found';
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
  if (ownerControls) ownerControls.classList.toggle('hidden', !isOwnerOrManager);

  if (isOwnerOrManager) {
    if (editNameInput) editNameInput.value = biz.label || '';
    if (editTypeInput) editTypeInput.value = biz.type || '';
    if (editStatusSelect) editStatusSelect.value = biz.open === false ? 'closed' : 'open';
  }

  if (adFeeText) {
    const fee = payload.marketingFee || 0;
    adFeeText.textContent = fee > 0
      ? `Broadcast fee: ${formatMoney(fee)} taken from business funds.`
      : 'Broadcasts are currently free.';
  }

  if (itemCountEl && activeTab === 'info') {
    itemCountEl.textContent = `${payload.mode === 'manage' ? 'Management' : 'Location'} overview`;
  }
}

function refreshUi() {
  if (!currentPayload) return;
  const biz = currentPayload.biz || {};
  if (activeTab === 'shop') renderItems(biz);
  if (activeTab === 'inventory') renderInventory(biz);
  if (activeTab === 'employees') renderEmployees(biz);
  renderInfo(currentPayload);
}

function openBusinessUi(payload) {
  currentPayload = payload || { biz: {} };
  currentSearch = '';
  currentSort = 'default';
  if (searchInput) searchInput.value = '';
  if (sortSelect) sortSelect.value = 'default';

  setHero(currentPayload);
  setModeBadge(currentPayload.mode || 'customer');
  clearSelectedItem();
  setActiveTab('shop');
  renderInventory(currentPayload.biz || {});
  renderEmployees(currentPayload.biz || {});
  renderInfo(currentPayload);
  showRoot();
}

function closeBusinessUi() {
  currentPayload = null;
  currentSearch = '';
  currentSort = 'default';
  clearSelectedItem();
  hideRoot();
}

function showBizAdToast(data) {
  if (!adToast) return;

  const label = data.label || 'Business';
  const msg = data.message || '';
  if (adLine1) adLine1.textContent = `[ ${label} ]`;
  if (adLine2) adLine2.textContent = msg || '';
  if (adLine3) adLine3.textContent = '';

  adToast.classList.remove('hidden');

  if (adToastTimeout) {
    clearTimeout(adToastTimeout);
    adToastTimeout = null;
  }

  adToastTimeout = setTimeout(() => {
    adToast.classList.add('hidden');
  }, 7000);
}



function showBizNotify(payload = {}) {
  if (!notifyStack) return;

  const level = String(payload.level || 'info').toLowerCase();
  const title = payload.title || (level === 'success' ? 'SUCCESS' : level === 'error' ? 'ERROR' : 'NOTICE');
  const message = payload.message || 'Action complete.';
  const duration = Math.max(1600, Number(payload.duration) || 2800);

  const el = document.createElement('div');
  el.className = `biz-notify biz-notify-${level}`;
  el.dataset.id = String(++notifySeed);

  const icon = document.createElement('div');
  icon.className = 'biz-notify-icon';
  icon.textContent = level === 'success' ? '✓' : level === 'error' ? '!' : '•';

  const body = document.createElement('div');
  body.className = 'biz-notify-body';

  const head = document.createElement('div');
  head.className = 'biz-notify-title';
  head.textContent = String(title).toUpperCase();

  const text = document.createElement('div');
  text.className = 'biz-notify-text';
  text.textContent = message;

  const close = document.createElement('button');
  close.className = 'biz-notify-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Dismiss notification');
  close.textContent = '×';

  body.appendChild(head);
  body.appendChild(text);
  el.appendChild(icon);
  el.appendChild(body);
  el.appendChild(close);
  notifyStack.appendChild(el);

  const remove = () => {
    if (!el.parentNode) return;
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 160);
  };

  close.addEventListener('click', remove);
  setTimeout(remove, duration);
}

function notifyPending(message, title = 'BUSINESS') {
  showBizNotify({ level: 'info', title, message, duration: 1800 });
}

function notifyValidation(message, title = 'BUSINESS') {
  showBizNotify({ level: 'error', title, message, duration: 2400 });
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    setActiveTab(tab.dataset.tab);
  });
});

if (searchInput) {
  searchInput.addEventListener('input', () => {
    currentSearch = searchInput.value || '';
    refreshUi();
  });
}

if (sortSelect) {
  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value || 'default';
    if (activeTab === 'shop') renderItems((currentPayload && currentPayload.biz) || {});
  });
}

function requestCloseUi() {
  fetch(`https://${getResourceName()}/bizClose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({})
  }).catch(() => {});
}

if (clearSelectedBtn) {
  clearSelectedBtn.addEventListener('click', () => {
    dismissSelectedItem();
  });
}

if (closeBtn) closeBtn.addEventListener('click', requestCloseUi);
if (bottomCloseBtn) bottomCloseBtn.addEventListener('click', requestCloseUi);

buyLocationBtn.addEventListener('click', () => {
  if (!currentPayload) return;

  if (currentPayload.mode === 'create') {
    notifyPending('Creating new business...', 'BUSINESS');
    fetch(`https://${getResourceName()}/bizCreateNew`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({})
    }).catch(() => {});
    return;
  }

  const slotId = currentPayload.slotId;
  if (!slotId) return;

  notifyPending(currentPayload.mode === 'for_sale' ? 'Processing business purchase...' : 'Opening business...', 'PURCHASE');

  fetch(`https://${getResourceName()}/bizBuyLocation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ slotId })
  }).catch(() => {});
});

buyItemBtn.addEventListener('click', () => {
  if (!currentPayload || !currentSelectedItem) {
    notifyValidation('Select an item first.', 'PURCHASE');
    return;
  }
  const slotId = currentPayload.slotId;
  if (!slotId) return;

  notifyPending(`Processing purchase for ${currentSelectedItem.label || currentSelectedItem.id || 'item'}...`, 'PURCHASE');

  fetch(`https://${getResourceName()}/bizBuyItem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ slotId, itemId: currentSelectedItem.id })
  }).catch(() => {});
});

withdrawBtn.addEventListener('click', () => {
  if (!currentPayload) return;
  const slotId = currentPayload.slotId;
  if (!slotId) return;

  const amount = Number(withdrawAmountInput.value || 0);
  if (!amount || amount <= 0) {
    notifyValidation('Enter a valid withdraw amount.', 'FUNDS');
    return;
  }

  notifyPending(`Withdrawing ${formatMoney(amount)}...`, 'FUNDS');

  fetch(`https://${getResourceName()}/bizWithdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ slotId, amount })
  }).catch(() => {});
});

if (depositBtn) {
  depositBtn.addEventListener('click', () => {
    if (!currentPayload) return;
    const slotId = currentPayload.slotId;
    if (!slotId) return;

    const amount = Number(depositAmountInput.value || 0);
    if (!amount || amount <= 0) {
      notifyValidation('Enter a valid deposit amount.', 'FUNDS');
      return;
    }

    notifyPending(`Depositing ${formatMoney(amount)}...`, 'FUNDS');

    fetch(`https://${getResourceName()}/bizDeposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ slotId, amount })
    }).catch(() => {});
  });
}

if (addItemBtn) {
  addItemBtn.addEventListener('click', () => {
    if (!currentPayload) return;
    const slotId = currentPayload.slotId;
    if (!slotId) return;

    const label = (newItemLabelInput.value || '').trim();
    const itemId = (newItemIdInput.value || '').trim();
    const price = Number(newItemPriceInput.value || 0);

    if (!label || !itemId || price < 0) {
      notifyValidation('Fill in item label, ID, and a valid price.', 'STOCKROOM');
      return;
    }

    notifyPending(`Saving ${label} to stock...`, 'STOCKROOM');

    fetch(`https://${getResourceName()}/bizAddItem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ slotId, label, itemId, price })
    }).catch(() => {});
  });
}

if (addEmployeeBtn) {
  addEmployeeBtn.addEventListener('click', () => {
    if (!currentPayload) return;
    const slotId = currentPayload.slotId;
    if (!slotId) return;

    const serverId = (newEmpServerIdInput.value || '').trim();
    const role = newEmpRoleSelect.value || 'staff';
    if (!serverId) {
      notifyValidation('Enter a server ID to hire.', 'STAFF');
      return;
    }

    notifyPending('Hiring employee...', 'STAFF');

    fetch(`https://${getResourceName()}/bizAddEmployee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ slotId, serverId, role })
    }).catch(() => {});
  });
}

if (adBtn) {
  adBtn.addEventListener('click', () => {
    if (!currentPayload) return;
    const slotId = currentPayload.slotId;
    if (!slotId) return;

    const msg = (adMessageInput.value || '').trim();
    if (!msg) {
      notifyValidation('Enter an advertisement message first.', 'MARKETING');
      return;
    }

    notifyPending('Sending advertisement...', 'MARKETING');

    fetch(`https://${getResourceName()}/bizAdvertise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ slotId, message: msg })
    }).catch(() => {});
  });
}

if (saveInfoBtn) {
  saveInfoBtn.addEventListener('click', () => {
    if (!currentPayload) return;
    const slotId = currentPayload.slotId;
    if (!slotId) return;

    const label = (editNameInput.value || '').trim();
    const type = (editTypeInput.value || '').trim();
    const status = editStatusSelect.value || 'open';

    notifyPending('Saving business details...', 'DETAILS');

    fetch(`https://${getResourceName()}/bizUpdateInfo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ slotId, label, type, status })
    }).catch(() => {});
  });
}

document.addEventListener('keyup', (ev) => {
  if (ev.key === 'Escape' || ev.key === 'Esc' || ev.keyCode === 27) {
    fetch(`https://${getResourceName()}/bizEsc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({})
    }).catch(() => {});
  }
});

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
    setHero(currentPayload);
    refreshUi();
  } else if (data.action === 'showBizAd') {
    showBizAdToast(data.payload || {});
  } else if (data.action === 'showBizNotify') {
    showBizNotify(data.payload || {});
  }
});

function nuiOpenBusiness(payload) {
  openBusinessUi(payload);
}

function nuiCloseBusiness() {
  closeBusinessUi();
}
