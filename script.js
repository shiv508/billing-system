let currentLanguage = 'hi';

function changeLanguage() {
  const langSelect = document.getElementById('languageSelect');
  currentLanguage = langSelect.value;
  localStorage.setItem('asptronics_language', currentLanguage);
  
  document.querySelectorAll('[data-lang]').forEach(element => {
    if (element.getAttribute('data-lang') === currentLanguage) {
      element.style.display = 'inline';
    } else {
      element.style.display = 'none';
    }
  });
  
  updatePlaceholders();
}

function updatePlaceholders() {
  const placeholders = {
    hi: {
      loginUsername: "यूजरनेम डालें",
      loginPassword: "पासवर्ड डालें",
      productSearch: "प्रोडक्ट कोड या नाम से सर्च करें...",
      customerSearch: "नाम या फोन से कस्टमर सर्च करें...",
      invoiceCustomerName: "कस्टमर नाम डालें",
      historySearch: "इनवॉइस ID या कस्टमर से सर्च करें...",
      productName: "प्रोडक्ट नाम डालें",
      customerName: "पूरा नाम",
      customerPhone: "मोबाइल नंबर",
      simpleUPI: "example@upi",
      simpleName: "प्राप्तकर्ता का नाम"
    },
    en: {
      loginUsername: "Enter username",
      loginPassword: "Enter password",
      productSearch: "Search products by code or name...",
      customerSearch: "Search customers by name or phone...",
      invoiceCustomerName: "Enter customer name",
      historySearch: "Search by invoice ID or customer...",
      productName: "Enter product name",
      customerName: "Full name",
      customerPhone: "Mobile number",
      simpleUPI: "example@upi",
      simpleName: "Receiver Name"
    }
  };
  
  const fields = placeholders[currentLanguage];
  for (const [id, text] of Object.entries(fields)) {
    const element = document.getElementById(id);
    if (element) {
      element.placeholder = text;
    }
  }
}

function initLanguage() {
  const savedLang = localStorage.getItem('asptronics_language') || 'hi';
  document.getElementById('languageSelect').value = savedLang;
  currentLanguage = savedLang;
  changeLanguage();
}

// ========== GLOBAL VARIABLES ==========
let currentUser = null;
let users = {};
let invoiceItems = [];
let editPassword = '9411704071';

// ========== DATE FORMAT HELPERS ==========
function formatDateForInput(dateStr) {
  // Convert DD/MM/YYYY to YYYY-MM-DD for date input
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return '';
}

function formatDateForStorage(dateStr) {
  // Convert YYYY-MM-DD to DD/MM/YYYY for storage
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function getDateInputValue(dateInputId) {
  const dateStr = document.getElementById(dateInputId).value; // YYYY-MM-DD
  return formatDateForStorage(dateStr); // DD/MM/YYYY
}

// ========== DELETE PASSWORD PROTECTION FUNCTIONS ==========
function showDeletePasswordModal() {
    document.getElementById('deletePasswordModal').style.display = 'flex';
    document.getElementById('deletePasswordInput').value = '';
    document.getElementById('deletePasswordInput').focus();
}

function hideDeletePasswordModal() {
    document.getElementById('deletePasswordModal').style.display = 'none';
    document.getElementById('deletePasswordInput').value = '';
    localStorage.removeItem('pendingDeleteAction');
    localStorage.removeItem('pendingDeleteId');
}

function verifyDeletePassword() {
    const password = document.getElementById('deletePasswordInput').value;
    const action = localStorage.getItem('pendingDeleteAction');
    const id = localStorage.getItem('pendingDeleteId');

    if (password === editPassword) {
        if (action === 'invoice') {
            deleteInvoice(id);
        } else if (action === 'product') {
            deleteProductNow(id);
        } else if (action === 'customer') {
            deleteCustomerNow(id);
        } else if (action === 'category') {
            deleteCategoryNow(id);
        }
        hideDeletePasswordModal();
    } else {
        alert(currentLanguage === 'hi' ? 'गलत पासवर्ड!' : 'Wrong password!');
    }
}

// ========== DELETE FUNCTIONS WITH PASSWO
function startDeleteProduct(index) {
    localStorage.setItem('pendingDeleteAction', 'product');
    localStorage.setItem('pendingDeleteId', index);
    showDeletePasswordModal();
}

function startDeleteCustomer(index) {
    localStorage.setItem('pendingDeleteAction', 'customer');
    localStorage.setItem('pendingDeleteId', index);
    showDeletePasswordModal();
}

function startDeleteCategory() {
    const selectedCategory = document.getElementById('newCategory').value.trim();
    if (!selectedCategory) {
        alert(currentLanguage === 'hi' ? 'कृपया डिलीट करने के लिए कैटेगरी चुनें' : 'Please select a category to delete');
        return;
    }
    
    const index = categories.indexOf(selectedCategory);
    if (index === -1) {
        alert(currentLanguage === 'hi' ? 'यह कैटेगरी मौजूद नहीं है' : 'This category does not exist');
        return;
    }
    
    localStorage.setItem('pendingDeleteAction', 'category');
    localStorage.setItem('pendingDeleteId', index);
    showDeletePasswordModal();
}

function deleteCategoryNow(index) {
    categories.splice(index, 1);
    localStorage.setItem('asptronics_categories', JSON.stringify(categories));
    loadCategories();
    alert(currentLanguage === 'hi' ? 'कैटेगरी डिलीट हो गई!' : 'Category deleted!');
}

function deleteProductNow(index) {
    const products = JSON.parse(localStorage.getItem(`asptronics_products_${currentUser}`)) || [];
    products.splice(index, 1);
    localStorage.setItem(`asptronics_products_${currentUser}`, JSON.stringify(products));
    loadProducts();
    loadProductSelect();
    alert(currentLanguage === 'hi' ? 'प्रोडक्ट डिलीट हो गया!' : 'Product deleted!');
}

function deleteCustomerNow(index) {
    const customers = JSON.parse(localStorage.getItem(`asptronics_customers_${currentUser}`)) || [];
    customers.splice(index, 1);
    localStorage.setItem(`asptronics_customers_${currentUser}`, JSON.stringify(customers));
    loadCustomers();
    loadCustomerSelect();
    alert(currentLanguage === 'hi' ? 'कस्टमर डिलीट हो गया!' : 'Customer deleted!');
}

// ========== ORIGINAL DELETE FUNCTIONS ==========
function deleteInvoice(invoiceId) {
    const invoices = JSON.parse(localStorage.getItem(`asptronics_invoices_${currentUser}`)) || [];
    const updatedInvoices = invoices.filter(inv => inv.id !== invoiceId);
    localStorage.setItem(`asptronics_invoices_${currentUser}`, JSON.stringify(updatedInvoices));
    loadInvoices();
    loadDashboard();
    alert(currentLanguage === 'hi' ? 'इनवॉइस डिलीट हो गया!' : 'Invoice deleted!');
}

// ========== CATEGORY MANAGEMENT FUNCTIONS ==========
let categories = [];

function loadCategories() {
    categories = JSON.parse(localStorage.getItem('asptronics_categories')) || [];
    
    if (categories.length === 0) {
        categories = ['इलेक्ट्रॉनिक्स', 'कपड़े', 'घरेलू सामान', 'ब्यूटी', 'खाद्य पदार्थ', 'अन्य'];
        localStorage.setItem('asptronics_categories', JSON.stringify(categories));
    }
    
    const datalist = document.getElementById('categoryList');
    if (datalist) {
        datalist.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            datalist.appendChild(option);
        });
    }
    
    const categoryListContainer = document.getElementById('categoryListContainer');
    if (categoryListContainer) {
        categoryListContainer.innerHTML = '';
        categories.forEach((category, index) => {
            const badge = document.createElement('span');
            badge.style.display = 'inline-block';
            badge.style.margin = '3px';
            badge.style.padding = '4px 8px';
            badge.style.backgroundColor = '#e0e0e0';
            badge.style.borderRadius = '4px';
            badge.style.fontSize = '11px';
            badge.style.cursor = 'pointer';
            badge.textContent = category;
            badge.title = currentLanguage === 'hi' ? 'क्लिक करके डिलीट करें' : 'Click to delete';
            badge.onclick = function() {
                startDeleteCategoryFromList(index);
            };
            categoryListContainer.appendChild(badge);
        });
    }
}

function startDeleteCategoryFromList(index) {
    localStorage.setItem('pendingDeleteAction', 'category');
    localStorage.setItem('pendingDeleteId', index);
    showDeletePasswordModal();
}

function addNewCategory() {
    const newCategory = document.getElementById('newCategory').value.trim();
    if (!newCategory) {
        alert(currentLanguage === 'hi' ? 'कृपया कैटेगरी नाम डालें' : 'Please enter category name');
        return;
    }
    
    if (categories.includes(newCategory)) {
        alert(currentLanguage === 'hi' ? 'यह कैटेगरी पहले से मौजूद है' : 'This category already exists');
        return;
    }
    
    categories.push(newCategory);
    localStorage.setItem('asptronics_categories', JSON.stringify(categories));
    loadCategories();
    
    document.getElementById('newCategory').value = '';
    alert((currentLanguage === 'hi' ? 'कैटेगरी जोड़ी गई: ' : 'Category added: ') + newCategory);
}

// ========== DASHBOARD CATEGORY FILTER FUNCTIONS ==========
function loadDashboardCategories() {
    const categorySelect = document.getElementById('historyCategory');
    if (!categorySelect) return;
    
    const products = JSON.parse(localStorage.getItem(`asptronics_products_${currentUser}`)) || [];
    
    const uniqueCategories = new Set();
    products.forEach(product => {
        if (product.category && product.category.trim() !== '') {
            uniqueCategories.add(product.category);
        }
    });
    
    categories.forEach(category => {
        uniqueCategories.add(category);
    });
    
    const categoriesArray = Array.from(uniqueCategories).sort();
    
    while (categorySelect.options.length > 1) {
        categorySelect.remove(1);
    }
    
    if (categorySelect.options.length === 0) {
        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = currentLanguage === 'hi' ? 'सभी कैटेगरी' : 'All Categories';
        categorySelect.appendChild(allOption);
    }
    
    categoriesArray.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

// ========== INVOICE HISTORY ADVANCED FILTER FUNCTIONS ==========
function handleTimePeriodChange() {
    const period = document.getElementById('historyTimePeriod').value;
    const today = new Date();
    let fromDate, toDate;
    
    switch(period) {
        case 'today':
            fromDate = toDate = today;
            break;
        case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            fromDate = toDate = yesterday;
            break;
        case 'week':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            fromDate = startOfWeek;
            toDate = today;
            break;
        case 'last_week':
            const lastWeekStart = new Date(today);
            lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 7);
            const lastWeekEnd = new Date(lastWeekStart);
            lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
            fromDate = lastWeekStart;
            toDate = lastWeekEnd;
            break;
        case 'month':
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            fromDate = startOfMonth;
            toDate = today;
            break;
        case 'last_month':
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            fromDate = lastMonth;
            toDate = endOfLastMonth;
            break;
        case 'quarter':
            const quarter = Math.floor(today.getMonth() / 3);
            const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
            fromDate = startOfQuarter;
            toDate = today;
            break;
        case 'last_quarter':
            const lastQuarter = Math.floor((today.getMonth() - 3) / 3);
            const startOfLastQuarter = new Date(today.getFullYear(), lastQuarter * 3, 1);
            const endOfLastQuarter = new Date(today.getFullYear(), (lastQuarter + 1) * 3, 0);
            fromDate = startOfLastQuarter;
            toDate = endOfLastQuarter;
            break;
        case 'year':
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            fromDate = startOfYear;
            toDate = today;
            break;
        case 'last_year':
            const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
            const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31);
            fromDate = startOfLastYear;
            toDate = endOfLastYear;
            break;
        case 'all_time':
            document.getElementById('historyFromDate').value = '';
            document.getElementById('historyToDate').value = '';
            return;
        default:
            return;
    }
    
    document.getElementById('historyFromDate').value = formatDateForDateInput(fromDate);
    document.getElementById('historyToDate').value = formatDateForDateInput(toDate);
}

function formatDateForDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function updateTimePeriodToCustom() {
    document.getElementById('historyTimePeriod').value = 'custom';
}

// ========== UPDATED APPLY INVOICE FILTERS FUNCTION ==========
function applyInvoiceFilters() {
    const search = document.getElementById('historySearch').value.toLowerCase();
    const paymentStatus = document.getElementById('historyPaymentStatus').value;
    const category = document.getElementById('historyCategory').value;
    const fromDate = getDateInputValue('historyFromDate');
    const toDate = getDateInputValue('historyToDate');
    
    const invoices = JSON.parse(localStorage.getItem(`asptronics_invoices_${currentUser}`)) || [];
    let filteredInvoices = [...invoices];
    
    if (search) {
        filteredInvoices = filteredInvoices.filter(inv => 
            inv.id.toLowerCase().includes(search) || 
            inv.customer.toLowerCase().includes(search) ||
            (inv.customerPhone && inv.customerPhone.includes(search))
        );
    }
    
    if (paymentStatus) {
        filteredInvoices = filteredInvoices.filter(inv => inv.paymentStatus === paymentStatus);
    }
    
    if (category) {
        filteredInvoices = filteredInvoices.filter(inv => 
            inv.items.some(item => item.category === category)
        );
    }
    
    if (fromDate && isValidDate(fromDate) && toDate && isValidDate(toDate)) {
        filteredInvoices = filteredInvoices.filter(inv => {
            const invDate = inv.date.split('/').reverse().join('-');
            const from = fromDate.split('/').reverse().join('-');
            const to = toDate.split('/').reverse().join('-');
            return invDate >= from && invDate <= to;
        });
    }
    
    // Pass the category to both functions
    displayFilteredInvoices(filteredInvoices, category);
    showInvoiceSummaryStats(filteredInvoices, category);
}

