document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('productForm');
    const storeList = document.getElementById('storeList').getElementsByTagName('tbody')[0];
    let selectedRow = null;

    // Load data from localStorage on initialization
    loadData();

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
        resetForm();
    });

    // Function to read data from form fields
    function readFormData() {
        return {
            productCode: document.getElementById('productCode').value,
            product: document.getElementById('product').value,
            qty: document.getElementById('qty').value,
            perPrice: document.getElementById('perPrice').value
        };
    }

    // Function to insert a new record into the table
    function insertNewRecord(data) {
        const newRow = storeList.insertRow();
        newRow.insertCell(0).textContent = data.productCode;
        newRow.insertCell(1).textContent = data.product;
        newRow.insertCell(2).textContent = data.qty;
        newRow.insertCell(3).textContent = data.perPrice;
        const actionCell = newRow.insertCell(4);

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
        document.getElementById('qty').value = row.cells[2].textContent;
        document.getElementById('perPrice').value = row.cells[3].textContent;

        // Scroll to form for better UX
        productForm.scrollIntoView({ behavior: 'smooth' });
    }

    // Function to update an existing record
    function updateRecord(formData) {
        selectedRow.cells[0].textContent = formData.productCode;
        selectedRow.cells[1].textContent = formData.product;
        selectedRow.cells[2].textContent = formData.qty;
        selectedRow.cells[3].textContent = formData.perPrice;
        selectedRow = null;
    }

    // Function to delete a record
    function onDelete(row) {
        if (confirm('Do you want to delete this record?')) {
            row.remove();
            saveData();
            resetForm();
        }
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
                qty: row.cells[2].textContent,
                perPrice: row.cells[3].textContent
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
});
