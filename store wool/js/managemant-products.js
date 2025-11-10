        // Khai báo biến global
        let inputname, inputcatalogy, inputprice, inputdescription, inputimg, inputtype;
        let btnAdd, btnBack, listView, addView, variantContainer, btnAddVariant, form;

        //nut search(chua viet)

        //tinh nang sort (chua viet)


        // Hàm reset form thủ công (vì addProductForm là div, không phải form)
        function resetForm() {
            if (inputname) inputname.value = '';
            if (inputcatalogy) inputcatalogy.value = '';
            if (inputprice) inputprice.value = '';
            if (inputdescription) inputdescription.value = '';
            if (inputimg) inputimg.value = '';
            if (inputtype) inputtype.value = 'san_pham';
            if (variantContainer) variantContainer.innerHTML = '';
        }

        // Hàm thêm variant vào form (dùng chung cho add và edit)
        function addVariantToForm(variant = null) {
            const variantDiv = document.createElement('div');
            variantDiv.classList.add('variant-item');
            variantDiv.innerHTML = `
            <div class="variant-fields">
                <label>Color:</label>
                <input type="text" name="variantColor" placeholder="red" value="${variant ? (variant.color || '') : ''}">

                <label>Size:</label>
                <input type="text" name="variantSize" placeholder="100gr" value="${variant ? (variant.size || '') : ''}">

                <label>Material:</label>
                <input type="text" name="variantMaterial" placeholder="Cotton" value="${variant ? (variant.material || '') : ''}">

                <label>Image URL:</label>
                <input type="text" name="variantImage" placeholder="Image URL" value="${variant ? (variant.image || '') : ''}">

                <label>Extra Price:</label>
                <input type="number" name="variantPriceExtra" step="0.01" value="${variant ? (variant.priceExtra || 0) : 0}">

                <label>Stock:</label>
                <input type="number" name="variantStock" step="1" value="${variant ? (variant.stock || 0) : 0}">

                <button type="button" class="btn btn-remove-variant">Remove</button>
            </div>
        `;
            variantContainer.appendChild(variantDiv);

            // Thêm sự kiện xóa
            variantDiv.querySelector('.btn-remove-variant').addEventListener('click', () => {
                variantDiv.remove();
            });
        }

        // Hàm load sản phẩm vào form để edit
        async function loadProductToForm(productId) {

            if (!inputname || !inputcatalogy || !inputprice || !variantContainer || !listView || !addView || !btnAdd) {
                alert('Vui lòng đợi trang tải xong!');
                return;
            }

            // Fetch dữ liệu từ JSON
            const response = await fetch('api/item-management.json');
            const data = await response.json();

            // Tìm sản phẩm theo ID
            const product = data.items.find(item => item.id === productId);

            // Điền thông tin sản phẩm vào form
            inputname.value = product.name || '';
            inputcatalogy.value = product.category || '';
            inputprice.value = product.price || 0;
            inputdescription.value = product.description || '';
            inputimg.value = product.image || '';
            inputtype.value = product.type || 'san_pham';

            // Xóa các variants cũ
            variantContainer.innerHTML = '';

            // Hiển thị các variants
            if (product.variants && product.variants.length > 0) {
                product.variants.forEach(variant => {
                    addVariantToForm(variant);
                });
            }

            // Chuyển sang view edit
            listView.style.display = 'none';
            addView.style.display = 'block';
            btnAdd.style.display = 'none';

            // Thay đổi tiêu đề form
            const formTitle = addView.querySelector('h3');
            if (formTitle) {
                formTitle.textContent = 'Edit Product';
            }

            // Lưu productId để dùng khi save
            addView.setAttribute('data-edit-id', productId);




        }
        // ham save (can chinh sua them ktra dau vao )
        // document.querySelector('.btn-save').addEventListener('click', function () {
        //     const editId = addView.getAttribute('data-edit-id');

        //     // Thu thập dữ liệu từ input
        //     const newProduct = {
        //         id: editId ? parseInt(editId) : Date.now(), // nếu có id => update, nếu không => thêm mới
        //         name: inputname.value,
        //         category: inputcatalogy.value,
        //         price: parseFloat(inputprice.value),
        //         description: inputdescription.value,
        //         image: inputimg.value,
        //         type: inputtype.value,
        //         variants: Array.from(variantContainer.querySelectorAll('.variant-item')).map(v => ({
        //             color: v.querySelector('[name="variantColor"]').value,
        //             size: v.querySelector('[name="variantSize"]').value,
        //             material: v.querySelector('[name="variantMaterial"]').value,
        //             image: v.querySelector('[name="variantImage"]').value,
        //             priceExtra: parseFloat(v.querySelector('[name="variantPriceExtra"]').value),
        //             stock: parseInt(v.querySelector('[name="variantStock"]').value)
        //         }))
        //     };

        //     // Nếu edit => cập nhật trong mảng
        //     if (editId) {
        //         const index = productsData.findIndex(p => p.id == editId);
        //         if (index !== -1) {
        //             productsData[index] = newProduct;
        //         }
        //     }
        //     // Nếu không có id => thêm mới
        //     else {
        //         productsData.push(newProduct);
        //     }

        // goi api luu
        // fetch('/api/save-product', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(newProduct)
        // })
        //     .then(res => res.json())
        //     .then(result => {
        //         console.log('Đã lưu:', result);
        //     })
        //     .catch(err => console.error('Lỗi lưu:', err));

        // Quay lại view danh sách
        //     addView.style.display = 'none';
        //     listView.style.display = 'block';
        //     renderProducts();
        // });

        // Hàm setup edit buttons
        function setupEditButtons() {
            const editButtons = document.querySelectorAll('.btn-edit[data-product-id]');
            editButtons.forEach(btn => {
                btn.addEventListener('click', async function () {
                    const productId = this.getAttribute('data-product-id');
                    await loadProductToForm(productId);
                });
            });
        }
        // Hàm xóa sản phẩm
        async function deleteProduct(productId) {
            // Xác nhận xóa
            if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
                return;
            }
            // Fetch dữ liệu hiện tại
            const response = await fetch('api/item-management.json');
            const data = await response.json();

            // Tìm và xóa sản phẩm
            const index = data.items.findIndex(item => item.id === productId);
            if (index !== -1) {
                data.items.splice(index, 1);

                // Xóa khỏi productsData
                const productIndex = productsData.findIndex(item => item.id === productId);
                if (productIndex !== -1) {
                    productsData.splice(productIndex, 1);
                }


                alert('Xóa sản phẩm thành công!');

                // Reload danh sách
                renderProducts();
            } else {
                alert('Không tìm thấy sản phẩm để xóa!');

            }
        }

        // Hàm setup delete buttons
        function setupDeleteButtons() {
            const delButtons = document.querySelectorAll('.btn-delete[data-product-id]');
            delButtons.forEach(btn => {
                btn.addEventListener('click', async function () {
                    const productId = this.getAttribute('data-product-id');
                    await deleteProduct(productId);
                });
            });
        }
        
        document.addEventListener('DOMContentLoaded', function () {
            setupSidebarTabs();

            //cac input formsp
            inputname = document.getElementById('productName');
            inputcatalogy = document.getElementById('productCategory');
            inputprice = document.getElementById('productPrice');
            inputdescription = document.getElementById('productDescription');
            inputimg = document.getElementById('productImage');
            inputtype = document.getElementById('productType');

            //end tinh nang edit sp
            btnAdd = document.getElementById('btn-add');
            btnBack = document.getElementById('btnBackToList');
            listView = document.getElementById('product-list-view');
            addView = document.getElementById('add-product-view');
            variantContainer = document.getElementById('variantContainer');
            btnAddVariant = document.getElementById('btnAddVariant');
            form = document.getElementById('addProductForm');

            // Kiểm tra các element có tồn tại không
            if (!variantContainer) {
                console.error('Không tìm thấy variantContainer');
            }
            if (!addView) {
                console.error('Không tìm thấy add-product-view');
            }
            if (!listView) {
                console.error('Không tìm thấy product-list-view');
            }
            // Toggle view
            btnAdd.addEventListener('click', () => {
                // Reset form khi thêm mới
                resetForm();
                if (addView) {
                    addView.removeAttribute('data-edit-id');
                    const formTitle = addView.querySelector('h3');
                    if (formTitle) {
                        formTitle.textContent = 'Add New Product';
                    }
                }
                if (listView) {
                    listView.style.display = 'none';
                }
                if (addView) {
                    addView.style.display = 'block';
                }
                if (btnAdd) {
                    btnAdd.style.display = 'none';
                }
            });
            btnBack.addEventListener('click', () => {
                if (addView) {
                    addView.style.display = 'none';
                }
                if (listView) {
                    listView.style.display = 'block';
                }
                if (btnAdd) {
                    btnAdd.style.display = 'inline-block';
                }
                // Reset form
                resetForm();
                if (addView) {
                    addView.removeAttribute('data-edit-id');
                    const formTitle = addView.querySelector('h3');
                    if (formTitle) {
                        formTitle.textContent = 'Add New Product';
                    }
                }
            });

            // Thêm biến thể
            btnAddVariant.addEventListener('click', () => {
                addVariantToForm();
            });
        });


        let currentPage = 0;
        const pageSize = 8;
        let productsData = [];
        let filteredData = null;
        function print(products) {
            const list = document.getElementById('grid-item');
            const showProducts = products.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
            list.innerHTML = showProducts.map(product => `
                <div class="card-item">
                    <img src="${product.image}" alt="${product.name}">
                    <h3 class="item-name">${product.name}</h3>
                    <p class="item-category">Category: ${product.category}</p>
                    <p class="item-price">Price: $${product.price.toFixed(2)}</p>
                    <p class="item-stock">Stock: ${product.stock || 0}</p>
                    <div class="card-actions">
                        <button class="btn btn-edit" data-product-id="${product.id}">Edit</button>
                        <button class="btn btn-delete" data-product-id="${product.id}">Delete</button>
                    </div>
                </div>
            `).join('');

            // Thêm event listener cho các nút edit và delete sau khi render
            setupEditButtons();
            setupDeleteButtons();

        }

        function renderProducts() {
            const data = filteredData !== null ? filteredData : productsData;
            print(data);
        }

        // Fetch products from JSON file
        fetch('api/item-management.json')
            .then(res => res.json())
            .then(data => {
                productsData = data.items;
                renderProducts();
            })
            .catch(error => {
                console.error('Error loading products:', error);
            });

        function next() {
            const data = filteredData !== null ? filteredData : productsData;
            if ((currentPage + 1) * pageSize < data.length) {
                currentPage++;
                renderProducts();
            }
        }

        function prev() {
            if (currentPage > 0) {
                currentPage--;
                renderProducts();
            }
        }