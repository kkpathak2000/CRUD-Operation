document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('productForm');
    const storeList = document.getElementById('storeList').getElementsByTagName('tbody')[0];
    const searchInput = document.getElementById('searchInput');
    const exportBtn = document.getElementById('exportBtn');
    const tableHeaders = document.querySelectorAll('#storeList th');
    const toastContainer = document.getElementById('toastContainer');
    let selectedRow = null;
    let currentSort = { column: -1, direction: 'asc' };

    // Load data from localStorage on initialization
    loadData();
    updateDashboard();

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
        if (index < 5) { // Only sortable columns (Code, Name, Category, Qty, Price)
            th.addEventListener('click', () => {
                sortRows(index);
            });
        }
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
            showToast('Product added to inventory');
        } else {
            // Check for duplicate product code (excluding current row)
            if (isDuplicateCode(formData.productCode, selectedRow)) {
                showToast(`Product Code ${formData.productCode} already exists!`, true);
                return;
            }
            updateRecord(formData);
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
        newRow.insertCell(0).textContent = data.productCode;
        newRow.insertCell(1).textContent = data.product;
        newRow.insertCell(2).textContent = data.category || 'N/A';
        newRow.insertCell(3).textContent = data.qty;
        newRow.insertCell(4).textContent = data.perPrice;
        const actionCell = newRow.insertCell(5);

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
        document.getElementById('productCode').value = row.cells[0].textContent;
        document.getElementById('product').value = row.cells[1].textContent;
        document.getElementById('category').value = row.cells[2].textContent !== 'N/A' ? row.cells[2].textContent : '';
        document.getElementById('qty').value = row.cells[3].textContent;
        document.getElementById('perPrice').value = row.cells[4].textContent;

        // Scroll to form for better UX
        productForm.scrollIntoView({ behavior: 'smooth' });
    }

    // Function to update an existing record
    function updateRecord(formData) {
        selectedRow.cells[0].textContent = formData.productCode;
        selectedRow.cells[1].textContent = formData.product;
        selectedRow.cells[2].textContent = formData.category;
        selectedRow.cells[3].textContent = formData.qty;
        selectedRow.cells[4].textContent = formData.perPrice;
        selectedRow = null;
    }

    // Function to delete a record
    function onDelete(row) {
        if (confirm('Do you want to delete this record?')) {
            row.remove();
            saveData();
            updateDashboard();
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
                `"${row.cells[0].textContent}"`,
                `"${row.cells[1].textContent}"`,
                `"${row.cells[2].textContent}"`,
                row.cells[3].textContent,
                row.cells[4].textContent
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
                productCode: row.cells[0].textContent,
                product: row.cells[1].textContent,
                category: row.cells[2].textContent,
                qty: row.cells[3].textContent,
                perPrice: row.cells[4].textContent
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

        for (let i = 0; i < storeList.rows.length; i++) {
            const row = storeList.rows[i];
            const qty = parseInt(row.cells[3].textContent) || 0;
            const price = parseFloat(row.cells[4].textContent) || 0;
            totalQty += qty;
            totalValue += qty * price;
        }

        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('totalQty').textContent = totalQty;
        document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
    }

    // Function to check for duplicate product codes
    function isDuplicateCode(code, excludeRow = null) {
        for (let i = 0; i < storeList.rows.length; i++) {
            const row = storeList.rows[i];
            if (row === excludeRow) continue;
            if (row.cells[0].textContent.toUpperCase() === code.toUpperCase()) {
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
            if (columnIndex === 3 || columnIndex === 4) {
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
            const code = row.cells[0].textContent.toLowerCase();
            const name = row.cells[1].textContent.toLowerCase();
            const category = row.cells[2].textContent.toLowerCase();

            if (code.includes(term) || name.includes(term) || category.includes(term)) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        }
    }
});
