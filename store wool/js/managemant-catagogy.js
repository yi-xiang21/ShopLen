
async function fetchCategories() {
    try {
        const response = await fetch('api/catalogy.json');
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        const categoryList = document.getElementById('category-list');
        categoryList.innerHTML = '';

        // render categories
        data.categories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.setAttribute('data-id', category.id);

            categoryItem.innerHTML = `
                <p id="category-name">${category.name}</p>
                <div id="category-grid">
                    <div id="category-description">
                        <span id="category-description-title">Description :</span>
                        <span id="category-description-text">${category.description}</span>
                    </div>
                    <div class="category-actions">
                        <button class="btn btn-editcate" id="btn-edit-category">Edit</button>
                        <button class="btn btn-deletecate" id="btn-delete-category">Delete</button>
                    </div>
                </div>
            `;

            categoryList.appendChild(categoryItem);
        });

        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.btn-editcate').forEach(button => {
            button.addEventListener('click', function() {
                const categoryId = this.closest('.category-item').getAttribute('data-id');
                alert("da click vao edit")
                
            });
        });

        document.querySelectorAll('.btn-deletecate').forEach(button => {
            button.addEventListener('click', function() {
                const categoryId = this.closest('.category-item').getAttribute('data-id');
                // Placeholder for delete functionality
                alert("da click vao del")
                
            });
        });

    } catch (error) {
        console.error('Error fetching categories:', error);
        const categoryList = document.getElementById('category-list');
        categoryList.innerHTML = '<p>Error loading categories. Please try again later.</p>';
    }
}
document.addEventListener('DOMContentLoaded', function () {
    fetchCategories();
    const formadd=document.getElementById('form-catagory');
    const btnadd=document.getElementById('btn-add-category');
    const btnback=document.getElementById('btn-back-catalo');
    const listcatagories=document.getElementById('category-list-view');
    btnadd.addEventListener('click', () => {
        formadd.style.display='block';
        listcatagories.style.display='none';
        btnadd.style.display='none';
    });
    btnback.addEventListener('click', () => {
        formadd.style.display='none';
        listcatagories.style.display='block';
        btnadd.style.display='block';
    });
});

