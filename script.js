document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('productForm');
    const storeList = document.getElementById('storeList').getElementsByTagName('tbody')[0];
    const searchInput = document.getElementById('searchInput');
    const exportBtn = document.getElementById('exportBtn');
    let selectedRow = null;

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
            insertNewRecord(formData);
        } else {
            updateRecord(formData);
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
