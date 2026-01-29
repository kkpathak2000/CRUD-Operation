document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('productForm');
    const storeList = document.getElementById('storeList').getElementsByTagName('tbody')[0];
    const searchInput = document.getElementById('searchInput');
    const exportBtn = document.getElementById('exportBtn');
    const tableHeaders = document.querySelectorAll('#storeList th');
    const toastContainer = document.getElementById('toastContainer');
    const selectAllCheckbox = document.getElementById('selectAll');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const activityLog = document.getElementById('activityLog');
    const clearLogBtn = document.getElementById('clearLogBtn');

    let selectedRow = null;
    let currentSort = { column: -1, direction: 'asc' };
    const LOW_STOCK_THRESHOLD = 5;

    // Load data from localStorage on initialization
    loadData();
    updateDashboard();
    renderActivityLog();

    // Event listener for search filtering
    searchInput.addEventListener('input', () => {
        filterProducts(searchInput.value.toLowerCase());
    });

    // Event listener for CSV export
    exportBtn.addEventListener('click', () => {
        exportToCSV();
        showToast('Inventory exported successfully');
    });

    // Event listeners for table sorting
    tableHeaders.forEach((th, index) => {
        // Skip first (checkbox) and last (actions) columns
        if (index > 0 && index < 6) {
            th.addEventListener('click', () => {
                sortRows(index);
            });
        }
    });

    // Event listener for "Select All"
    selectAllCheckbox.addEventListener('change', () => {
        const checkboxes = storeList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            if (cb.parentElement.parentElement.style.display !== 'none') {
                cb.checked = selectAllCheckbox.checked;
            }
        });
        updateBulkDeleteButton();
    });

    // Event listener for Bulk Delete
    bulkDeleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all selected items?')) {
            const checkboxes = storeList.querySelectorAll('input[type="checkbox"]:checked');
            let count = 0;
            checkboxes.forEach(cb => {
                const row = cb.parentElement.parentElement;
                addActivity(`Deleted product: ${row.cells[1].textContent}`);
                row.remove();
                count++;
            });
            saveData();
            updateDashboard();
            updateBulkDeleteButton();
            selectAllCheckbox.checked = false;
            showToast(`Successfully deleted ${count} items`);
        }
    });

    // Event listener for clearing activity log
    clearLogBtn.addEventListener('click', () => {
        localStorage.setItem('activityLogs', JSON.stringify([]));
        renderActivityLog();
    });

    // Event listener for form reset
    productForm.addEventListener('reset', () => {
        resetForm();
    });

    // Event listener for form submission
    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = readFormData();

        if (selectedRow === null) {
            // Check for duplicate product code
            if (isDuplicateCode(formData.productCode)) {
                showToast(`Product Code ${formData.productCode} already exists!`, true);
                return;
            }
            insertNewRecord(formData);
            addActivity(`Added product: ${formData.product}`);
            showToast('Product added to inventory');
        } else {
            // Check for duplicate product code (excluding current row)
            if (isDuplicateCode(formData.productCode, selectedRow)) {
                showToast(`Product Code ${formData.productCode} already exists!`, true);
                return;
            }
            const oldName = selectedRow.cells[2].textContent;
            updateRecord(formData);
            addActivity(`Updated product: ${oldName} -> ${formData.product}`);
            showToast('Product updated');
        }
        saveData();
        updateDashboard();
        resetForm();
    });

    // Function to read data from form fields
    function readFormData() {
        return {
            productCode: document.getElementById('productCode').value,
            product: document.getElementById('product').value,
            category: document.getElementById('category').value,
            qty: document.getElementById('qty').value,
            perPrice: document.getElementById('perPrice').value
        };
    }

    // Function to insert a new record into the table
    function insertNewRecord(data) {
        const newRow = storeList.insertRow();

        // Checkbox for bulk actions
        const cbCell = newRow.insertCell(0);
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.addEventListener('change', updateBulkDeleteButton);
        cbCell.appendChild(checkbox);

        newRow.insertCell(1).textContent = data.productCode;
        newRow.insertCell(2).textContent = data.product;
        newRow.insertCell(3).textContent = data.category || 'N/A';
        newRow.insertCell(4).textContent = data.qty;
        newRow.insertCell(5).textContent = data.perPrice;
        const actionCell = newRow.insertCell(6);

        // Check for low stock
        if (parseInt(data.qty) < LOW_STOCK_THRESHOLD) {
            newRow.classList.add('low-stock');
        }

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'edit-btn';
        editBtn.addEventListener('click', () => onEdit(newRow));

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', () => onDelete(newRow));

        actionCell.appendChild(editBtn);
        actionCell.appendChild(document.createTextNode(' '));
        actionCell.appendChild(deleteBtn);
    }

    // Function to populate form for editing
    function onEdit(row) {
        selectedRow = row;
        document.getElementById('productCode').value = row.cells[1].textContent;
        document.getElementById('product').value = row.cells[2].textContent;
        document.getElementById('category').value = row.cells[3].textContent !== 'N/A' ? row.cells[3].textContent : '';
        document.getElementById('qty').value = row.cells[4].textContent;
        document.getElementById('perPrice').value = row.cells[5].textContent;

        // Scroll to form for better UX
        productForm.scrollIntoView({ behavior: 'smooth' });
    }

    // Function to update an existing record
    function updateRecord(formData) {
        selectedRow.cells[1].textContent = formData.productCode;
        selectedRow.cells[2].textContent = formData.product;
        selectedRow.cells[3].textContent = formData.category;
        selectedRow.cells[4].textContent = formData.qty;
        selectedRow.cells[5].textContent = formData.perPrice;

        if (parseInt(formData.qty) < LOW_STOCK_THRESHOLD) {
            selectedRow.classList.add('low-stock');
        } else {
            selectedRow.classList.remove('low-stock');
        }

        selectedRow = null;
    }

    // Function to delete a record
    function onDelete(row) {
        if (confirm('Do you want to delete this record?')) {
            addActivity(`Deleted product: ${row.cells[2].textContent}`);
            row.remove();
            saveData();
            updateDashboard();
            updateBulkDeleteButton();
            resetForm();
            showToast('Product removed from inventory');
        }
    }

    // Function to export table data to CSV
    function exportToCSV() {
        const rows = [];
        const headers = ['Product Code', 'Product Name', 'Category', 'Quantity', 'Price'];
        rows.push(headers.join(','));

        for (let i = 0; i < storeList.rows.length; i++) {
            const row = storeList.rows[i];
            const rowData = [
                `"${row.cells[1].textContent}"`,
                `"${row.cells[2].textContent}"`,
                `"${row.cells[3].textContent}"`,
                row.cells[4].textContent,
                row.cells[5].textContent
            ];
            rows.push(rowData.join(','));
        }

        const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "pollos_hermanos_inventory.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Function to reset the form
    function resetForm() {
        productForm.reset();
        selectedRow = null;
    }

    // Function to save all table data to localStorage
    function saveData() {
        const products = [];
        for (let i = 0; i < storeList.rows.length; i++) {
            const row = storeList.rows[i];
            products.push({
                productCode: row.cells[1].textContent,
                product: row.cells[2].textContent,
                category: row.cells[3].textContent,
                qty: row.cells[4].textContent,
                perPrice: row.cells[5].textContent
            });
        }
        localStorage.setItem('products', JSON.stringify(products));
    }

    // Function to load data from localStorage
    function loadData() {
        const storedData = localStorage.getItem('products');
        if (storedData) {
            const products = JSON.parse(storedData);
            products.forEach(product => insertNewRecord(product));
        }
    }

    // Function to update dashboard values
    function updateDashboard() {
        let totalProducts = storeList.rows.length;
        let totalQty = 0;
        let totalValue = 0;
        let lowStockCount = 0;

        for (let i = 0; i < storeList.rows.length; i++) {
            const row = storeList.rows[i];
            const qty = parseInt(row.cells[4].textContent) || 0;
            const price = parseFloat(row.cells[5].textContent) || 0;
            totalQty += qty;
            totalValue += qty * price;

            if (qty < LOW_STOCK_THRESHOLD) {
                lowStockCount++;
            }
        }

        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('totalQty').textContent = totalQty;
        document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('lowStockCount').textContent = lowStockCount;
    }

    // Function to check for duplicate product codes
    function isDuplicateCode(code, excludeRow = null) {
        for (let i = 0; i < storeList.rows.length; i++) {
            const row = storeList.rows[i];
            if (row === excludeRow) continue;
            if (row.cells[1].textContent.toUpperCase() === code.toUpperCase()) {
                return true;
            }
        }
        return false;
    }

    // Function to show toast notifications
    function showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'error' : ''}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Function to sort table rows
    function sortRows(columnIndex) {
        const rows = Array.from(storeList.rows);
        const direction = (currentSort.column === columnIndex && currentSort.direction === 'asc') ? 'desc' : 'asc';

        rows.sort((a, b) => {
            let valA = a.cells[columnIndex].textContent.trim();
            let valB = b.cells[columnIndex].textContent.trim();

            // Handle numeric sorting for Qty and Price columns
            if (columnIndex === 4 || columnIndex === 5) {
                valA = parseFloat(valA) || 0;
                valB = parseFloat(valB) || 0;
            } else {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        // Update UI headers
        tableHeaders.forEach((th, idx) => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (idx === columnIndex) {
                th.classList.add(`sort-${direction}`);
            }
        });

        currentSort = { column: columnIndex, direction };

        // Re-append rows in sorted order
        rows.forEach(row => storeList.appendChild(row));
    }

    // Function to filter products based on search term
    function filterProducts(term) {
        for (let i = 0; i < storeList.rows.length; i++) {
            const row = storeList.rows[i];
            const code = row.cells[1].textContent.toLowerCase();
            const name = row.cells[2].textContent.toLowerCase();
            const category = row.cells[3].textContent.toLowerCase();

            if (code.includes(term) || name.includes(term) || category.includes(term)) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        }
    }

    // Function to update bulk delete button visibility
    function updateBulkDeleteButton() {
        const selectedCount = storeList.querySelectorAll('input[type="checkbox"]:checked').length;
        if (selectedCount > 0) {
            bulkDeleteBtn.style.display = 'block';
            bulkDeleteBtn.textContent = `Delete Selected (${selectedCount})`;
        } else {
            bulkDeleteBtn.style.display = 'none';
        }
    }

    // Function to add activity log entry
    function addActivity(text) {
        const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
        const newLog = {
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        logs.unshift(newLog);
        // Keep only last 10 entries
        if (logs.length > 10) logs.pop();
        localStorage.setItem('activityLogs', JSON.stringify(logs));
        renderActivityLog();
    }

    // Function to render activity log
    function renderActivityLog() {
        const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
        activityLog.innerHTML = logs.length ? '' : '<li class="activity-item">No recent activity</li>';
        logs.forEach(log => {
            const li = document.createElement('li');
            li.className = 'activity-item';
            li.innerHTML = `
                <span>${log.text}</span>
                <span class="activity-time">${log.time}</span>
            `;
            activityLog.appendChild(li);
        });
    }
});