// ========== UPDATED DISPLAY FILTERED INVOICES FUNCTION ==========
function displayFilteredInvoices(invoices, filterCategory) {
    const table = document.getElementById('invoicesTable');
    table.innerHTML = '';
    
    invoices.forEach((invoice, index) => {
        const row = table.insertRow();
        
        let statusBadge = '';
        if (invoice.paymentStatus === 'paid') {
            statusBadge = '<span style="color: green; font-weight: bold;">' + (currentLanguage === 'hi' ? 'पेड' : 'Paid') + '</span>';
        } else if (invoice.paymentStatus === 'partial') {
            statusBadge = `<span style="color: orange; font-weight: bold;">${currentLanguage === 'hi' ? 'आंशिक' : 'Partial'}</span>`;
        } else {
            statusBadge = '<span style="color: red; font-weight: bold;">' + (currentLanguage === 'hi' ? 'बकाया' : 'Pending') + '</span>';
        }
        
        // Calculate display amount based on filter
        let displayAmount = invoice.grandTotal;
        if (filterCategory) {
            // Calculate total only for items in the filtered category
            displayAmount = 0;
            invoice.items.forEach(item => {
                if (item.category === filterCategory) {
                    displayAmount += item.total;
                }
            });
        }
        
        row.innerHTML = `
            <td>${invoice.date}</td>
            <td><strong>${invoice.id}</strong></td>
            <td>${invoice.customer}</td>
            <td>₹${displayAmount.toFixed(2)}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-small btn-primary" onclick="viewInvoice('${invoice.id}')" title="${currentLanguage === 'hi' ? 'देखें' : 'View'}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-small btn-whatsapp" onclick="shareSavedInvoice('${invoice.id}')" title="WhatsApp">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <button class="btn btn-small btn-pdf" onclick="generateSavedInvoicePDF('${invoice.id}')" title="PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button class="btn btn-small btn-warning" onclick="startEditInvoice('${invoice.id}')" title="${currentLanguage === 'hi' ? 'एडिट' : 'Edit'}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="startDeleteInvoice('${invoice.id}')" title="${currentLanguage === 'hi' ? 'डिलीट' : 'Delete'}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
    });
    
    document.getElementById('invoiceCount').textContent = invoices.length;
}

// ========== UPDATED SHOW INVOICE SUMMARY STATS FUNCTION ==========
function showInvoiceSummaryStats(invoices, filterCategory) {
    const summaryStats = document.getElementById('invoiceSummaryStats');
    summaryStats.style.display = 'block';
    
    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let invoiceCount = 0;
    
    invoices.forEach(inv => {
        let categoryAmountInInvoice = 0;
        let invoiceTotal = inv.grandTotal;
        
        // Calculate total for filtered category only
        if (filterCategory) {
            inv.items.forEach(item => {
                if (item.category === filterCategory) {
                    categoryAmountInInvoice += item.total;
                }
            });
            invoiceCount++;
            totalAmount += categoryAmountInInvoice;
            
            // Calculate proportional payment for this category
            if (inv.paymentStatus === 'paid') {
                paidAmount += categoryAmountInInvoice;
            } else if (inv.paymentStatus === 'partial') {
                // Calculate ratio of category amount to total invoice amount
                const ratio = categoryAmountInInvoice / invoiceTotal;
                paidAmount += (inv.amountPaid || 0) * ratio;
                pendingAmount += (invoiceTotal - (inv.amountPaid || 0)) * ratio;
            } else {
                pendingAmount += categoryAmountInInvoice;
            }
        } else {
            // No category filter - show full invoice amounts
            invoiceCount++;
            totalAmount += invoiceTotal;
            
            if (inv.paymentStatus === 'paid') {
                paidAmount += invoiceTotal;
            } else if (inv.paymentStatus === 'partial') {
                paidAmount += (inv.amountPaid || 0);
                pendingAmount += (invoiceTotal - (inv.amountPaid || 0));
            } else {
                pendingAmount += invoiceTotal;
            }
        }
    });
    
    document.getElementById('filteredInvoiceCount').textContent = invoiceCount;
    document.getElementById('filteredInvoiceAmount').textContent = '₹' + totalAmount.toFixed(2);
    document.getElementById('filteredPaidAmount').textContent = '₹' + paidAmount.toFixed(2);
    document.getElementById('filteredPendingAmount').textContent = '₹' + pendingAmount.toFixed(2);
}

function resetInvoiceFilters() {
    document.getElementById('historySearch').value = '';
    document.getElementById('historyPaymentStatus').value = '';
    document.getElementById('historyCategory').value = '';
    document.getElementById('historyTimePeriod').value = 'today';
    document.getElementById('invoiceSummaryStats').style.display = 'none';
    
    handleTimePeriodChange();
    loadInvoices();
}

function exportFilteredInvoicesExcel() {
    const table = document.getElementById('invoicesTable');
    if (!table || table.rows.length === 0) {
        alert(currentLanguage === 'hi' ? 'एक्सपोर्ट करने के लिए कोई इनवॉइस नहीं है' : 'No invoices to export');
        return;
    }
    
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    const headerRow = [];
    table.querySelectorAll('th').forEach(th => {
        const text = th.textContent.trim();
        if (text && text !== 'एक्शन्स' && text !== 'Actions') {
            headerRow.push(text);
        }
    });
    csv.push(headerRow.join(','));
    
    for (let i = 0; i < rows.length; i++) {
        const row = [], cols = rows[i].querySelectorAll('td');
        
        for (let j = 0; j < cols.length - 1; j++) {
            const text = cols[j].textContent.replace(/<\/?[^>]+(>|$)/g, "").trim();
            row.push(`"${text}"`);
        }
        
        csv.push(row.join(','));
    }
    
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ASP_TRONICS_Invoices_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    alert(currentLanguage === 'hi' ? 'इनवॉइस Excel फॉर्मेट में एक्सपोर्ट हो गए!' : 'Invoices exported to Excel format!');
}

function exportFilteredInvoicesPDF() {
    const fromDate = getDateInputValue('historyFromDate');
    const toDate = getDateInputValue('historyToDate');
    const paymentStatus = document.getElementById('historyPaymentStatus').value;
    const category = document.getElementById('historyCategory').value;
    
    const invoices = JSON.parse(localStorage.getItem(`asptronics_invoices_${currentUser}`)) || [];
    let filteredInvoices = [...invoices];
    
    if (fromDate && isValidDate(fromDate) && toDate && isValidDate(toDate)) {
        filteredInvoices = filteredInvoices.filter(inv => {
            const invDate = inv.date.split('/').reverse().join('-');
            const from = fromDate.split('/').reverse().join('-');
            const to = toDate.split('/').reverse().join('-');
            return invDate >= from && invDate <= to;
        });
    }
    
    if (paymentStatus) {
        filteredInvoices = filteredInvoices.filter(inv => inv.paymentStatus === paymentStatus);
    }
    
    if (category) {
        filteredInvoices = filteredInvoices.filter(inv => 
            inv.items.some(item => item.category === category)
        );
    }
    
    if (filteredInvoices.length === 0) {
        alert(currentLanguage === 'hi' ? 'PDF बनाने के लिए कोई इनवॉइस नहीं है' : 'No invoices to create PDF');
        return;
    }
    
    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    
    // Calculate totals based on category filter
    filteredInvoices.forEach(inv => {
        let invoiceAmount = inv.grandTotal;
        if (category) {
            invoiceAmount = 0;
            inv.items.forEach(item => {
                if (item.category === category) {
                    invoiceAmount += item.total;
                }
            });
        }
        
        totalAmount += invoiceAmount;
        if (inv.paymentStatus === 'paid') {
            paidAmount += invoiceAmount;
        } else if (inv.paymentStatus === 'partial') {
            // Proportional calculation for category
            if (category) {
                const categoryAmount = invoiceAmount;
                const ratio = categoryAmount / inv.grandTotal;
                paidAmount += (inv.amountPaid || 0) * ratio;
                pendingAmount += (inv.grandTotal - (inv.amountPaid || 0)) * ratio;
            } else {
                paidAmount += (inv.amountPaid || 0);
                pendingAmount += (inv.grandTotal - (inv.amountPaid || 0));
            }
        } else {
            pendingAmount += invoiceAmount;
        }
    });
    
    let tableHTML = '<table border="1" style="width:100%; border-collapse:collapse; margin-top:15px; font-size:11px;">';
    tableHTML += '<thead><tr style="background:#f0f0f0;">';
    tableHTML += '<th style="padding:8px; border:1px solid #ddd; width:10%;">Date</th>';
    tableHTML += '<th style="padding:8px; border:1px solid #ddd; width:15%;">Invoice ID</th>';
    tableHTML += '<th style="padding:8px; border:1px solid #ddd; width:20%;">Customer</th>';
    tableHTML += '<th style="padding:8px; border:1px solid #ddd; width:10%; text-align:right;">Amount (₹)</th>';
    tableHTML += '<th style="padding:8px; border:1px solid #ddd; width:10%;">Status</th>';
    tableHTML += '</tr></thead><tbody>';
    
    filteredInvoices.forEach(inv => {
        let displayAmount = inv.grandTotal;
        if (category) {
            displayAmount = 0;
            inv.items.forEach(item => {
                if (item.category === category) {
                    displayAmount += item.total;
                }
            });
        }
        
        let statusText = inv.paymentStatus;
        if (currentLanguage === 'hi') {
            if (statusText === 'paid') statusText = 'पेड';
            else if (statusText === 'partial') statusText = 'आंशिक';
            else if (statusText === 'pending') statusText = 'बकाया';
        }
        
        tableHTML += '<tr>';
        tableHTML += `<td style="padding:6px; border:1px solid #ddd;">${inv.date}</td>`;
        tableHTML += `<td style="padding:6px; border:1px solid #ddd;">${inv.id}</td>`;
        tableHTML += `<td style="padding:6px; border:1px solid #ddd;">${inv.customer}</td>`;
        tableHTML += `<td style="padding:6px; border:1px solid #ddd; text-align:right;">₹${displayAmount.toFixed(2)}</td>`;
        tableHTML += `<td style="padding:6px; border:1px solid #ddd;">${statusText}</td>`;
        tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    
    let summaryHTML = `
        <div style="margin-top: 30px; border-top: 2px solid #1a237e; padding-top: 15px;">
            <h3 style="color: #1a237e; margin-bottom: 15px;">${currentLanguage === 'hi' ? 'इनवॉइस समरी' : 'Invoice Summary'}</h3>
            <table border="1" style="width:100%; border-collapse:collapse; margin-top:10px; font-size:12px;">
                <tr style="background:#e8f5e9;">
                    <td style="padding:8px; border:1px solid #ddd; font-weight:bold;">${currentLanguage === 'hi' ? 'कुल इनवॉइस' : 'Total Invoices'}</td>
                    <td style="padding:8px; border:1px solid #ddd; font-weight:bold; text-align:right;">${filteredInvoices.length}</td>
                </tr>
                <tr style="background:#e3f2fd;">
                    <td style="padding:8px; border:1px solid #ddd; font-weight:bold;">${currentLanguage === 'hi' ? 'कुल रकम' : 'Total Amount'}</td>
                    <td style="padding:8px; border:1px solid #ddd; font-weight:bold; text-align:right;">₹${totalAmount.toFixed(2)}</td>
                </tr>
                <tr style="background:#f1f8e9;">
                    <td style="padding:8px; border:1px solid #ddd; font-weight:bold;">${currentLanguage === 'hi' ? 'पेड रकम' : 'Paid Amount'}</td>
                    <td style="padding:8px; border:1px solid #ddd; font-weight:bold; text-align:right;">₹${paidAmount.toFixed(2)}</td>
                </tr>
                <tr style="background:#ffebee;">
                    <td style="padding:8px; border:1px solid #ddd; font-weight:bold;">${currentLanguage === 'hi' ? 'बकाया रकम' : 'Pending Amount'}</td>
                    <td style="padding:8px; border:1px solid #ddd; font-weight:bold; text-align:right;">₹${pendingAmount.toFixed(2)}</td>
                </tr>
            </table>
        </div>
    `;
    
    let filtersText = '';
    if (fromDate && toDate) {
        filtersText += `<div>${currentLanguage === 'hi' ? 'तारीख रेंज:' : 'Date Range:'} ${fromDate} ${currentLanguage === 'hi' ? 'से' : 'to'} ${toDate}</div>`;
    }
    if (paymentStatus) {
        let statusText = paymentStatus;
        if (currentLanguage === 'hi') {
            if (statusText === 'paid') statusText = 'पेड';
            else if (statusText === 'partial') statusText = 'आंशिक';
            else if (statusText === 'pending') statusText = 'बकाया';
        }
        filtersText += `<div>${currentLanguage === 'hi' ? 'पेमेंट स्टेटस:' : 'Payment Status:'} ${statusText}</div>`;
    }
    if (category) {
        filtersText += `<div>${currentLanguage === 'hi' ? 'कैटेगरी:' : 'Category:'} ${category}</div>`;
    }
    
    const win = window.open('', '_blank');
    win.document.write(`
        <html>
        <head>
            <title>ASP TRONICS v1.0.0 - ${currentLanguage === 'hi' ? 'इनवॉइस रिपोर्ट' : 'Invoice Report'}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    padding: 20px; 
                    color: #333;
                }
                .header { 
                    margin-bottom: 20px; 
                    border-bottom: 2px solid #1a237e;
                    padding-bottom: 15px;
                }
                h1 { 
                    color: #1a237e; 
                    margin: 0;
                    font-size: 24px;
                }
                h2 {
                    color: #1a237e;
                    margin: 10px 0;
                    font-size: 18px;
                }
                .filters { 
                    background: #f8f9fa; 
                    padding: 10px; 
                    border-radius: 5px; 
                    margin-bottom: 15px; 
                    font-size: 12px;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 15px; 
                }
                th, td { 
                    border: 1px solid #ddd; 
                    padding: 8px; 
                    text-align: left; 
                }
                th { 
                    background-color: #f2f2f2; 
                    font-weight: bold;
                }
                .summary { 
                    margin-top: 30px; 
                }
                .total-row {
                    font-weight: bold;
                    background-color: #f9f9f9;
                }
                @media print {
                    body { 
                        padding: 10px; 
                    }
                    .no-print { 
                        display: none !important; 
                    }
                }
            </style>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
            <\/script>
        </head>
        <body>
            <div class="header">
                <h1>ASP TRONICS v1.0.0</h1>
                <h2>${currentLanguage === 'hi' ? 'इनवॉइस रिपोर्ट' : 'Invoice Report'}</h2>
                <div class="filters">
                    <div><strong>${currentLanguage === 'hi' ? 'फ़िल्टर्स:' : 'Filters:'}</strong></div>
                    ${filtersText}
                </div>
            </div>
            ${tableHTML}
            ${summaryHTML}
            <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
                ${currentLanguage === 'hi' ? 'बनाया गया:' : 'Generated on:'} ${new Date().toLocaleString('en-IN')}
            </div>
        </body>
        </html>
    `);
    win.document.close();
}

function printFilteredInvoices() {
    exportFilteredInvoicesPDF();
}

// ========== GST FUNCTIONS ==========
function toggleGST() {
    const gstPercent = document.getElementById('gstPercent');
    const currentValue = parseFloat(gstPercent.value) || 0;
    
    if (currentValue > 0) {
        gstPercent.value = 0;
    } else {
        gstPercent.value = 18;
    }
    
    calculateInvoice();
}

function onGSTPercentChange() {
    const gstPercent = parseFloat(document.getElementById('gstPercent').value) || 0;
    
    if (gstPercent < 0) {
        document.getElementById('gstPercent').value = 0;
    } else if (gstPercent > 100) {
        document.getElementById('gstPercent').value = 100;
    }
    
    calculateInvoice();
}

// ========== AUTO PAYMENT STATUS FUNCTION ==========
function autoSetPaymentStatus() {
    const grandTotal = parseFloat(document.getElementById("invoiceGrandTotal")?.textContent) || 0;
    
    if (invoiceItems.length === 0 || grandTotal === 0) {
        if (document.getElementById('statusPending')) {
            document.getElementById('statusPending').checked = true;
            setPaymentStatus('pending');
        }
    } else {
        if (document.getElementById('statusPaid')) {
            document.getElementById('statusPaid').checked = true;
            setPaymentStatus('paid');
            
            const amountPaidSection = document.getElementById('amountPaidSection');
            if (amountPaidSection) {
                amountPaidSection.style.display = 'none';
            }
        }
    }
}

// ========== UPDATED QR CODE FUNCTIONS ==========
function generateUPIQRCode() {
    const upi = document.getElementById("companyUPI").value.trim();
    const box = document.getElementById("upiQRPreview");

    if (!upi) {
        alert(currentLanguage === 'hi' ? 'कृपया UPI ID डालें' : 'Please enter UPI ID');
        return;
    }

    box.innerHTML = '<canvas id="companyUPIQR"></canvas>';
    
    const upiURL = `upi://pay?pa=${upi}&pn=${encodeURIComponent('Payment')}&cu=INR`;

    try {
        new QRious({
            element: document.getElementById("companyUPIQR"),
            value: upiURL,
            size: 200,
            padding: 20
        });
        
        const upiText = document.createElement('p');
        upiText.style.marginTop = '8px';
        upiText.style.fontSize = '12px';
        upiText.textContent = upi;
        box.appendChild(upiText);
        
    } catch (error) {
        console.error('QR generation error:', error);
        alert(currentLanguage === 'hi' ? 'QR कोड जनरेट करने में त्रुटि' : 'Error generating QR code');
    }
}

function generateInvoiceQRCode() {
    const companyUPI = document.getElementById("companyUPI").value.trim();
    const invoiceUPI = document.getElementById("invoiceUPIID").value.trim();
    const upi = invoiceUPI || companyUPI;
    const box = document.getElementById("invoiceQRCode");
    
    let amount = parseFloat(document.getElementById("invoiceGrandTotal").textContent) || 0;
    
    const paymentStatus = document.querySelector('input[name="paymentStatus"]:checked').value;
    if (paymentStatus === 'partial') {
        const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
        const remaining = amount - amountPaid;
        if (remaining > 0) {
            amount = remaining;
        } else {
            alert(currentLanguage === 'hi' ? 'QR कोड के लिए कोई बची रकम नहीं है' : 'No remaining amount for QR code');
            return;
        }
    }
    
    if (!upi) {
        alert(currentLanguage === 'hi' ? 'UPI ID उपलब्ध नहीं है' : 'UPI ID not available');
        return;
    }
    
    if (!amount || isNaN(amount) || amount <= 0) {
        alert(currentLanguage === 'hi' ? 'Amount गलत है' : 'Invalid amount');
        return;
    }
    
    box.innerHTML = '<canvas id="invoiceUPIQR"></canvas>';
    
    const upiURL = `upi://pay?pa=${upi}&pn=${encodeURIComponent('Invoice Payment')}&am=${amount.toFixed(2)}&cu=INR`;

    try {
        new QRious({
            element: document.getElementById("invoiceUPIQR"),
            value: upiURL,
            size: 200,
            padding: 20
        });
        
        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = `
            <p style="margin-top: 8px; font-size: 12px; color: #666;">
                ${currentLanguage === 'hi' ? 'रकम:' : 'Amount:'} ₹${amount.toFixed(2)}<br>
                UPI: ${upi}
            </p>
        `;
        box.appendChild(infoDiv);
        
        document.getElementById('invoiceUPISection').style.display = 'block';
        
    } catch (error) {
        console.error('QR generation error:', error);
        alert(currentLanguage === 'hi' ? 'QR कोड जनरेट करने में त्रुटि' : 'Error generating QR code');
    }
}

function loadCompanyUPI() {
    const company = JSON.parse(localStorage.getItem('asptronics_company')) || {};
    if (company.upi) {
        document.getElementById('invoiceUPIID').value = company.upi;
    }
}

function downloadQRCode() {
    const qrContainer = document.getElementById('invoiceQRCode');
    const canvas = qrContainer.querySelector('canvas');
    
    if (!canvas) {
        alert(currentLanguage === 'hi' ? 'कृपया पहले QR कोड जनरेट करें' : 'Please generate QR code first');
        return;
    }
    
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `Payment_QR_${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function copyUPIID() {
    const company = JSON.parse(localStorage.getItem('asptronics_company')) || {};
    const customUPI = document.getElementById('invoiceUPIID').value.trim();
    const upiToCopy = customUPI || company.upi;
    
    if (!upiToCopy) {
        alert(currentLanguage === 'hi' ? 'कॉपी करने के लिए कोई UPI ID उपलब्ध नहीं है' : 'No UPI ID available to copy');
        return;
    }
    
    const tempInput = document.createElement('input');
    tempInput.value = upiToCopy;
    document.body.appendChild(tempInput);
    tempInput.select();
    tempInput.setSelectionRange(0, 99999);
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            alert((currentLanguage === 'hi' ? 'UPI ID क्लिपबोर्ड में कॉपी हो गई: ' : 'UPI ID copied to clipboard: ') + upiToCopy);
        } else {
            throw new Error('Copy command failed');
        }
    } catch (err) {
        console.error('Failed to copy: ', err);
        alert((currentLanguage === 'hi' ? 'UPI ID कॉपी करने में असफल। मैन्युअल कॉपी करें: ' : 'Failed to copy UPI ID. Please copy manually: ') + upiToCopy);
    }
    
    document.body.removeChild(tempInput);
}

// ========== INITIALIZATION ==========
function init() {
  initLanguage();
  loadCategories();
  
  users = JSON.parse(localStorage.getItem('asptronics_users')) || {};
  
  if (!users.admin) {
    users.admin = {
      password: 'admin123',
      role: 'admin',
      created: new Date().toISOString()
    };
    localStorage.setItem('asptronics_users', JSON.stringify(users));
  }
  
  if (!localStorage.getItem('asptronics_company')) {
    const defaultCompany = {
      name: 'ASP TRONICS',
      phone: '',
      address: '',
      gst: '',
      email: '',
      upi: '',
      logo: null,
      editPassword: '9411704071'
    };
    localStorage.setItem('asptronics_company', JSON.stringify(defaultCompany));
  }
  
  // Set today's date in YYYY-MM-DD format for date inputs
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayYYYYMMDD = `${year}-${month}-${day}`;
  
  document.getElementById('invoiceDate').value = todayYYYYMMDD;
  document.getElementById('reportFromDate').value = todayYYYYMMDD;
  document.getElementById('reportToDate').value = todayYYYYMMDD;
  document.getElementById('historyFromDate').value = todayYYYYMMDD;
  document.getElementById('historyToDate').value = todayYYYYMMDD;
  
  setupProductSelect();
  loadCompanyUPI();
  autoSetPaymentStatus();
  addMissingEventListeners();
  loadUsers();
  handleTimePeriodChange();
}

// ========== SIMPLIFIED DASHBOARD FUNCTION ==========
function loadDashboard() {
  const today = new Date().toLocaleDateString('en-IN');
  const invoices = JSON.parse(localStorage.getItem(`asptronics_invoices_${currentUser}`)) || [];
  const customers = JSON.parse(localStorage.getItem(`asptronics_customers_${currentUser}`)) || [];
  const products = JSON.parse(localStorage.getItem(`asptronics_products_${currentUser}`)) || [];

  const todayInvoices = invoices.filter(inv => inv.date === today);

  let totalRevenue = 0;
  todayInvoices.forEach(inv => {
    totalRevenue += inv.grandTotal;
  });

  const todayCustomers = [...new Set(todayInvoices.map(inv => inv.customer))];
  
  const todayProductCodes = new Set();
  todayInvoices.forEach(inv => {
    inv.items.forEach(item => {
      if (item.code && item.code !== 'CUSTOM') {
        todayProductCodes.add(item.code);
      }
    });
  });

  document.getElementById('totalInvoices').textContent = todayInvoices.length;
  document.getElementById('totalRevenue').textContent = '₹' + totalRevenue.toFixed(2);
  document.getElementById('totalCustomers').textContent = todayCustomers.length;
  document.getElementById('totalProducts').textContent = todayProductCodes.size;
}

// ========== MISSING FUNCTIONS ==========
function printTodayReport() {
  const today = new Date().toLocaleDateString('en-IN');
  const invoices = JSON.parse(localStorage.getItem(`asptronics_invoices_${currentUser}`)) || [];
  const todayInvoices = invoices.filter(inv => inv.date === today);
  
  if (todayInvoices.length === 0) {
    alert(currentLanguage === 'hi' ? 'आज के लिए कोई इनवॉइस नहीं है' : 'No invoices for today');
    return;
  }
  
  let totalAmount = 0;
  todayInvoices.forEach(inv => totalAmount += inv.grandTotal);
  
  const reportWindow = window.open('', '_blank');
  reportWindow.document.write(`
    <html>
    <head>
      <title>Today's Report - ${today}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #1a237e; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total { font-weight: bold; color: #1a237e; }
      </style>
    </head>
    <body>
      <h1>Today's Sales Report (${today})</h1>
      <p><strong>Total Invoices:</strong> ${todayInvoices.length}</p>
      <p><strong>Total Revenue:</strong> ₹${totalAmount.toFixed(2)}</p>
      <table>
        <tr>
          <th>Invoice ID</th>
          <th>Customer</th>
          <th>Amount</th>
          <th>Payment Status</th>
        </tr>
        ${todayInvoices.map(inv => `
          <tr>
            <td>${inv.id}</td>
            <td>${inv.customer}</td>
            <td>₹${inv.grandTotal.toFixed(2)}</td>
            <td>${inv.paymentStatus}</td>
          </tr>
        `).join('')}
      </table>
      <p style="margin-top: 20px;">Generated by ASP TRONICS v1.0.0</p>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      <\/script>
    </body>
    </html>
  `);
  reportWindow.document.close();
}

function downloadBackup() {
  const backupData = {
    users: JSON.parse(localStorage.getItem('asptronics_users')) || {},
    company: JSON.parse(localStorage.getItem('asptronics_company')) || {},
    products: JSON.parse(localStorage.getItem(`asptronics_products_${currentUser}`)) || [],
    customers: JSON.parse(localStorage.getItem(`asptronics_customers_${currentUser}`)) || [],
    invoices: JSON.parse(localStorage.getItem(`asptronics_invoices_${currentUser}`)) || [],
    categories: JSON.parse(localStorage.getItem('asptronics_categories')) || [],
    timestamp: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(backupData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `ASP_TRONICS_Backup_${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  alert(currentLanguage === 'hi' ? 'बैकअप सफलतापूर्वक डाउनलोड हो गया!' : 'Backup downloaded successfully!');
}

function generateSavedInvoicePDF(invoiceId) {
  const invoices = JSON.parse(localStorage.getItem(`asptronics_invoices_${currentUser}`)) || [];
  const invoice = invoices.find(inv => inv.id === invoiceId);
  
  if (!invoice) {
    alert(currentLanguage === 'hi' ? 'इनवॉइस नहीं मिला' : 'Invoice not found');
    return;
  }
  
  const company = JSON.parse(localStorage.getItem('asptronics_company')) || {};
  
  let pdfContent = `
    <html>
    <head>
      <title>Invoice ${invoice.id}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { border-bottom: 2px solid #1a237e; padding-bottom: 15px; margin-bottom: 20px; }
        h1 { color: #1a237e; margin: 0; }
        h2 { color: #1a237e; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background-color: #f2f2f2; }
        .total { font-weight: bold; color: #1a237e; font-size: 18px; }
        .summary { margin-top: 20px; border-top: 2px solid #333; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${company.name || 'ASP TRONICS'}</h1>
        <p>${company.address || ''}</p>
        <p>${company.phone ? 'Phone: ' + company.phone : ''} ${company.gst ? ' | GST: ' + company.gst : ''}</p>
        <h2>INVOICE</h2>
        <p><strong>Invoice #:</strong> ${invoice.id}</p>
        <p><strong>Date:</strong> ${invoice.date}</p>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <h3>Bill To:</h3>
          <p><strong>${invoice.customer}</strong></p>
        </div>
        <div>
          <h3>Payment Details:</h3>
          <p><strong>Method:</strong> ${invoice.paymentMethod}</p>
          <p><strong>Status:</strong> ${invoice.paymentStatus}</p>
          ${invoice.paymentStatus === 'partial' ? `
            <p><strong>Amount Paid:</strong> ₹${invoice.amountPaid.toFixed(2)}</p>
            <p><strong>Remaining:</strong> ₹${(invoice.grandTotal - invoice.amountPaid).toFixed(2)}</p>
          ` : ''}
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Item Description</th>
            <th>Qty</th>
            <th>Rate (₹)</th>
            <th>Amount (₹)</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>₹${item.rate.toFixed(2)}</td>
              <td>₹${item.total.toFixed(2)}</td>
              <td>${item.category || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="summary">
        <p><strong>Subtotal:</strong> ₹${invoice.subtotal.toFixed(2)}</p>
        ${invoice.gstPercent > 0 ? `<p><strong>GST (${invoice.gstPercent}%):</strong> ₹${invoice.gstAmount.toFixed(2)}</p>` : ''}
        <p class="total"><strong>Grand Total:</strong> ₹${invoice.grandTotal.toFixed(2)}</p>
      </div>
      
      <div style="margin-top: 30px; text-align: center;">
        <p>Thank you for your business!</p>
        <p style="font-size: 12px; color: #666;">Generated by ASP TRONICS Billing System v1.0.0</p>
      </div>
    </body>
    </html>
  `;
  
  const win = window.open('', '_blank');
  win.document.write(pdfContent);
  win.document.close();
  
  setTimeout(() => {
    win.print();
  }, 500);
}

function exportProductsPDF() {
  const products = JSON.parse(localStorage.getItem(`asptronics_products_${currentUser}`)) || [];
  
  if (products.length === 0) {
    alert(currentLanguage === 'hi' ? 'PDF बनाने के लिए कोई प्रोडक्ट नहीं है' : 'No products to create PDF');
    return;
  }
  
  let content = `
    <h2>ASP TRONICS v1.0.0 - ${currentLanguage === 'hi' ? 'प्रोडक्ट्स रिपोर्ट' : 'Products Report'}</h2>
    <p>${currentLanguage === 'hi' ? 'बनाया गया:' : 'Generated on:'} ${new Date().toLocaleDateString('en-IN')}</p>
    <p>${currentLanguage === 'hi' ? 'कुल प्रोडक्ट्स:' : 'Total Products:'} ${products.length}</p>
    <table border="1" style="width:100%; border-collapse:collapse; margin-top:15px; font-size:12px;">
      <thead>
        <tr>
          <th style="padding:6px;">${currentLanguage === 'hi' ? 'प्रोडक्ट कोड' : 'Product Code'}</th>
          <th style="padding:6px;">${currentLanguage === 'hi' ? 'प्रोडक्ट नाम' : 'Product Name'}</th>
          <th style="padding:6px;">${currentLanguage === 'hi' ? 'कैटेगरी' : 'Category'}</th>
          <th style="padding:6px;">${currentLanguage === 'hi' ? 'कीमत (₹)' : 'Price (₹)'}</th>
          <th style="padding:6px;">${currentLanguage === 'hi' ? 'स्टॉक' : 'Stock'}</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  products.forEach(product => {
    content += `
      <tr>
        <td style="padding:6px;">${product.code || '-'}</td>
        <td style="padding:6px;">${product.name}</td>
        <td style="padding:6px;">${product.category || '-'}</td>
        <td style="padding:6px;">₹${parseFloat(product.price).toFixed(2)}</td>
        <td style="padding:6px;">${product.stock || 0}</td>
      </tr>
    `;
  });
  
  content += `
      </tbody>
    </table>
  `;
  
  const win = window.open('', '_blank');
  win.document.write(`
    <html>
      <head>
        <title>ASP TRONICS v1.0.0 - ${currentLanguage === 'hi' ? 'प्रोडक्ट्स रिपोर्ट' : 'Products Report'}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 15px; font-size: 12px; }
          h2 { color: #1a237e; font-size: 18px; }
          table { width: 100%; border-collapse: collapse; }
          th { background-color: #1a237e; color: white; }
        </style>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        <\/script>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);
  win.document.close();
}

function shareInvoice() {
  if (invoiceItems.length === 0) {
    alert(currentLanguage === 'hi' ? 'कृपया पहले इनवॉइस में आइटम्स जोड़ें' : 'Please add items to invoice first');
    return;
  }
  
  const company = JSON.parse(localStorage.getItem('asptronics_company')) || {};
  const customerName = document.getElementById('invoiceCustomerName').value || 
                      document.getElementById('invoiceCustomerSelect').value || 
                      (currentLanguage === 'hi' ? 'वॉक-इन कस्टमर' : 'Walk-in Customer');
  const invoiceDate = getDateInputValue('invoiceDate') || new Date().toLocaleDateString('en-IN');
  const grandTotal = parseFloat(document.getElementById('invoiceGrandTotal').textContent) || 0;
  
  let shareText = `*Invoice Details*\n\n`;
  shareText += `*From:* ${company.name || 'ASP TRONICS'}\n`;
  shareText += `*To:* ${customerName}\n`;
  shareText += `*Date:* ${invoiceDate}\n`;
  shareText += `*Total Amount:* ₹${grandTotal.toFixed(2)}\n\n`;
  shareText += `*Items:*\n`;
  
  invoiceItems.forEach((item, index) => {
    shareText += `${index + 1}. ${item.name} - ${item.quantity} x ₹${item.rate.toFixed(2)} = ₹${item.total.toFixed(2)}\n`;
  });
  
  shareText += `\n*Grand Total:* ₹${grandTotal.toFixed(2)}\n`;
  shareText += `\nGenerated by ASP TRONICS v1.0.0`;
  
  const encodedText = encodeURIComponent(shareText);
  window.open(`https://wa.me/?text=${encodedText}`, '_blank');
}

function shareSavedInvoice(invoiceId) {
  const invoices = JSON.parse(localStorage.getItem(`asptronics_invoices_${currentUser}`)) || [];
  const invoice = invoices.find(inv => inv.id === invoiceId);
  
  if (!invoice) {
    alert(currentLanguage === 'hi' ? 'इनवॉइस नहीं मिला' : 'Invoice not found');
    return;
  }
  
  const company = JSON.parse(localStorage.getItem('asptronics_company')) || {};
  
  let shareText = `*Invoice Details*\n\n`;
  shareText += `*Invoice ID:* ${invoice.id}\n`;
  shareText += `*From:* ${company.name || 'ASP TRONICS'}\n`;
  shareText += `*To:* ${invoice.customer}\n`;
  shareText += `*Date:* ${invoice.date}\n`;
  shareText += `*Total Amount:* ₹${invoice.grandTotal.toFixed(2)}\n`;
  shareText += `*Payment Status:* ${invoice.paymentStatus}\n\n`;
  
  if (invoice.paymentStatus === 'partial') {
    shareText += `*Amount Paid:* ₹${invoice.amountPaid.toFixed(2)}\n`;
    shareText += `*Remaining:* ₹${(invoice.grandTotal - invoice.amountPaid).toFixed(2)}\n\n`;
  }
  
  shareText += `*Items:*\n`;
  
  invoice.items.forEach((item, index) => {
    shareText += `${index + 1}. ${item.name} - ${item.quantity} x ₹${item.rate.toFixed(2)} = ₹${item.total.toFixed(2)}\n`;
  });
  
  shareText += `\n*Grand Total:* ₹${invoice.grandTotal.toFixed(2)}\n`;
  shareText += `\nGenerated by ASP TRONICS v1.0.0`;
  
  const encodedText = encodeURIComponent(shareText);
  window.open(`https://wa.me/?text=${encodedText}`, '_blank');
}

// ========== TOGGLE REPORTS FUNCTION ==========
function toggleReports() {
  const container = document.getElementById('reports-container');
  const chevron = document.getElementById('reports-chevron');
  if (container.style.display === 'none') {
    container.style.display = 'block';
    chevron.className = 'fas fa-chevron-up';
  } else {
    container.style.display = 'none';
    chevron.className = 'fas fa-chevron-down';
  }
}

function generateReport() {
  const fromDate = getDateInputValue('reportFromDate');
  const toDate = getDateInputValue('reportToDate');
  const reportType = document.getElementById('reportType').value;
  
  if (!isValidDate(fromDate) || !isValidDate(toDate)) {
    alert(currentLanguage === 'hi' ? 'कृपया सही तारीख फॉर्मेट में डालें' : 'Please enter valid dates');
    return;
  }
  
  const invoices = JSON.parse(localStorage.getItem(`asptronics_invoices_${currentUser}`)) || [];
  const products = JSON.parse(localStorage.getItem(`asptronics_products_${currentUser}`)) || [];
  const customers = JSON.parse(localStorage.getItem(`asptronics_customers_${currentUser}`)) || [];
  
  const filteredInvoices = invoices.filter(inv => {
    const invDate = inv.date.split('/').reverse().join('-');
    const from = fromDate.split('/').reverse().join('-');
    const to = toDate.split('/').reverse().join('-');
    return invDate >= from && invDate <= to;
  });
  
  let reportContent = '';
  
  switch(reportType) {
    case 'sales':
      reportContent = generateSalesReport(filteredInvoices);
      break;
    case 'payment':
      reportContent = generatePaymentReport(filteredInvoices);
      break;
    case 'customer':
      reportContent = generateCustomerReport(filteredInvoices, customers);
      break;
    case 'product':
      reportContent = generateProductReport(filteredInvoices, products);
      break;
    case 'stock':
      reportContent = generateStockReport(products);
      break;
  }
  
  document.getElementById('reportResults').innerHTML = reportContent;
  
  const container = document.getElementById('reports-container');
  const chevron = document.getElementById('reports-chevron');
  if (container.style.display === 'none') {
    container.style.display = 'block';
    chevron.className = 'fas fa-chevron-up';
  }
}

function generateSalesReport(invoices) {
  let totalAmount = 0;
  let paidAmount = 0;
  let pendingAmount = 0;
  
  invoices.forEach(inv => {
    totalAmount += inv.grandTotal;
    if (inv.paymentStatus === 'paid') {
      paidAmount += inv.grandTotal;
    } else if (inv.paymentStatus === 'pending') {
      pendingAmount += inv.grandTotal;
    }
  });
  
  return `
    <div style="background: white; padding: 15px; border-radius: var(--radius); box-shadow: var(--shadow);">
      <h4 style="color: var(--primary); margin-bottom: 15px;">${currentLanguage === 'hi' ? 'सेल्स रिपोर्ट' : 'Sales Report'}</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
        <div style="background: #e8f5e9; padding: 15px; border-radius: var(--radius);">
          <div style="font-size: 24px; font-weight: bold; color: #2e7d32;">${invoices.length}</div>
          <div style="font-size: 12px; color: #666;">${currentLanguage === 'hi' ? 'कुल इनवॉइस' : 'Total Invoices'}</div>
        </div>
        <div style="background: #e3f2fd; padding: 15px; border-radius: var(--radius);">
          <div style="font-size: 24px; font-weight: bold; color: #1565c0;">₹${totalAmount.toFixed(2)}</div>
          <div style="font-size: 12px; color: #666;">${currentLanguage === 'hi' ? 'कुल सेल्स' : 'Total Sales'}</div>
        </div>
        <div style="background: #f1f8e9; padding: 15px; border-radius: var(--radius);">
          <div style="font-size: 24px; font-weight: bold; color: #4caf50;">₹${paidAmount.toFixed(2)}</div>
          <div style="font-size: 12px; color: #666;">${currentLanguage === 'hi' ? 'पेड रकम' : 'Paid Amount'}</div>
        </div>
        <div style="background: #ffebee; padding: 15px; border-radius: var(--radius);">
          <div style="font-size: 24px; font-weight: bold; color: #c62828;">₹${pendingAmount.toFixed(2)}</div>
          <div style="font-size: 12px; color: #666;">${currentLanguage === 'hi' ? 'बकाया रकम' : 'Pending Amount'}</div>
        </div>
      </div>
      <table class="compact-table">
        <thead>
          <tr>
            <th>${currentLanguage === 'hi' ? 'तारीख' : 'Date'}</th>
            <th>${currentLanguage === 'hi' ? 'इनवॉइस ID' : 'Invoice ID'}</th>
            <th>${currentLanguage === 'hi' ? 'कस्टमर' : 'Customer'}</th>
            <th>${currentLanguage === 'hi' ? 'रकम' : 'Amount'}</th>
            <th>${currentLanguage === 'hi' ? 'स्टेटस' : 'Status'}</th>
          </tr>
        </thead>
        <tbody>
          ${invoices.map(inv => `
            <tr>
              <td>${inv.date}</td>
              <td>${inv.id}</td>
              <td>${inv.customer}</td>
              <td>₹${inv.grandTotal.toFixed(2)}</td>
              <td>${inv.paymentStatus}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function generatePaymentReport(invoices) {
  const paymentMethods = {};
  
  invoices.forEach(inv => {
    if (!paymentMethods[inv.paymentMethod]) {
      paymentMethods[inv.paymentMethod] = { count: 0, amount: 0 };
    }
    paymentMethods[inv.paymentMethod].count++;
    paymentMethods[inv.paymentMethod].amount += inv.grandTotal;
  });
  
  return `
    <div style="background: white; padding: 15px; border-radius: var(--radius); box-shadow: var(--shadow);">
      <h4 style="color: var(--primary); margin-bottom: 15px;">${currentLanguage === 'hi' ? 'पेमेंट रिपोर्ट' : 'Payment Report'}</h4>
      <table class="compact-table">
        <thead>
          <tr>
            <th>${currentLanguage === 'hi' ? 'पेमेंट मेथड' : 'Payment Method'}</th>
            <th>${currentLanguage === 'hi' ? 'इनवॉइस काउंट' : 'Invoice Count'}</th>
            <th>${currentLanguage === 'hi' ? 'कुल रकम' : 'Total Amount'}</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(paymentMethods).map(([method, data]) => `
            <tr>
              <td>${method}</td>
              <td>${data.count}</td>
              <td>₹${data.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function generateCustomerReport(invoices, customers) {
  const customerSales = {};
  
  invoices.forEach(inv => {
    if (!customerSales[inv.customer]) {
      customerSales[inv.customer] = { count: 0, amount: 0 };
    }
    customerSales[inv.customer].count++;
    customerSales[inv.customer].amount += inv.grandTotal;
  });
  
  return `
    <div style="background: white; padding: 15px; border-radius: var(--radius); box-shadow: var(--shadow);">
      <h4 style="color: var(--primary); margin-bottom: 15px;">${currentLanguage === 'hi' ? 'कस्टमर रिपोर्ट' : 'Customer Report'}</h4>
      <table class="compact-table">
        <thead>
          <tr>
            <th>${currentLanguage === 'hi' ? 'कस्टमर' : 'Customer'}</th>
            <th>${currentLanguage === 'hi' ? 'इनवॉइस काउंट' : 'Invoice Count'}</th>
            <th>${currentLanguage === 'hi' ? 'कुल रकम' : 'Total Amount'}</th>
            <th>${currentLanguage === 'hi' ? 'औसत रकम' : 'Average Amount'}</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(customerSales).map(([customer, data]) => `
            <tr>
              <td>${customer}</td>
              <td>${data.count}</td>
              <td>₹${data.amount.toFixed(2)}</td>
              <td>₹${(data.amount / data.count).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function generateProductReport(invoices, products) {
  const productSales = {};
  
  invoices.forEach(inv => {
    inv.items.forEach(item => {
      if (!productSales[item.name]) {
        productSales[item.name] = { quantity: 0, amount: 0 };
      }
      productSales[item.name].quantity += item.quantity;
      productSales[item.name].amount += item.total;
    });
  });
  
  return `
    <div style="background: white; padding: 15px; border-radius: var(--radius); box-shadow: var(--shadow);">
      <h4 style="color: var(--primary); margin-bottom: 15px;">${currentLanguage === 'hi' ? 'प्रोडक्ट सेल्स रिपोर्ट' : 'Product Sales Report'}</h4>
      <table class="compact-table">
        <thead>
          <tr>
            <th>${currentLanguage === 'hi' ? 'प्रोडक्ट' : 'Product'}</th>
            <th>${currentLanguage === 'hi' ? 'कुल मात्रा' : 'Total Quantity'}</th>
            <th>${currentLanguage === 'hi' ? 'कुल रकम' : 'Total Amount'}</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(productSales).map(([product, data]) => `
            <tr>
              <td>${product}</td>
              <td>${data.quantity}</td>
              <td>₹${data.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function generateStockReport(products) {
  let lowStockCount = 0;
  let outOfStockCount = 0;
  
  products.forEach(product => {
    if (product.stock <= 0) outOfStockCount++;
    else if (product.stock <= 10) lowStockCount++;
  });
  
  return `
    <div style="background: white; padding: 15px; border-radius: var(--radius); box-shadow: var(--shadow);">
      <h4 style="color: var(--primary); margin-bottom: 15px;">${currentLanguage === 'hi' ? 'स्टॉक रिपोर्ट' : 'Stock Report'}</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
        <div style="background: #e3f2fd; padding: 15px; border-radius: var(--radius);">
          <div style="font-size: 24px; font-weight: bold; color: #1565c0;">${products.length}</div>
          <div style="font-size: 12px; color: #666;">${currentLanguage === 'hi' ? 'कुल प्रोडक्ट्स' : 'Total Products'}</div>
        </div>
        <div style="background: #fff3e0; padding: 15px; border-radius: var(--radius);">
          <div style="font-size: 24px; font-weight: bold; color: #ef6c00;">${lowStockCount}</div>
          <div style="font-size: 12px; color: #666;">${currentLanguage === 'hi' ? 'कम स्टॉक' : 'Low Stock'}</div>
        </div>
        <div style="background: #ffebee; padding: 15px; border-radius: var(--radius);">
          <div style="font-size: 24px; font-weight: bold; color: #c62828;">${outOfStockCount}</div>
          <div style="font-size: 12px; color: #666;">${currentLanguage === 'hi' ? 'स्टॉक खत्म' : 'Out of Stock'}</div>
        </div>
      </div>
      <table class="compact-table">
        <thead>
          <tr>
            <th>${currentLanguage === 'hi' ? 'प्रोडक्ट कोड' : 'Product Code'}</th>
            <th>${currentLanguage === 'hi' ? 'प्रोडक्ट नाम' : 'Product Name'}</th>
            <th>${currentLanguage === 'hi' ? 'स्टॉक' : 'Stock'}</th>
            <th>${currentLanguage === 'hi' ? 'स्टेटस' : 'Status'}</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(product => `
            <tr>
              <td>${product.code || '-'}</td>
              <td>${product.name}</td>
              <td>${product.stock || 0}</td>
              <td>
                ${product.stock > 10 ? 
                  '<span style="color: green;">' + (currentLanguage === 'hi' ? 'पर्याप्त' : 'Adequate') + '</span>' : 
                  product.stock > 0 ? 
                  '<span style="color: orange;">' + (currentLanguage === 'hi' ? 'कम' : 'Low') + '</span>' : 
                  '<span style="color: red;">' + (currentLanguage === 'hi' ? 'खत्म' : 'Out') + '</span>'
                }
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function exportReport() {
  const reportContent = document.getElementById('reportResults').innerHTML;
  if (!reportContent) {
    alert(currentLanguage === 'hi' ? 'कृपया पहले रिपोर्ट जनरेट करें' : 'Please generate a report first');
    return;
  }
  
  const table = document.getElementById('reportResults').querySelector('table');
  if (!table) {
    alert(currentLanguage === 'hi' ? 'एक्सपोर्ट करने के लिए कोई टेबल नहीं मिली' : 'No table found to export');
    return;
  }
  
  let csv = [];
  const rows = table.querySelectorAll('tr');
  
  for (let i = 0; i < rows.length; i++) {
    const row = [], cols = rows[i].querySelectorAll('td, th');
    
    for (let j = 0; j < cols.length; j++) {
      row.push(cols[j].innerText);
    }
    
    csv.push(row.join(','));
  }
  
  const csvContent = csv.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `ASP_TRONICS_Report_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

function exportReportPDF() {
  const reportContent = document.getElementById('reportResults').innerHTML;
  if (!reportContent) {
        alert(currentLanguage === 'hi' ? 'कृपया पहले रिपोर्ट जनरेट करें' : 'Please generate a report first');
        return;
    }

    const fromDate = getDateInputValue('reportFromDate');
    const toDate = getDateInputValue('reportToDate');
    const reportType = document.getElementById('reportType').value;

    const reportTypes = {
        sales: currentLanguage === 'hi' ? 'सेल्स रिपोर्ट' : 'Sales Report',
        payment: currentLanguage === 'hi' ? 'पेमेंट रिपोर्ट' : 'Payment Report',
        customer: currentLanguage === 'hi' ? 'कस्टमर रिपोर्ट' : 'Customer Report',
        product: currentLanguage === 'hi' ? 'प्रोडक्ट सेल्स रिपोर्ट' : 'Product Sales Report',
        stock: currentLanguage === 'hi' ? 'स्टॉक रिपोर्ट' : 'Stock Report'
    };

    const win = window.open('', '_blank');
    win.document.write(`
        <html>
        <head>
            <title>ASP TRONICS v1.0.0 - ${reportTypes[reportType]}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #1a237e; }
                .header { margin-bottom: 20px; }
                .date-range { color: #666; margin-bottom: 15px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                @media print {
                    body { padding: 10px; }
                }
            </style>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
            <\/script>
        </head>
        <body>
            <div class="header">
                <h1>ASP TRONICS v1.0.0</h1>
                <h2>${reportTypes[reportType]}</h2>
                <div class="date-range">
                    ${currentLanguage === 'hi' ? 'तारीख रेंज:' : 'Date Range:'} ${fromDate} ${currentLanguage === 'hi' ? 'से' : 'to'} ${toDate}
                </div>
            </div>
            ${reportContent}
            <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
                ${currentLanguage === 'hi' ? 'बनाया गया:' : 'Generated on:'} ${new Date().toLocaleString('en-IN')}
            </div>
        </body>
        </html>
    `);
    win.document.close();
}

function printReport() {
    const reportContent = document.getElementById('reportResults').innerHTML;
    if (!reportContent) {
        alert(currentLanguage === 'hi' ? 'कृपया पहले रिपोर्ट जनरेट करें' : 'Please generate a report first');
        return;
    }

    exportReportPDF();
}

function shareReport() {
    const reportContent = document.getElementById('reportResults').innerHTML;
    if (!reportContent) {
        alert(currentLanguage === 'hi' ? 'कृपया पहले रिपोर्ट जनरेट करें' : 'Please generate a report first');
        return;
    }

    const fromDate = getDateInputValue('reportFromDate');
    const toDate = getDateInputValue('reportToDate');
    const reportType = document.getElementById('reportType').value;

    const reportTypes = {
        sales: currentLanguage === 'hi' ? 'सेल्स रिपोर्ट' : 'Sales Report',
        payment: currentLanguage === 'hi' ? 'पेमेंट रिपोर्ट' : 'Payment Report',
        customer: currentLanguage === 'hi' ? 'कस्टमर रिपोर्ट' : 'Customer Report',
        product: currentLanguage === 'hi' ? 'प्रोडक्ट सेल्स रिपोर्ट' : 'Product Sales Report',
        stock: currentLanguage === 'hi' ? 'स्टॉक रिपोर्ट' : 'Stock Report'
    };

    let shareText = `*${reportTypes[reportType]}*\n\n`;
    shareText += `*Date Range:* ${fromDate} to ${toDate}\n\n`;

    const table = document.getElementById('reportResults').querySelector('table');
    if (table) {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            let rowText = '';
            cells.forEach(cell => {
                rowText += cell.innerText + ' | ';
            });
            shareText += rowText.slice(0, -3) + '\n';
        });
    }

    shareText += `\nGenerated by ASP TRONICS v1.0.0`;

    const encodedText = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
}

// ========== ADMIN FUNCTIONS ==========
function createUser() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;

    if (!username || !password) {
        alert(currentLanguage === 'hi' ? 'कृपया यूजरनेम और पासवर्ड डालें' : 'Please enter username and password');
        return;
    }

    if (users[username]) {
        alert(currentLanguage === 'hi' ? 'यूजरनेम पहले से मौजूद है' : 'Username already exists');
        return;
    }

    users[username] = {
        password: password,
        role: role,
        created: new Date().toISOString()
    };

    localStorage.setItem('asptronics_users', JSON.stringify(users));

    localStorage.setItem(`asptronics_products_${username}`, JSON.stringify([]));
    localStorage.setItem(`asptronics_customers_${username}`, JSON.stringify([]));
    localStorage.setItem(`asptronics_invoices_${username}`, JSON.stringify([]));

    alert(currentLanguage === 'hi' ? 'यूजर सफलतापूर्वक बनाया गया!' : 'User created successfully!');

    document.getElementById('newUsername').value = '';
    document.getElementById('newUserPassword').value = '';
    document.getElementById('newUserRole').value = 'user';

    loadUsers();
}

function loadUsers() {
    const table = document.getElementById('usersTable');
    table.innerHTML = '';

    Object.entries(users).forEach(([username, userData]) => {
        const row = table.insertRow();
        const createdDate = new Date(userData.created).toLocaleDateString('en-IN');

        row.innerHTML = `
            <td>${username}</td>
            <td>${userData.role}</td>
            <td>${createdDate}</td>
            <td>
                <div class="action-buttons">
                    ${username !== 'admin' ? `
                        <button class="btn btn-small btn-danger" onclick="deleteUser('${username}')" title="${currentLanguage === 'hi' ? 'डिलीट' : 'Delete'}">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
    });
}

function deleteUser(username) {
    if (username === 'admin') {
        alert(currentLanguage === 'hi' ? 'एडमिन यूजर को डिलीट नहीं किया जा सकता' : 'Admin user cannot be deleted');
        return;
    }

    if (confirm((currentLanguage === 'hi' ? 'क्या आप वाकई यूजर "' + username + '" को डिलीट करना चाहते हैं?' : 'Are you sure you want to delete user "' + username + '"?'))) {
        delete users[username];
        localStorage.setItem('asptronics_users', JSON.stringify(users));

        localStorage.removeItem(`asptronics_products_${username}`);
        localStorage.removeItem(`asptronics_customers_${username}`);
        localStorage.removeItem(`asptronics_invoices_${username}`);

        loadUsers();
    }
}

function exportUsersPDF() {
    const win = window.open('', '_blank');
    win.document.write(`
        <html>
        <head>
            <title>ASP TRONICS v1.0.0 - ${currentLanguage === 'hi' ? 'यूजर्स रिपोर्ट' : 'Users Report'}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #1a237e; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
            <\/script>
        </head>
        <body>
            <h1>ASP TRONICS v1.0.0</h1>
            <h2>${currentLanguage === 'hi' ? 'यूजर्स रिपोर्ट' : 'Users Report'}</h2>
            <p>${currentLanguage === 'hi' ? 'बनाया गया:' : 'Generated on:'} ${new Date().toLocaleDateString('en-IN')}</p>
            <p>${currentLanguage === 'hi' ? 'कुल यूजर्स:' : 'Total Users:'} ${Object.keys(users).length}</p>
            <table>
                <thead>
                    <tr>
                        <th>${currentLanguage === 'hi' ? 'यूजरनेम' : 'Username'}</th>
                        <th>${currentLanguage === 'hi' ? 'रोल' : 'Role'}</th>
                        <th>${currentLanguage === 'hi' ? 'बनाया गया' : 'Created'}</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(users).map(([username, userData]) => `
                        <tr>
                            <td>${username}</td>
                            <td>${userData.role}</td>
                            <td>${new Date(userData.created).toLocaleDateString('en-IN')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `);
    win.document.close();
}

// ========== INVOICE HISTORY FUNCTIONS ==========
function startEditInvoice(invoiceId) {
    document.getElementById('editPasswordPrompt').style.display = 'block';
    localStorage.setItem('pendingEditInvoiceId', invoiceId);
}

function verifyEditPassword() {
    const password = document.getElementById('editInvoicePassword').value;
    const invoiceId = localStorage.getItem('pendingEditInvoiceId');

    if (password === editPassword) {
        editInvoice(invoiceId);
        document.getElementById('editPasswordPrompt').style.display = 'none';
        document.getElementById('editInvoicePassword').value = '';
        localStorage.removeItem('pendingEditInvoiceId');
    } else {
        alert(currentLanguage === 'hi' ? 'गलत पासवर्ड!' : 'Wrong password!');
    }
}

function cancelEdit() {
    document.getElementById('editPasswordPrompt').style.display = 'none';
    document.getElementById('editInvoicePassword').value = '';
    localStorage.removeItem('pendingEditInvoiceId');
}

function editInvoice(invoiceId) {
    const invoices = JSON.parse(localStorage.getItem(`asptronics_invoices_${currentUser}`)) || [];
    const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);

    if (invoiceIndex === -1) {
        alert(currentLanguage === 'hi' ? 'इनवॉइस नहीं मिला' : 'Invoice not found');
        return;
    }

    const invoice = invoices[invoiceIndex];

    switchTab('createInvoice');

    invoiceItems = [];

    // Show invoice ID field and set its value
    document.getElementById('invoiceIdRow').style.display = 'block';
    document.getElementById('invoiceIdInput').value = invoice.id;

    document.getElementById('invoiceCustomerName').value = invoice.customer;
    document.getElementById('invoiceDate').value = formatDateForInput(invoice.date);
    document.getElementById('paymentMethod').value = invoice.paymentMethod;
    setPaymentStatus(invoice.paymentStatus);
    document.getElementById('gstPercent').value = invoice.gstPercent || 0;
    onGSTPercentChange();

    invoice.items.forEach(item => {
        invoiceItems.push({
            code: item.code,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            rate: item.rate,
            total: item.total,
            type: item.type || 'product'
        });
    });

    renderInvoiceItems();
    calculateInvoice();

    if (invoice.paymentStatus === 'partial') {
        document.getElementById('amountPaid').value = invoice.amountPaid.toFixed(2);
        updatePaymentSummary();
    }

    localStorage.setItem('editingInvoiceId', invoiceId);

    const saveBtn = document.querySelector('button[onclick="saveInvoice()"]');
    saveBtn.innerHTML = '<i class="fas fa-save"></i> ' + (currentLanguage === 'hi' ? 'इनवॉइस अपडेट करें' : 'Update Invoice');
    saveBtn.setAttribute('onclick', 'updateInvoice()');
}

function updateInvoice() {
    const invoiceId = localStorage.getItem('editingInvoiceId');
    if (!invoiceId) {
        saveInvoice();
        return;
    }

    // Get new invoice ID from input
    const newInvoiceId = document.getElementById('invoiceIdInput').value.trim();
    if (!newInvoiceId) {
        alert(currentLanguage === 'hi' ? 'कृपया इनवॉइस आईडी डालें' : 'Please enter invoice ID');
        return;
    }

    if (invoiceItems.length === 0) {
        alert(currentLanguage === 'hi' ? 'कृपया इनवॉइस में आइटम्स जोड़ें' : 'Please add items to invoice');
        return;
    }

    const invoiceDate = getDateInputValue('invoiceDate');
    if (!isValidDate(invoiceDate)) {
        alert(currentLanguage === 'hi' ? 'कृपया सही तारीख डालें' : 'Please enter a valid date');
        return;
    }

    const customerSelect = document.getElementById('invoiceCustomerSelect').value;
    const customerName = document.getElementById('invoiceCustomerName').value || customerSelect || (currentLanguage === 'hi' ? 'वॉक-इन कस्टमर' : 'Walk-in Customer');
    const paymentMethod = document.getElementById('paymentMethod').value;
    const paymentStatus = document.querySelector('input[name="paymentStatus"]:checked').value;
    const gstPercent = parseFloat(document.getElementById('gstPercent').value) || 0;

    let subtotal = 0;
    invoiceItems.forEach(item => subtotal += item.total);
    const gstAmount = (subtotal * gstPercent) / 100;
    const grandTotal = subtotal + gstAmount;

    let amountPaid = 0;
    if (paymentStatus === 'partial') {
        amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
    } else if (paymentStatus === 'paid') {
        amountPaid = grandTotal;
    }

    const invoices = JSON.parse(localStorage.getItem(`asptronics_invoices_${currentUser}`)) || [];
    const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);

    if (invoiceIndex === -1) {
        alert(currentLanguage === 'hi' ? 'इनवॉइस नहीं मिला' : 'Invoice not found');
        return;
    }

    // Check if invoice ID is being changed to a duplicate
    if (newInvoiceId !== invoiceId) {
        const duplicateInvoice = invoices.find(inv => inv.id === newInvoiceId && inv.id !== invoiceId);
        if (duplicateInvoice) {
            alert(currentLanguage === 'hi' ? 'यह इनवॉइस आईडी पहले से मौजूद है' : 'This invoice ID already exists');
            return;
        }
    }

    // Remove the old invoice if ID changed
    if (newInvoiceId !== invoiceId) {
        invoices.splice(invoiceIndex, 1);
    }

    const updatedInvoice = {
        id: newInvoiceId,
        date: invoiceDate,
        customer: customerName,
        items: [...invoiceItems],
        subtotal: subtotal,
        gstPercent: gstPercent,
        gstAmount: gstAmount,
        grandTotal: grandTotal,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        amountPaid: amountPaid,
        createdBy: currentUser,
        timestamp: new Date().toISOString()
    };

    // Add the updated invoice
    if (newInvoiceId !== invoiceId) {
        invoices.push(updatedInvoice);
    } else {
        invoices[invoiceIndex] = updatedInvoice;
    }

    localStorage.setItem(`asptronics_invoices_${currentUser}`, JSON.stringify(invoices));

    alert(`INV-${newInvoiceId} ${currentLanguage === 'hi' ? 'इनवॉइस सफलतापूर्वक अपडेट हो गया!' : 'Invoice updated successfully!'}`);

    clearInvoiceForm();
    loadInvoices();
    loadDashboard();
    loadProducts();

    const saveBtn = document.querySelector('button[onclick="updateInvoice()"]');
    saveBtn.innerHTML = '<i class="fas fa-save"></i> ' + (currentLanguage === 'hi' ? 'इनवॉइस सेव करें' : 'Save Invoice');
    saveBtn.setAttribute('onclick', 'saveInvoice()');

    localStorage.removeItem('editingInvoiceId');
}

// ========== COPY FUNCTION ==========
function copyFullCode() {
    const htmlContent = document.documentElement.outerHTML;

    navigator.clipboard.writeText(htmlContent).then(() => {
        alert(currentLanguage === 'hi' ? 'पूरा कोड क्लिपबोर्ड में कॉपी हो गया!' : 'Full code copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert(currentLanguage === 'hi' ? 'कोड कॉपी करने में त्रुटि!' : 'Error copying code!');
    });
}

// ========== ADD MISSING EVENT LISTENERS ==========
function addMissingEventListeners() {
    const historySearch = document.getElementById('historySearch');
    if (historySearch) {
        historySearch.addEventListener('input', applyInvoiceFilters);
    }

    const amountPaid = document.getElementById('amountPaid');
    if (amountPaid) {
        amountPaid.addEventListener('input', updatePaymentSummary);
    }

    const gstPercent = document.getElementById('gstPercent');
    if (gstPercent) {
        gstPercent.addEventListener('change', calculateInvoice);
        gstPercent.addEventListener('input', calculateInvoice);
    }

    const historyPaymentStatus = document.getElementById('historyPaymentStatus');
    if (historyPaymentStatus) {
        historyPaymentStatus.addEventListener('change', applyInvoiceFilters);
    }

    const historyCategory = document.getElementById('historyCategory');
    if (historyCategory) {
        historyCategory.addEventListener('change', applyInvoiceFilters);
    }

    const historyFromDate = document.getElementById('historyFromDate');
    if (historyFromDate) {
        historyFromDate.addEventListener('change', applyInvoiceFilters);
    }

    const historyToDate = document.getElementById('historyToDate');
    if (historyToDate) {
        historyToDate.addEventListener('change', applyInvoiceFilters);
    }

    const productCategory = document.getElementById('productCategory');
    if (productCategory) {
        productCategory.addEventListener('change', function() {
            const selectedCategory = this.value;
            if (selectedCategory && !categories.includes(selectedCategory)) {
                categories.push(selectedCategory);
                localStorage.setItem('asptronics_categories', JSON.stringify(categories));
                loadCategories();
                loadDashboardCategories();
            }
        });
    }
}

// ========== UTILITY FUNCTIONS ==========
function isValidDate(dateString) {
  // Accept both DD/MM/YYYY and YYYY-MM-DD formats
  let pattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  let parts;
  
  if (pattern.test(dateString)) {
    parts = dateString.split('/');
  } else {
    pattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    if (pattern.test(dateString)) {
      parts = dateString.split('-');
      // Reorder from YYYY-MM-DD to DD/MM/YYYY for validation
      parts = [parts[2], parts[1], parts[0]];
    } else {
      return false;
    }
  }
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  if (month < 1 || month > 12) return false;
  
  const date = new Date(year, month - 1, day);
  return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
}

// ========== LOGIN FUNCTIONS ==========
function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        alert(currentLanguage === 'hi' ? 'कृपया यूजरनेम और पासवर्ड डालें' : 'Please enter username and password');
        return;
    }

    if (!users[username] || users[username].password !== password) {
        alert(currentLanguage === 'hi' ? 'गलत यूजरनेम या पासवर्ड' : 'Invalid username or password');
        return;
    }

    currentUser = username;
    showApp();
    loadDashboard();
}

function quickAdminLogin() {
    document.getElementById('loginUsername').value = 'admin';
    document.getElementById('loginPassword').value = 'admin123';
    login();
}

function logout() {
    currentUser = null;
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('appContent').style.display = 'none';
}

function showApp() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('appContent').style.display = 'block';
    document.getElementById('currentUsername').textContent = currentUser;
    document.getElementById('userRole').textContent = `(${users[currentUser].role})`;

    if (users[currentUser].role === 'admin') {
        document.getElementById('adminTab').style.display = 'flex';
    }

    loadCompanySettings();
    loadProducts();
    loadCustomers();
    loadInvoices();
    loadDashboardCategories();

    autoSetPaymentStatus();
}

// ========== TAB MANAGEMENT ==========
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById(tabName).style.display = 'block';

    document.querySelectorAll('.tab').forEach(tab => {
        if (tab.getAttribute('onclick') === `switchTab('${tabName}')`) {
            tab.classList.add('active');
        }
    });

    if (tabName === 'dashboard') {
        loadDashboard();
        loadDashboardCategories();
    } else if (tabName === 'createInvoice') {
        loadProductSelect();
        loadCustomerSelect();
        loadCompanyUPI();
        loadCategories();
        autoSetPaymentStatus();
    } else if (tabName === 'invoiceHistory') {
        loadInvoices();
        loadDashboardCategories();
        handleTimePeriodChange();
    } else if (tabName === 'admin') {
        loadUsers();
    } else if (tabName === 'productsCustomers') {
        loadCategories();
        loadCustomers();
        loadProducts();
    }
}

// ========== COMPANY SETTINGS ==========
function loadCompanySettings() {
    const company = JSON.parse(localStorage.getItem('asptronics_company')) || {};

    document.getElementById('companyName').value = company.name || '';
    document.getElementById('companyPhone').value = company.phone || '';
    document.getElementById('companyAddress').value = company.address || '';
    document.getElementById('companyGST').value = company.gst || '';
    document.getElementById('companyEmail').value = company.email || '';
    document.getElementById('companyUPI').value = company.upi || '';
    document.getElementById('editPassword').value = company.editPassword || '9411704071';

    const logoPreview = document.getElementById('logoPreview');
    if (company.logo) {
        logoPreview.innerHTML = `<img src="${company.logo}" alt="Company Logo">`;
        document.getElementById('companyLogo').style.display = 'none';
    } else {
        logoPreview.innerHTML = '<div style="color: #999; font-size: 12px;">No Logo</div>';
    }

    if (company.logo) {
        document.getElementById('companyLogo').innerHTML = `<img src="${company.logo}" alt="Logo" style="max-width: 100%; max-height: 100%;">`;
    } else {
        document.getElementById('companyLogo').textContent = company.name?.charAt(0) || 'A';
    }

    if (company.upi) {
        generateUPIQRCode();
    }

    editPassword = company.editPassword || '9411704071';
}

function uploadLogo() {
    const fileInput = document.getElementById('logoUpload');
    const file = fileInput.files[0];

    if (!file) return;

    if (!file.type.match('image.*')) {
        alert(currentLanguage === 'hi' ? 'कृपया एक इमेज फाइल चुनें' : 'Please select an image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const logoData = e.target.result;

        const company = JSON.parse(localStorage.getItem('asptronics_company')) || {};
        company.logo = logoData;
        localStorage.setItem('asptronics_company', JSON.stringify(company));

        document.getElementById('logoPreview').innerHTML = `<img src="${logoData}" alt="Company Logo">`;
        document.getElementById('companyLogo').innerHTML = `<img src="${logoData}" alt="Logo" style="max-width: 100%; max-height: 100%;">`;
    };

    reader.readAsDataURL(file);
}

function removeLogo() {
    const company = JSON.parse(localStorage.getItem('asptronics_company')) || {};
    delete company.logo;
    localStorage.setItem('asptronics_company', JSON.stringify(company));

    document.getElementById('logoPreview').innerHTML = '<div style="color: #999; font-size: 12px;">No Logo</div>';
    document.getElementById('companyLogo').textContent = company.name?.charAt(0) || 'A';
}

function saveCompanySettings() {
    const company = {
        name: document.getElementById('companyName').value,
        phone: document.getElementById('companyPhone').value,
        address: document.getElementById('companyAddress').value,
        gst: document.getElementById('companyGST').value,
        email: document.getElementById('companyEmail').value,
        upi: document.getElementById('companyUPI').value,
        editPassword: document.getElementById('editPassword').value || '9411704071'
    };

    const existingCompany = JSON.parse(localStorage.getItem('asptronics_company')) || {};
    if (existingCompany.logo) {
        company.logo = existingCompany.logo;
    }

    localStorage.setItem('asptronics_company', JSON.stringify(company));
    alert(currentLanguage === 'hi' ? 'कंपनी सेटिंग्स सफलतापूर्वक सेव हो गईं!' : 'Company settings saved successfully!');

    editPassword = company.editPassword;
    generateUPIQRCode();

    if (document.getElementById('invoiceUPIID')) {
        document.getElementById('invoiceUPIID').value = company.upi || '';
    }
}

function resetCompanySettings() {
    if (confirm(currentLanguage === 'hi' ? 'सभी कंपनी सेटिंग्स डिफॉल्ट पर रीसेट करें?' : 'Reset all company settings to default?')) {
        localStorage.removeItem('asptronics_company');
        loadCompanySettings();
        alert(currentLanguage === 'hi' ? 'कंपनी सेटिंग्स डिफॉल्ट पर रीसेट हो गईं' : 'Company settings reset to default');
    }
}

function showCompanySettings() {
    switchTab('company');
}

function downloadCompanyData() {
    const company = JSON.parse(localStorage.getItem('asptronics_company')) || {};
    const dataStr = JSON.stringify(company, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `ASP_TRONICS_Company_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// ========== PRODUCT MANAGEMENT ==========
function loadProducts() {
    const products = JSON.parse(localStorage.getItem(`asptronics_products_${currentUser}`)) || [];

    const table = document.getElementById('productsTable');
    table.innerHTML = '';

    products.forEach((product, index) => {
        const row = table.insertRow();
        row.innerHTML = `
            <td><strong>${product.code || '-'}</strong></td>
            <td>${product.name}</td>
            <td>${product.category || '-'}</td>
            <td>₹${parseFloat(product.price).toFixed(2)}</td>
            <td>
                <span class="${product.stock > 10 ? 'stock-in' : product.stock > 0 ? 'stock-low' : 'stock-out'} stock-info">
                    ${product.stock > 10 ? '<i class="fas fa-check-circle"></i>' : 
                      product.stock > 0 ? '<i class="fas fa-exclamation-circle"></i>' : 
                      '<i class="fas fa-times-circle"></i>'} 
                    ${product.stock}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-small btn-primary" onclick="editProduct(${index})" title="${currentLanguage === 'hi' ? 'एडिट' : 'Edit'}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="startDeleteProduct(${index})" title="${currentLanguage === 'hi' ? 'डिलीट' : 'Delete'}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-small btn-info" onclick="addProductToInvoice('${product.code}')" title="${currentLanguage === 'hi' ? 'इनवॉइस में जोड़ें' : 'Add to Invoice'}">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </td>
        `;
    });
}

function addProduct() {
    const code = document.getElementById('productCode').value.trim();
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategory').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseFloat(document.getElementById('productStock').value);

    if (!code || !name || !category || isNaN(price)) {
        alert(currentLanguage === 'hi' ? 'कृपया प्रोडक्ट कोड, नाम, कैटेगरी और कीमत डालें' : 'Please enter product code, name, category and price');
        return;
    }

    const products = JSON.parse(localStorage.getItem(`asptronics_products_${currentUser}`)) || [];

    if (products.find(p => p.code === code)) {
        alert(currentLanguage === 'hi' ? 'प्रोडक्ट कोड पहले से मौजूद है!' : 'Product code already exists!');
        return;
    }

    if (category && !categories.includes(category)) {
        categories.push(category);
        localStorage.setItem('asptronics_categories', JSON.stringify(categories));
        loadCategories();
        loadDashboardCategories();
    }

    products.push({
        code: code,
        name: name,
        category: category,
        price: price,
        stock: stock || 0
    });

    localStorage.setItem(`asptronics_products_${currentUser}`, JSON.stringify(products));

    alert(currentLanguage === 'hi' ? 'प्रोडक्ट सफलतापूर्वक जोड़ा गया!' : 'Product added successfully!');
    clearProductForm();
    loadProducts();
    loadProductSelect();
    loadDashboardCategories();
}

function editProduct(index) {
    const products = JSON.parse(localStorage.getItem(`asptronics_products_${currentUser}`)) || [];
    const product = products[index];

    const newCode = prompt(currentLanguage === 'hi' ? 'प्रोडक्ट कोड:' : 'Product Code:', product.code);
    if (newCode === null) return;

    const newName = prompt(currentLanguage === 'hi' ? 'प्रोडक्ट नाम:' : 'Product name:', product.name);
    if (newName === null) return;

    const newCategory = prompt(currentLanguage === 'hi' ? 'कैटेगरी:' : 'Category:', product.category || '');
    const newPrice = prompt(currentLanguage === 'hi' ? 'कीमत:' : 'Price:', product.price);
    if (newPrice === null) return;

    const newStock = prompt(currentLanguage === 'hi' ? 'स्टॉक क्वांटिटी:' : 'Stock quantity:', product.stock);

    if (newCategory && !categories.includes(newCategory)) {
        categories.push(newCategory);
        localStorage.setItem('asptronics_categories', JSON.stringify(categories));
        loadCategories();
        loadDashboardCategories();
    }

    products[index] = {
        code: newCode,
        name: newName,
        category: newCategory || '',
        price: parseFloat(newPrice),
        stock: parseFloat(newStock) || 0
    };

    localStorage.setItem(`asptronics_products_${currentUser}`, JSON.stringify(products));
    loadProducts();
    loadProductSelect();
    loadDashboardCategories();
}

function addProductToInvoice(productCode) {
    switchTab('createInvoice');

    const products = JSON.parse(localStorage.getItem(`asptronics_products_${currentUser}`)) || [];
    const product = products.find(p => p.code === productCode);

    if (product) {
        document.getElementById('productSelect').value = productCode;
        updateProductDetails();
    }
}

function clearProductForm() {
    document.getElementById('productCode').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('productCategory').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = '';
}

function quickAddMultiple() {
    const productList = prompt(currentLanguage === 'hi' ? 
        'फॉर्मेट में प्रोडक्ट्स डालें: कोड,नाम,कैटेगरी,कीमत,स्टॉक (एक लाइन में एक)\nउदाहरण:\nPROD001,प्रोडक्ट 1,इलेक्ट्रॉनिक्स,100,10\nPROD002,प्रोडक्ट 2,कपड़े,200,5' : 
        'Enter products in format: Code,Name,Category,Price,Stock (one per line)\nExample:\nPROD001,Product 1,Electronics,100,10\nPROD002,Product 2,Clothing,200,5');

    if (!productList) return;

    const lines = productList.split('\n');
    const products = JSON.parse(localStorage.getItem(`asptronics_products_${currentUser}`)) || [];
    let added = 0;

    lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length >= 4) {
            const code = parts[0].trim();
            const name = parts[1].trim();
            const category = parts[2].trim();
            const price = parseFloat(parts[3]);
            const stock = parts[4] ? parseFloat(parts[4]) : 0;

            if (code && name && category && !isNaN(price)) {
                if (!products.find(p => p.code === code)) {
                    products.push({
                        code: code,
                        name: name,
                        category: category,
                        price: price,
                        stock: stock
                    });
                    added++;

                    if (category && !categories.includes(category)) {
                        categories.push(category);
                        localStorage.setItem('asptronics_categories', JSON.stringify(categories));
                    }
                }
            }
        }
    });

    localStorage.setItem(`asptronics_products_${currentUser}`, JSON.stringify(products));
    localStorage.setItem('asptronics_categories', JSON.stringify(categories));
    loadCategories();
    loadDashboardCategories();

    alert((currentLanguage === 'hi' ? `${added} प्रोडक्ट्स सफलतापूर्वक जोड़े गए!` : `Added ${added} products successfully!`));
    loadProducts();
    loadProductSelect();
}

function searchProducts() {
    const search = document.getElementById('productSearch').value.toLowerCase();
    const products = JSON.parse(localStorage.getItem(`asptronics_products_${currentUser}`)) || [];
    const table = document.getElementById('productsTable');

    table.innerHTML = '';

    products.filter(product => 
        product.name.toLowerCase().includes(search) ||
        (product.code && product.code.toLowerCase().includes(search)) ||
        (product.category && product.category.toLowerCase().includes(search))
    ).forEach((product, index) => {
        const row = table.insertRow();
        row.innerHTML = `
            <td><strong>${product.code || '-'}</strong></td>
            <td>${product.name}</td>
            <td>${product.category || '-'}</td>
            <td>₹${parseFloat(product.price).toFixed(2)}</td>
            <td>
                <span class="${product.stock > 10 ? 'stock-in' : product.stock > 0 ? 'stock-low' : 'stock-out'} stock-info">
                    ${product.stock > 10 ? '<i class="fas fa-check-circle"></i>' : 
                      product.stock > 0 ? '<i class="fas fa-exclamation-circle"></i>' : 
                      '<i class="fas fa-times-circle"></i>'} 
                    ${product.stock}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-small btn-primary" onclick="editProduct(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="startDeleteProduct(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-small btn-info" onclick="addProductToInvoice('${product.code}')">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </td>
        `;
    });
}

// ========== PRODUCT SELECTION FUNCTIONS ==========
function loadProductSelect() {
    const products = JSON.parse(localStorage.getItem(`asptronics_products_${currentUser}`)) || [];
    const select = document.getElementById('productSelect');

    select.innerHTML = `<option value="">${currentLanguage === 'hi' ? 'प्रोडक्ट चुनें' : 'Select Product'}</option>`;

    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.code;
        option.textContent = `${product.code} - ${product.name} (₹${product.price})`;
        option.dataset.price = product.price;
        option.dataset.stock = product.stock;
        option.dataset.name = product.name;
        option.dataset.category = product.category;
        select.appendChild(option);
    });
}

function setupProductSelect() {
    const productSelect = document.getElementById('productSelect');
    if (productSelect) {
        productSelect.addEventListener('change', updateProductDetails);
    }
}

function updateProductDetails() {
    const selectedOption = this.options[this.selectedIndex];
    const stockInfoDiv = document.getElementById('productStockInfo');

    if (selectedOption.value) {
        const price = selectedOption.dataset.price || '';
        const stock = selectedOption.dataset.stock || '0';
        const productName = selectedOption.dataset.name || '';

        document.getElementById('productRate').value = price;

        const quantityInput = document.getElementById('productQuantity');
        quantityInput.max = stock;
        quantityInput.placeholder = `${currentLanguage === 'hi' ? 'अधिकतम:' : 'Max:'} ${stock}`;

        if (parseFloat(stock) <= 0) {
            stockInfoDiv.innerHTML = `<span class="stock-out"><i class="fas fa-exclamation-triangle"></i> ${currentLanguage === 'hi' ? 'स्टॉक खत्म!' : 'Out of stock!'} (0 ${currentLanguage === 'hi' ? 'उपलब्ध' : 'available'})</span>`;
        } else if (parseFloat(stock) <= 10) {
            stockInfoDiv.innerHTML = `<span class="stock-low"><i class="fas fa-exclamation-circle"></i> ${currentLanguage === 'hi' ? 'कम स्टॉक:' : 'Low stock:'} ${stock} ${currentLanguage === 'hi' ? 'उपलब्ध' : 'available'}</span>`;
        } else {
            stockInfoDiv.innerHTML = `<span class="stock-in"><i class="fas fa-check-circle"></i> ${currentLanguage === 'hi' ? 'स्टॉक में:' : 'In stock:'} ${stock} ${currentLanguage === 'hi' ? 'उपलब्ध' : 'available'}</span>`;
        }
    } else {
        stockInfoDiv.innerHTML = '';
    }
}

// ========== CUSTOM PRODUCT FUNCTION ==========
function addCustomProduct() {
    const productName = document.getElementById('customProductName').value.trim();
    const category = document.getElementById('customProductCategory').value;
    let quantity = parseFloat(document.getElementById('customProductQuantity').value);
    let rate = parseFloat(document.getElementById('customProductRate').value);

    if (!productName || !category || !quantity || quantity <= 0 || !rate || rate <= 0) {
        alert(currentLanguage === 'hi' ? 'कृपया प्रोडक्ट नाम, कैटेगरी, मात्रा और दर डालें' : 'Please enter product name, category, quantity and rate');
        return;
    }

    if (category && !categories.includes(category)) {
        categories.push(category);
        localStorage.setItem('asptronics_categories', JSON.stringify(categories));
        loadCategories();
        loadDashboardCategories();
    }

    const total = quantity * rate;

    invoiceItems.push({
        code: 'CUSTOM',
        name: productName,
        category: category,
        quantity: quantity,
        rate: rate,
        total: total,
        type: 'custom'
    });

    renderInvoiceItems();
    calculateInvoice();

    document.getElementById('customProductName').value = '';
    document.getElementById('customProductCategory').value = '';
    document.getElementById('customProductRate').value = '';
    document.getElementById('customProductQuantity').value = 1;
}

// ========== INVOICE FUNCTIONS ==========
function addToInvoice() {
    const productSelect = document.getElementById('productSelect');
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const productCode = productSelect.value;
    let quantity = parseFloat(document.getElementById('productQuantity').value);
    let rate = parseFloat(document.getElementById('productRate').value);

    if (!productCode || !quantity || quantity <= 0) {
        alert(currentLanguage === 'hi' ? 'कृपया एक प्रोडक्ट चुनें और मात्रा डालें' : 'Please select a product and enter quantity');
        return;
    }

    const productName = selectedOption.dataset.name || productCode;
    const productCategory = selectedOption.dataset.category || '';
    const availableStock = parseFloat(selectedOption.dataset.stock) || 0;

    const products = JSON.parse(localStorage.getItem(`asptronics_products_${currentUser}`)) || [];
    const product = products.find(p => p.code === productCode);

    if (product && product.stock < quantity) {
        alert((currentLanguage === 'hi' ? 'स्टॉक में केवल ' : 'Only ') + product.stock + (currentLanguage === 'hi' ? ' यूनिट्स उपलब्ध हैं!' : ' units available in stock!'));
        document.getElementById('productQuantity').value = product.stock;
        return;
    }

    if (!rate || rate <= 0) {
        rate = parseFloat(selectedOption.dataset.price) || 0;
    }

    const total = quantity * rate;

    invoiceItems.push({
        code: productCode,
        name: productName,
        category: productCategory,
        quantity: quantity,
        rate: rate,
        total: total,
        type: 'product'
    });

    renderInvoiceItems();
    calculateInvoice();

    document.getElementById('productSelect').selectedIndex = 0;
    document.getElementById('productQuantity').value = 1;
    document.getElementById('productRate').value = '';

    const stockInfo = document.getElementById('productStockInfo');
    if (stockInfo) {
        stockInfo.innerHTML = '';
    }
}

function renderInvoiceItems() {
    const table = document.getElementById('invoiceItems');
    table.innerHTML = '';

    invoiceItems.forEach((item, index) => {
        const row = table.insertRow();
        row.innerHTML = `
            <td>
                <div><strong>${item.type === 'custom' ? '' : (item.code || 'N/A')}</strong></div>
                <div style="font-size: 11px; color: #666;">${item.name}</div>
            </td>
            <td>${item.quantity}</td>
            <td>₹${item.rate.toFixed(2)}</td>
            <td>₹${item.total.toFixed(2)}</td>
            <td>${item.category || '-'}</td>
            <td>
                <button class="btn btn-small btn-danger" onclick="removeInvoiceItem(${index})" title="${currentLanguage === 'hi' ? 'हटाएं' : 'Remove'}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    });
}

function removeInvoiceItem(index) {
    invoiceItems.splice(index, 1);
    renderInvoiceItems();
    calculateInvoice();
}

function calculateInvoice() {
    let subtotal = 0;
    invoiceItems.forEach(item => {
        subtotal += item.total;
    });

    const gstPercent = parseFloat(document.getElementById('gstPercent').value) || 0;
    const gstAmount = (subtotal * gstPercent) / 100;
    const grandTotal = subtotal + gstAmount;

    document.getElementById('invoiceSubtotal').textContent = subtotal.toFixed(2);
    document.getElementById('invoiceGrandTotal').textContent = grandTotal.toFixed(2);
    document.getElementById('gstAmountDisplay').value = '₹' + gstAmount.toFixed(2);
    document.getElementById('gstDisplay').textContent = `₹${gstAmount.toFixed(2)} (${gstPercent}%)`;

    updatePaymentSummary(grandTotal);

    autoSetPaymentStatus();

    const amountPaidInput = document.getElementById('amountPaid');
    if (amountPaidInput) {
        const currentPaid = parseFloat(amountPaidInput.value) || 0;
        if (currentPaid > grandTotal) {
            amountPaidInput.value = grandTotal.toFixed(2);
            alert(currentLanguage === 'hi' ? 'पेड रकम कुल रकम से ज्यादा नहीं हो सकती!' : 'Amount paid cannot exceed grand total!');
        }
        updatePaymentSummary(grandTotal);
    }
}

function setPaymentStatus(status) {
    const amountPaidSection = document.getElementById('amountPaidSection');
    const paymentStatusRadios = document.querySelectorAll('input[name="paymentStatus"]');

    paymentStatusRadios.forEach(radio => radio.checked = false);

    document.querySelector(`#status${status.charAt(0).toUpperCase() + status.slice(1)}`).checked = true;

    document.querySelectorAll('.payment-status').forEach(el => {
        el.classList.remove('active');
    });

    document.querySelector(`#status${status.charAt(0).toUpperCase() + status.slice(1)}`).parentElement.classList.add('active');

    if (status === 'partial') {
        amountPaidSection.style.display = 'block';
    } else {
        amountPaidSection.style.display = 'none';
    }

    updatePaymentSummary();
    updateQRCodeButton();
}

function updateQRCodeButton() {
    const paymentStatus = document.querySelector('input[name="paymentStatus"]:checked').value;
    const qrCodeButton = document.querySelector('button[onclick="generateInvoiceQRCode()"]');

    if (qrCodeButton) {
        if (paymentStatus === 'partial') {
            qrCodeButton.innerHTML = '<i class="fas fa-qrcode"></i> ' + (currentLanguage === 'hi' ? 'बची रकम के लिए QR' : 'QR for Remaining');
            qrCodeButton.title = currentLanguage === 'hi' ? "बची रकम के लिए QR कोड जनरेट करें" : "Generate QR Code for remaining amount";
        } else if (paymentStatus === 'paid') {
            qrCodeButton.innerHTML = '<i class="fas fa-qrcode"></i> ' + (currentLanguage === 'hi' ? 'इनवॉइस के लिए QR' : 'QR for Invoice');
            qrCodeButton.title = currentLanguage === 'hi' ? "इनवॉइस रकम के लिए QR कोड जनरेट करें" : "Generate QR Code for invoice amount";
        } else {
            qrCodeButton.innerHTML = '<i class="fas fa-qrcode"></i> ' + (currentLanguage === 'hi' ? 'QR कोड' : 'QR Code');
            qrCodeButton.title = currentLanguage === 'hi' ? "QR कोड जनरेट करें" : "Generate QR Code";
        }
    }
}

function updatePaymentSummary(grandTotal) {
    const status = document.querySelector('input[name="paymentStatus"]:checked').value;
    const paymentSummary = document.getElementById('paymentSummary');

    if (!grandTotal) {
        grandTotal = parseFloat(document.getElementById('invoiceGrandTotal').textContent) || 0;
    }

    if (status === 'paid') {
        paymentSummary.innerHTML = (currentLanguage === 'hi' ? 'पेमेंट स्टेटस: ' : 'Payment Status: ') + `<span style="color: green;">${currentLanguage === 'hi' ? 'पेड' : 'Paid'} (₹${grandTotal.toFixed(2)})</span>`;
    } else if (status === 'partial') {
        const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
        const remaining = grandTotal - amountPaid;
        document.getElementById('remainingAmount').value = remaining.toFixed(2);

        paymentSummary.innerHTML = `
            ${currentLanguage === 'hi' ? 'पेमेंट स्टेटस:' : 'Payment Status:'} <span style="color: orange;">${currentLanguage === 'hi' ? 'आंशिक' : 'Partial'}</span><br>
            ${currentLanguage === 'hi' ? 'पेड:' : 'Paid:'} ₹${amountPaid.toFixed(2)} | ${currentLanguage === 'hi' ? 'बची:' : 'Remaining:'} ₹${remaining.toFixed(2)}
        `;

        updateQRCodeButton();
    } else {
        paymentSummary.innerHTML = (currentLanguage === 'hi' ? 'पेमेंट स्टेटस: ' : 'Payment Status: ') + `<span style="color: red;">${currentLanguage === 'hi' ? 'बकाया' : 'Pending'} (₹${grandTotal.toFixed(2)})</span>`;
    }
}

function saveInvoice() {
    if (invoiceItems.length === 0) {
        alert(currentLanguage === 'hi' ? 'कृपया इनवॉइस में आइटम्स जोड़ें' : 'Please add items to invoice');
        return;
    }

    const invoiceDate = getDateInputValue('invoiceDate');
    if (!isValidDate(invoiceDate)) {
        alert(currentLanguage === 'hi' ? 'कृपया सही तारीख डालें' : 'Please enter a valid date');
        return;
    }

    const customerSelect = document.getElementById('invoiceCustomerSelect').value;
    const customerName = document.getElementById('invoiceCustomerName').value || customerSelect || (currentLanguage === 'hi' ? 'वॉक-इन कस्टमर' : 'Walk-in Customer');
    const paymentMethod = document.getElementById('paymentMethod').value;
    const paymentStatus = document.querySelector('input[name="paymentStatus"]:checked').value;
    const gstPercent = parseFloat(document.getElementById('gstPercent').value) || 0;

    let subtotal = 0;
    invoiceItems.forEach(item => subtotal += item.total);
    const gstAmount = (subtotal * gstPercent) / 100;
    const grandTotal = subtotal + gstAmount;

    let amountPaid = 0;
    if (paymentStatus === 'partial') {
        amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
    } else if (paymentStatus === 'paid') {
        amountPaid = grandTotal;
    }

    const invoiceId = 'INV-' + new Date().getTime().toString().slice(-8);

    const invoice = {
        id: invoiceId,
        date: invoiceDate,
        customer: customerName,
        items: [...invoiceItems],
        subtotal: subtotal,
        gstPercent: gstPercent,
        gstAmount: gstAmount,
        grandTotal: grandTotal,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        amountPaid: amountPaid,
        createdBy: currentUser,
        timestamp: new Date().toISOString()
    };

    const invoices = JSON.parse(localStorage.getItem(`asptronics_invoices_${currentUser}`)) || [];
    invoices.push(invoice);
    localStorage.setItem(`asptronics_invoices_${currentUser}`, JSON.stringify(invoices));

    updateStockForInvoice(invoice);

    alert(`INV-${invoiceId} ${currentLanguage === 'hi' ? 'इनवॉइस सफलतापूर्वक सेव हो गया!' : 'Invoice saved successfully!'}`);

    clearInvoiceForm();
    loadInvoices();
    loadDashboard();
    loadProducts();
    loadDashboardCategories();
}

function updateStockForInvoice(invoice) {
    const products = JSON.parse(localStorage.getItem(`asptronics_products_${currentUser}`)) || [];

    invoice.items.forEach(invoiceItem => {
        if (invoiceItem.type === 'product') {
            const productIndex = products.findIndex(p => p.code === invoiceItem.code);
            if (productIndex !== -1) {
                products[productIndex].stock -= invoiceItem.quantity;
                if (products[productIndex].stock < 0) {
                    products[productIndex].stock = 0;
                }
            }
        }
    });

    localStorage.setItem(`asptronics_products_${currentUser}`, JSON.stringify(products));
    loadProducts();
    loadProductSelect();
}

function clearInvoiceForm() {
    invoiceItems = [];
    document.getElementById('invoiceItems').innerHTML = '';
    document.getElementById('invoiceSubtotal').textContent = '0.00';
    document.getElementById('invoiceGrandTotal').textContent = '0.00';
    document.getElementById('gstPercent').value = '0';
    document.getElementById('gstAmountDisplay').value = '₹0.00';
    document.getElementById('gstDisplay').textContent = '₹0.00 (0%)';
    document.getElementById('invoiceCustomerSelect').selectedIndex = 0;
    document.getElementById('invoiceCustomerName').value = '';
    document.getElementById('amountPaid').value = '';
    document.getElementById('remainingAmount').value = '';
    document.getElementById('customProductName').value = '';
    document.getElementById('customProductCategory').value = '';
    document.getElementById('customProductRate').value = '';
    document.getElementById('customProductQuantity').value = 1;
    document.getElementById('invoiceUPISection').style.display = 'none';
    document.getElementById('productStockInfo').innerHTML = '';
    document.getElementById('invoiceUPIID').value = '';
    
    // Hide invoice ID field
    document.getElementById('invoiceIdRow').style.display = 'none';
    document.getElementById('invoiceIdInput').value = '';

    document.getElementById('statusPaid').checked = true;
    setPaymentStatus('paid');

    loadCompanyUPI();
}

// ========== CUSTOMER MANAGEMENT ==========
function loadCustomers() {
    const customers = JSON.parse(localStorage.getItem(`asptronics_customers_${currentUser}`)) || [];

    const table = document.getElementById('customersTable');
    table.innerHTML = '';

    customers.forEach((customer, index) => {
        const row = table.insertRow();
        row.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.phone || '-'}</td>
            <td>${customer.email || '-'}</td>
            <td>${customer.gst || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-small btn-primary" onclick="editCustomer(${index})" title="${currentLanguage === 'hi' ? 'एडिट' : 'Edit'}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="startDeleteCustomer(${index})" title="${currentLanguage === 'hi' ? 'डिलीट' : 'Delete'}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-small btn-success" onclick="createInvoiceForCustomer(${index})" title="${currentLanguage === 'hi' ? 'इनवॉइस बनाएं' : 'Create Invoice'}">
                        <i class="fas fa-file-invoice"></i>
                    </button>
                </div>
            </td>
        `;
    });
}

function addCustomer() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const gst = document.getElementById('customerGST').value.trim();
    const address = document.getElementById('customerAddress').value.trim();

    if (!name || !phone) {
        alert(currentLanguage === 'hi' ? 'कृपया कस्टमर नाम और फोन नंबर डालें' : 'Please enter customer name and phone number');
        return;
    }

    const customers = JSON.parse(localStorage.getItem(`asptronics_customers_${currentUser}`)) || [];
    customers.push({
        name: name,
        phone: phone,
        email: email,
        gst: gst,
        address: address
    });

    localStorage.setItem(`asptronics_customers_${currentUser}`, JSON.stringify(customers));

    alert(currentLanguage === 'hi' ? 'कस्टमर सफलतापूर्वक जोड़ा गया!' : 'Customer added successfully!');

    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerGST').value = '';
    document.getElementById('customerAddress').value = '';

    loadCustomers();
    loadCustomerSelect();
}

function editCustomer(index) {
    const customers = JSON.parse(localStorage.getItem(`asptronics_customers_${currentUser}`)) || [];
    const customer = customers[index];

    const newName = prompt(currentLanguage === 'hi' ? 'कस्टमर नाम:' : 'Customer name:', customer.name);
    if (newName === null) return;

    const newPhone = prompt(currentLanguage === 'hi' ? 'फोन:' : 'Phone:', customer.phone);
    const newEmail = prompt(currentLanguage === 'hi' ? 'ईमेल:' : 'Email:', customer.email);
    const newGST = prompt(currentLanguage === 'hi' ? 'GST:' : 'GST:', customer.gst);
    const newAddress = prompt(currentLanguage === 'hi' ? 'पता:' : 'Address:', customer.address);

    customers[index] = {
        name: newName,
        phone: newPhone || '',
        email: newEmail || '',
        gst: newGST || '',
        address: newAddress || ''
    };

    localStorage.setItem(`asptronics_customers_${currentUser}`, JSON.stringify(customers));
    loadCustomers();
    loadCustomerSelect();
}

function createInvoiceForCustomer(index) {
    const customers = JSON.parse(localStorage.getItem(`asptronics_customers_${currentUser}`)) || [];
    const customer = customers[index];

    switchTab('createInvoice');
    document.getElementById('invoiceCustomerName').value = customer.name;
    document.getElementById('invoiceCustomerSelect').value = customer.name;
}

function searchCustomers() {
    const search = document.getElementById('customerSearch').value.toLowerCase();
    const customers = JSON.parse(localStorage.getItem(`asptronics_customers_${currentUser}`)) || [];
    const table = document.getElementById('customersTable');

    table.innerHTML = '';

    customers.filter(customer => 
        customer.name.toLowerCase().includes(search) ||
        customer.phone.includes(search) ||
        (customer.email && customer.email.toLowerCase().includes(search))
    ).forEach((customer, index) => {
        const row = table.insertRow();
        row.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.phone || '-'}</td>
            <td>${customer.email || '-'}</td>
            <td>${customer.gst || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-small btn-primary" onclick="editCustomer(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="startDeleteCustomer(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-small btn-success" onclick="createInvoiceForCustomer(${index})">
                        <i class="fas fa-file-invoice"></i>
                    </button>
                </div>
            </td>
        `;
    });
}

function loadCustomerSelect() {
    const customers = JSON.parse(localStorage.getItem(`asptronics_customers_${currentUser}`)) || [];
    const select = document.getElementById('invoiceCustomerSelect');

    select.innerHTML = `<option value="">${currentLanguage === 'hi' ? 'कस्टमर चुनें' : 'Select Customer'}</option>`;

    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.name;
        option.textContent = `${customer.name} (${customer.phone || (currentLanguage === 'hi' ? 'फोन नहीं' : 'No phone')})`;
        select.appendChild(option);
    });
}

function loadCustomerDetails() {
    const customerName = document.getElementById('invoiceCustomerSelect').value;
    if (!customerName) return;

    const customers = JSON.parse(localStorage.getItem(`asptronics_customers_${currentUser}`)) || [];
    const customer = customers.find(c => c.name === customerName);

    if (customer) {
        document.getElementById('invoiceCustomerName').value = customer.name;
    }
}

function exportCustomersPDF() {
  const customers = JSON.parse(localStorage.getItem(`asptronics_customers_${currentUser}`)) || [];
  
  if (customers.length === 0) {
    alert(currentLanguage === 'hi' ? 'PDF बनाने के लिए कोई कस्टमर नहीं है' : 'No customers to create PDF');
    return;
  }

  let content = `
    <h2>ASP TRONICS v1.0.0 - ${currentLanguage === 'hi' ? 'कस्टमर्स रिपोर्ट' : 'Customers Report'}</h2>
    <p>${currentLanguage === 'hi' ? 'बनाया गया:' : 'Generated on:'} ${new Date().toLocaleDateString('en-IN')}</p>
    <p>${currentLanguage === 'hi' ? 'कुल कस्टमर्स:' : 'Total Customers:'} ${customers.length}</p>
    <table border="1" style="width:100%; border-collapse:collapse; margin-top:15px; font-size:12px;">
      <thead>
        <tr>
          <th style="padding:6px;">${currentLanguage === 'hi' ? 'नाम' : 'Name'}</th>
          <th style="padding:6px;">${currentLanguage === 'hi' ? 'फोन' : 'Phone'}</th>
          <th style="padding:6px;">${currentLanguage === 'hi' ? 'ईमेल' : 'Email'}</th>
          <th style="padding:6px;">${currentLanguage === 'hi' ? 'GST' : 'GST'}</th>
          <th style="padding:6px;">${currentLanguage === 'hi' ? 'पता' : 'Address'}</th>
        </tr>
      </thead>
      <tbody>
  `;

  customers.forEach(customer => {
    content += `
      <tr>
        <td style="padding:6px;">${customer.name}</td>
        <td style="padding:6px;">${customer.phone || '-'}</td>
        <td style="padding:6px;">${customer.email || '-'}</td>
        <td style="padding:6px;">${customer.gst || '-'}</td>
        <td style="padding:6px;">${customer.address || '-'}</td>
      </tr>
    `;
  });

  content += `
      </tbody>
    </table>
  `;

  const win = window.open('', '_blank');
  win.document.write(`
    <html>
      <head>
        <title>ASP TRONICS v1.0.0 - ${currentLanguage === 'hi' ? 'कस्टमर्स रिपोर्ट' : 'Customers Report'}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 15px; font-size: 12px; }
          h2 { color: #1a237e; font-size: 18px; }
          table { width: 100%; border-collapse: collapse; }
          th { background-color: #1a237e; color: white; }
        </style>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        <\/script>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);
  win.document.close();
}

// ========== PREVIEW INVOICE ==========
function previewInvoice() {
    if (invoiceItems.length === 0) {
        alert(currentLanguage === 'hi' ? 'कृपया पहले इनवॉइस में आइटम्स जोड़ें' : 'Please add items to invoice first');
        return;
    }

    const company = JSON.parse(localStorage.getItem('asptronics_company')) || {};
    const customerName = document.getElementById('invoiceCustomerName').value || 
                        document.getElementById('invoiceCustomerSelect').value || 
                        (currentLanguage === 'hi' ? 'वॉक-इन कस्टमर' : 'Walk-in Customer');
    const invoiceDate = getDateInputValue('invoiceDate') || new Date().toLocaleDateString('en-IN');
    const paymentStatus = document.querySelector('input[name="paymentStatus"]:checked').value;
    const grandTotal = parseFloat(document.getElementById('invoiceGrandTotal').textContent) || 0;
    const customUPI = document.getElementById('invoiceUPIID').value.trim();
    const gstPercent = parseFloat(document.getElementById('gstPercent').value) || 0;

    let qrAmount = grandTotal;
    if (paymentStatus === 'partial') {
        const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
        qrAmount = grandTotal - amountPaid;
    }

    let qrCodeDataURL = null;
    if (paymentStatus !== 'paid') {
        qrCodeDataURL = generatePaymentQRCode(qrAmount, company, customUPI, 150);
    }

    let preview = `
        <div style="padding: 15px; font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; font-size: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #1a237e; padding-bottom: 15px;">
                <div>
                    ${company.logo ? `<img src="${company.logo}" alt="Logo" style="max-height: 60px; margin-bottom: 8px;">` : ''}
                    <h1 style="color: #1a237e; margin: 0; font-size: 22px;">${company.name || 'ASP TRONICS'}</h1>
                    <p style="margin: 3px 0; font-size: 11px;">${company.address || ''}</p>
                    <p style="margin: 3px 0; font-size: 11px;">${company.phone ? (currentLanguage === 'hi' ? 'फोन: ' : 'Phone: ') + company.phone : ''} ${company.gst ? ' | GST: ' + company.gst : ''}</p>
                    <p style="margin: 3px 0; font-size: 11px;">${company.email ? (currentLanguage === 'hi' ? 'ईमेल: ' : 'Email: ') + company.email : ''}</p>
                </div>
                <div style="text-align: right;">
                    <h2 style="color: #1a237e; margin: 0; font-size: 18px;">${currentLanguage === 'hi' ? 'इनवॉइस' : 'INVOICE'}</h2>
                    <p style="margin: 8px 0; font-size: 11px;"><strong>${currentLanguage === 'hi' ? 'तारीख:' : 'Date:'}</strong> ${invoiceDate}</p>
                    <p style="margin: 3px 0; font-size: 11px;"><strong>${currentLanguage === 'hi' ? 'इनवॉइस #:' : 'Invoice #:'}</strong> PREVIEW</p>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div style="flex: 1;">
                    <h3 style="color: #1a237e; margin-bottom: 8px; font-size: 14px;">${currentLanguage === 'hi' ? 'बिल टू:' : 'Bill To:'}</h3>
                    <p style="margin: 3px 0;"><strong>${customerName}</strong></p>
                </div>
                <div style="text-align: right; flex: 1;">
                    <h3 style="color: #1a237e; margin-bottom: 8px; font-size: 14px;">${currentLanguage === 'hi' ? 'पेमेंट डिटेल्स' : 'Payment Details'}</h3>
                    <p style="margin: 3px 0;"><strong>${currentLanguage === 'hi' ? 'मेथड:' : 'Method:'}</strong> ${document.getElementById('paymentMethod').value}</p>
                    <p style="margin: 3px 0;"><strong>${currentLanguage === 'hi' ? 'स्टेटस:' : 'Status:'}</strong> ${paymentStatus === 'partial' ? (currentLanguage === 'hi' ? 'आंशिक' : 'Partial') : paymentStatus === 'paid' ? (currentLanguage === 'hi' ? 'पेड' : 'Paid') : (currentLanguage === 'hi' ? 'बकाया' : 'Pending')}</p>
                    ${paymentStatus === 'partial' ? `
                        <p style="margin: 3px 0;"><strong>${currentLanguage === 'hi' ? 'पेड रकम:' : 'Amount Paid:'}</strong> ₹${parseFloat(document.getElementById('amountPaid').value || 0).toFixed(2)}</p>
                        <p style="margin: 3px 0;"><strong>${currentLanguage === 'hi' ? 'बची रकम:' : 'Remaining:'}</strong> ₹${qrAmount.toFixed(2)}</p>
                    ` : ''}
                </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">${currentLanguage === 'hi' ? 'आइटम डिस्क्रिप्शन' : 'Item Description'}</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">${currentLanguage === 'hi' ? 'मात्रा' : 'Qty'}</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">${currentLanguage === 'hi' ? 'दर (₹)' : 'Rate (₹)'}</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">${currentLanguage === 'hi' ? 'रकम (₹)' : 'Amount (₹)'}</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">${currentLanguage === 'hi' ? 'कैटेगरी' : 'Category'}</th>
                    </tr>
                </thead>
                <tbody>
    `;

    invoiceItems.forEach(item => {
        preview += `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">
                    ${item.type !== 'custom' ? `<div><strong>${item.code || 'N/A'}</strong></div>` : ''}
                    <div style="font-size: 10px; color: #666;">${item.name}</div>
                </td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.rate.toFixed(2)}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.total.toFixed(2)}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${item.category || '-'}</td>
            </tr>
        `;
    });

    const subtotal = parseFloat(document.getElementById('invoiceSubtotal').textContent);
    const gstAmount = subtotal * (gstPercent / 100);

    preview += `
                </tbody>
            </table>
            
            <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                <div style="flex: 1;">
                    ${qrCodeDataURL ? `
                        <div style="text-align: center;">
                            <h4 style="color: #1a237e; margin-bottom: 8px; font-size: 13px;">${paymentStatus === 'partial' ? (currentLanguage === 'hi' ? 'बची रकम का QR कोड' : 'Remaining Amount QR Code') : (currentLanguage === 'hi' ? 'पेमेंट QR कोड' : 'Payment QR Code')}</h4>
                            <img src="${qrCodeDataURL}" alt="Payment QR Code" style="width: 150px; height: 150px; border: 1px solid #ddd; padding: 4px; background: white;">
                            <p style="margin-top: 8px; font-size: 11px; color: #666;">
                                ${paymentStatus === 'partial' ? 
                                    (currentLanguage === 'hi' ? `बची रकम पे करने के लिए स्कैन करें ₹` : `Scan to pay remaining amount ₹`) : 
                                    (currentLanguage === 'hi' ? `पे करने के लिए स्कैन करें ₹` : `Scan to pay ₹`)}${qrAmount.toFixed(2)}
                            </p>
                            ${customUPI || company.upi ? `<p style="font-size: 10px; color: #999;">UPI ID: ${customUPI || company.upi}</p>` : ''}
                        </div>
                    ` : ''}
                </div>
                
                <div style="flex: 1; text-align: right;">
                    <div style="border-top: 2px solid #333; padding-top: 15px;">
                        <p style="margin: 6px 0;"><strong>${currentLanguage === 'hi' ? 'सबटोटल:' : 'Subtotal:'}</strong> ₹${subtotal.toFixed(2)}</p>
                        ${gstPercent > 0 ? `<p style="margin: 6px 0;"><strong>GST (${gstPercent}%):</strong> ₹${gstAmount.toFixed(2)}</p>` : ''}
                        <h2 style="color: #1a237e; margin: 12px 0; font-size: 20px;">${currentLanguage === 'hi' ? 'कुल रकम:' : 'Grand Total:'} ₹${grandTotal.toFixed(2)}</h2>
                        ${paymentStatus === 'partial' ? `
                            <p style="margin: 6px 0; color: #666; font-size: 13px;">
                                <strong>${currentLanguage === 'hi' ? 'पेड:' : 'Paid:'}</strong> ₹${parseFloat(document.getElementById('amountPaid').value || 0).toFixed(2)} | 
                                <strong>${currentLanguage === 'hi' ? 'बची:' : 'Remaining:'}</strong> ₹${qrAmount.toFixed(2)}
                            </p>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; text-align: center;">
                <p><strong>${currentLanguage === 'hi' ? 'आपके व्यवसाय के लिए धन्यवाद!' : 'Thank you visit again!'}</strong></p>
                <p style="font-size: 10px; color: #666;">${currentLanguage === 'hi' ? 'ASP TRONICS बिलिंग सिस्टम v1.0.0 द्वारा बनाया गया' : 'Generated by ASP TRONICS Billing System v1.0.0'}</p>
            </div>
        </div>
    `;

    const win = window.open('', '_blank');
    win.document.write(preview);
    win.document.close();
}

function generatePaymentQRCode(amount, company, customUPI = null, size = 250) {
    const upi = customUPI || company.upi;

    if (!upi) {
        return null;
    }

    const upiURL = `upi://pay?pa=${upi}&pn=${encodeURIComponent(company.name || 'ASP TRONICS')}&am=${amount.toFixed(2)}&cu=INR`;

    try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        new QRious({
            element: canvas,
            value: upiURL,
            size: size,
            padding: 20
        });

        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error('Failed to generate QR code:', error);
        return null;
    }
}

// ========== INVOICE HISTORY ==========
function loadInvoices() {
    const invoices = JSON.parse(localStorage.getItem(`asptronics_invoices_${currentUser}`)) || [];

    const table = document.getElementById('invoicesTable');
    table.innerHTML = '';

    invoices.sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('-');
        const dateB = b.date.split('/').reverse().join('-');
        return new Date(dateB) - new Date(dateA);
    });

    invoices.forEach((invoice, index) => {
        const row = table.insertRow();

        let statusBadge = '';
        if (invoice.paymentStatus === 'paid') {
            statusBadge = '<span style="color: green; font-weight: bold;">' + (currentLanguage === 'hi' ? 'पेड' : 'Paid') + '</span>';
        } else if (invoice.paymentStatus === 'partial') {
            statusBadge = `<span style="color: orange; font-weight: bold;">${currentLanguage === 'hi' ? 'आंशिक' : 'Partial'}</span>`;
        } else {
            statusBadge = '<span style="color: red; font-weight: bold;">' + (currentLanguage === 'hi' ? 'बकाया' : 'Pending') + '</span>';
        }

        row.innerHTML = `
            <td>${invoice.date}</td>
            <td><strong>${invoice.id}</strong></td>
            <td>${invoice.customer}</td>
            <td>₹${invoice.grandTotal.toFixed(2)}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-small btn-primary" onclick="viewInvoice('${invoice.id}')" title="${currentLanguage === 'hi' ? 'देखें' : 'View'}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-small btn-whatsapp" onclick="shareSavedInvoice('${invoice.id}')" title="WhatsApp">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <button class="btn btn-small btn-pdf" onclick="generateSavedInvoicePDF('${invoice.id}')" title="PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button class="btn btn-small btn-warning" onclick="startEditInvoice('${invoice.id}')" title="${currentLanguage === 'hi' ? 'एडिट' : 'Edit'}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="startDeleteInvoice('${invoice.id}')" title="${currentLanguage === 'hi' ? 'डिलीट' : 'Delete'}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
    });
}

// ========== VIEW INVOICE ==========
function viewInvoice(invoiceId) {
    const invoices = JSON.parse(localStorage.getItem(`asptronics_invoices_${currentUser}`)) || [];
    const invoice = invoices.find(inv => inv.id === invoiceId);

    if (!invoice) {
        alert(currentLanguage === 'hi' ? 'इनवॉइस नहीं मिला' : 'Invoice not found');
        return;
    }

    const company = JSON.parse(localStorage.getItem('asptronics_company')) || {};

    let qrAmount = invoice.grandTotal;
    if (invoice.paymentStatus === 'partial') {
        qrAmount = invoice.grandTotal - invoice.amountPaid;
    }

    let qrCodeDataURL = null;
    if (invoice.paymentStatus !== 'paid') {
        qrCodeDataURL = generatePaymentQRCode(qrAmount, company, company.upi, 150);
    }

    let preview = `
        <div style="padding: 15px; font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; font-size: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #1a237e; padding-bottom: 15px;">
                <div>
                    ${company.logo ? `<img src="${company.logo}" alt="Logo" style="max-height: 60px; margin-bottom: 8px;">` : ''}
                    <h1 style="color: #1a237e; margin: 0; font-size: 22px;">${company.name || 'ASP TRONICS'}</h1>
                    <p style="margin: 3px 0; font-size: 11px;">${company.address || ''}</p>
                    <p style="margin: 3px 0; font-size: 11px;">${company.phone ? (currentLanguage === 'hi' ? 'फोन: ' : 'Phone: ') + company.phone : ''} ${company.gst ? ' | GST: ' + company.gst : ''}</p>
                    <p style="margin: 3px 0; font-size: 11px;">${company.email ? (currentLanguage === 'hi' ? 'ईमेल: ' : 'Email: ') + company.email : ''}</p>
                </div>
                <div style="text-align: right;">
                    <h2 style="color: #1a237e; margin: 0; font-size: 18px;">${currentLanguage === 'hi' ? 'इनवॉइस' : 'INVOICE'}</h2>
                    <p style="margin: 8px 0; font-size: 11px;"><strong>${currentLanguage === 'hi' ? 'तारीख:' : 'Date:'}</strong> ${invoice.date}</p>
                    <p style="margin: 3px 0; font-size: 11px;"><strong>${currentLanguage === 'hi' ? 'इनवॉइस #:' : 'Invoice #:'}</strong> ${invoice.id}</p>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div style="flex: 1;">
                    <h3 style="color: #1a237e; margin-bottom: 8px; font-size: 14px;">${currentLanguage === 'hi' ? 'बिल टू:' : 'Bill To:'}</h3>
                    <p style="margin: 3px 0;"><strong>${invoice.customer}</strong></p>
                </div>
                <div style="text-align: right; flex: 1;">
                    <h3 style="color: #1a237e; margin-bottom: 8px; font-size: 14px;">${currentLanguage === 'hi' ? 'पेमेंट डिटेल्स' : 'Payment Details'}</h3>
                    <p style="margin: 3px 0;"><strong>${currentLanguage === 'hi' ? 'मेथड:' : 'Method:'}</strong> ${invoice.paymentMethod}</p>
                    <p style="margin: 3px 0;"><strong>${currentLanguage === 'hi' ? 'स्टेटस:' : 'Status:'}</strong> ${invoice.paymentStatus === 'partial' ? (currentLanguage === 'hi' ? 'आंशिक' : 'Partial') : invoice.paymentStatus === 'paid' ? (currentLanguage === 'hi' ? 'पेड' : 'Paid') : (currentLanguage === 'hi' ? 'बकाया' : 'Pending')}</p>
                    ${invoice.paymentStatus === 'partial' ? `
                        <p style="margin: 3px 0;"><strong>${currentLanguage === 'hi' ? 'पेड रकम:' : 'Amount Paid:'}</strong> ₹${invoice.amountPaid.toFixed(2)}</p>
                        <p style="margin: 3px 0;"><strong>${currentLanguage === 'hi' ? 'बची रकम:' : 'Remaining:'}</strong> ₹${qrAmount.toFixed(2)}</p>
                    ` : ''}
                </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">${currentLanguage === 'hi' ? 'आइटम डिस्क्रिप्शन' : 'Item Description'}</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">${currentLanguage === 'hi' ? 'मात्रा' : 'Qty'}</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">${currentLanguage === 'hi' ? 'दर (₹)' : 'Rate (₹)'}</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">${currentLanguage === 'hi' ? 'रकम (₹)' : 'Amount (₹)'}</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">${currentLanguage === 'hi' ? 'कैटेगरी' : 'Category'}</th>
                    </tr>
                </thead>
                <tbody>
    `;

    invoice.items.forEach(item => {
        preview += `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">
                    ${item.type !== 'custom' ? `<div><strong>${item.code || 'N/A'}</strong></div>` : ''}
                    <div style="font-size: 10px; color: #666;">${item.name}</div>
                </td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.rate.toFixed(2)}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.total.toFixed(2)}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${item.category || '-'}</td>
            </tr>
        `;
    });

    preview += `
                </tbody>
            </table>
            
            <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                <div style="flex: 1;">
                    ${qrCodeDataURL ? `
                        <div style="text-align: center;">
                            <h4 style="color: #1a237e; margin-bottom: 8px; font-size: 13px;">${invoice.paymentStatus === 'partial' ? (currentLanguage === 'hi' ? 'बची रकम का QR कोड' : 'Remaining Amount QR Code') : (currentLanguage === 'hi' ? 'पेमेंट QR कोड' : 'Payment QR Code')}</h4>
                            <img src="${qrCodeDataURL}" alt="Payment QR Code" style="width: 150px; height: 150px; border: 1px solid #ddd; padding: 4px; background: white;">
                            <p style="margin-top: 8px; font-size: 11px; color: #666;">
                                ${invoice.paymentStatus === 'partial' ? 
                                    (currentLanguage === 'hi' ? `बची रकम पे करने के लिए स्कैन करें ₹` : `Scan to pay remaining amount ₹`) : 
                                    (currentLanguage === 'hi' ? `पे करने के लिए स्कैन करें ₹` : `Scan to pay ₹`)}${qrAmount.toFixed(2)}
                            </p>
                            ${company.upi ? `<p style="font-size: 10px; color: #999;">UPI ID: ${company.upi}</p>` : ''}
                        </div>
                    ` : ''}
                </div>
                
                <div style="flex: 1; text-align: right;">
                    <div style="border-top: 2px solid #333; padding-top: 15px;">
                        <p style="margin: 6px 0;"><strong>${currentLanguage === 'hi' ? 'सबटोटल:' : 'Subtotal:'}</strong> ₹${invoice.subtotal.toFixed(2)}</p>
                        ${invoice.gstPercent > 0 ? `<p style="margin: 6px 0;"><strong>GST (${invoice.gstPercent}%):</strong> ₹${invoice.gstAmount.toFixed(2)}</p>` : ''}
                        <h2 style="color: #1a237e; margin: 12px 0; font-size: 20px;">${currentLanguage === 'hi' ? 'कुल रकम:' : 'Grand Total:'} ₹${invoice.grandTotal.toFixed(2)}</h2>
                        ${invoice.paymentStatus === 'partial' ? `
                            <p style="margin: 6px 0; color: #666; font-size: 13px;">
                                <strong>${currentLanguage === 'hi' ? 'पेड:' : 'Paid:'}</strong> ₹${invoice.amountPaid.toFixed(2)} | 
                                <strong>${currentLanguage === 'hi' ? 'बची:' : 'Remaining:'}</strong> ₹${qrAmount.toFixed(2)}
                            </p>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; text-align: center;">
                <p><strong>${currentLanguage === 'hi' ? 'आपके व्यवसाय के लिए धन्यवाद!' : 'Thank you visit again!'}</strong></p>
                <p style="font-size: 10px; color: #666;">${currentLanguage === 'hi' ? 'ASP TRONICS बिलिंग सिस्टम v1.0.0 द्वारा बनाया गया' : 'Generated by ASP TRONICS Billing System v1.0.0'}</p>
            </div>
        </div>
    `;

    const win = window.open('', '_blank');
    win.document.write(preview);
    win.document.close();
}

// ========== INITIALIZE ==========
window.onload = init;