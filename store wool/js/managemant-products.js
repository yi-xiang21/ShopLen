        // Khai báo biến global
        let inputname, inputcatalogy, inputprice, inputdescription, inputimg, inputType;
        let btnAdd, btnBack, listView, addView, variantContainer, btnAddVariant, form , selectType ,productBackToSelect;

        //nut search(chua viet)

        //tinh nang sort (chua viet)


        // product-level images list and add button (DOM refs)
        let productImagesList, btnAddProductImg;

        // Hàm reset form thủ công (vì addProductForm là div, không phải form)
        function resetForm() {
            if (inputname) inputname.value = '';
            if (inputcatalogy) inputcatalogy.value = '';
            if (inputprice) inputprice.value = '';
            if (inputdescription) inputdescription.value = '';
            if (inputimg) inputimg.value = '';
            if (variantContainer) variantContainer.innerHTML = '';
            if (productImagesList) {
                productImagesList.innerHTML = '';
                productImagesList.appendChild(createProductImageRow('', false));
            }
        }

        // Hàm thêm variant vào form (dùng chung cho add và edit)
        function addVariantToForm(variant = null) {
            const variantDiv = document.createElement('div');
            variantDiv.classList.add('variant-item');

            // If variant.image is array convert to array else single string
            const images = variant ? (Array.isArray(variant.image) ? variant.image : (variant.image ? [variant.image] : [])) : [];

            variantDiv.innerHTML = `
            <div class="variant-fields">
                <label>Color:</label>
                <input type="text" name="variantColor" placeholder="red" value="${variant ? (variant.color || '') : ''}">

                <label>Size:</label>
                <input type="text" name="variantSize" placeholder="100gr" value="${variant ? (variant.size || '') : ''}">

                <label>Material:</label>
                <input type="text" name="variantMaterial" placeholder="Cotton" value="${variant ? (variant.material || '') : ''}">

                <label>Images:</label>
                <div class="images-list">
                    <!-- image inputs will be injected here -->
                </div>

                <label>Extra Price:</label>
                <input type="number" name="variantPriceExtra" step="0.01" value="${variant ? (variant.priceExtra || 0) : 0}">

                <label>Stock:</label>
                <input type="number" name="variantStock" step="1" value="${variant ? (variant.stock || 0) : 0}">

                <div class="variant-actions">
                    <button type="button" class="btn btn-remove-variant">Remove Variant</button>
                    <button type="button" class="btn btn-add-img">Thêm hình</button>
                </div>
            </div>
        `;
            variantContainer.appendChild(variantDiv);
            function setupVariantImagesUI() {
            const imagesList = variantDiv.querySelector('.images-list');
            // helper to create one image row (input + optional remove button)
            // removable === false => do not render remove button (used for first/default image)
            function createImageRow(value = '', removable = true) {
                const row = document.createElement('div');
                row.classList.add('image-row');
                if (removable) {
                    row.innerHTML = `
                        <input type="file" name="variantImage" class="variant-image-input" value="${value}">
                        <button type="button" class="btn btn-remove-image">Xóa</button>
                    `;
                    // xóa input thêm hình
                    row.querySelector('.btn-remove-image').addEventListener('click', () => row.remove());
                } else {
                    row.innerHTML = `
                        <input type="file" name="variantImage" class="variant-image-input" value="${value}">
                    `;
                }
                return row;
            }

            // khởi tạo input hình: luôn giữ 1 input không được xóa (là input đầu tiên)
            if (images.length) {
                images.forEach((img, idx) => imagesList.appendChild(createImageRow(img, idx > 0)));
            } else {
                // hiển thị 1 input trống, không được xóa
                imagesList.appendChild(createImageRow('', false));
            }

            // sự kiện nút thêm hình (các input mới có thể xóa được)
            variantDiv.querySelector('.btn-add-img').addEventListener('click', () => {
                imagesList.appendChild(createImageRow('', true));
            });
            }
            // Khởi tạo UI quản lý hình ảnh cho variant
            setupVariantImagesUI();

            // Thêm sự kiện xóa variant
            variantDiv.querySelector('.btn-remove-variant').addEventListener('click', () => {
                variantDiv.remove();
            });
        }

        // Trả về dữ liệu của một variant DOM element, thu thập tất cả image inputs thành mảng
        function getVariantData(variantDiv) {
            return {
                color: variantDiv.querySelector('[name="variantColor"]').value,
                size: variantDiv.querySelector('[name="variantSize"]').value,
                material: variantDiv.querySelector('[name="variantMaterial"]').value,
                images: Array.from(variantDiv.querySelectorAll('.variant-image-input')).map(i => i.value).filter(v => v && v.trim() !== ''),
                priceExtra: parseFloat(variantDiv.querySelector('[name="variantPriceExtra"]').value) || 0,
                stock: parseInt(variantDiv.querySelector('[name="variantStock"]').value) || 0
            };
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
            const productImages = product.image ? (Array.isArray(product.image) ? product.image : [product.image]) : [];
            initProductImages(productImages);
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
            //code xoa sp o day
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
        function fetchCatalogy() {
            //code fetch catalogy o day
            fetch('api/catalogy.json')
                .then(res => res.json())
                .then(data => {
                    data.categories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.id;
                        option.textContent = category.name;
                        inputcatalogy.appendChild(option);
                    });
                })
                .catch(error => {
                    console.error('Error loading categories:', error);
                });
        };
        document.addEventListener('DOMContentLoaded', function () {
            setupSidebarTabs();
            fetchCatalogy();
            //lua chon sp
            selectType = document.getElementById('selecttype');
            //cac input formsp
            inputname = document.getElementById('productName');
            inputcatalogy = document.getElementById('productCategory');
            inputprice = document.getElementById('productPrice');
            inputdescription = document.getElementById('productDescription');
            productImagesList = document.getElementById('productImagesList');
            btnAddProductImg = document.getElementById('btnAddProductImg');
            inputType = document.getElementById('inputType');
            //end tinh nang edit sp\
            //nút them sp
            btnAdd = document.getElementById('btn-add');
            //tro ve trang chu quan ly sp
            btnBackToView = document.getElementById('btnBackToList');
            //len tro ve lua chon loai sp
            productBackToSelect = document.getElementById('productBackToSelect');


            listView = document.getElementById('product-list-view');
            addView = document.getElementById('add-product-view');
            variantContainer = document.getElementById('variantContainer');
            btnAddVariant = document.getElementById('btnAddVariant');
            formLen = document.getElementById('productForm');
            // formWorkshop = document.getElementById('workshopForm');

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
            // Ensure product images UI exists and initialize
            if (productImagesList && productImagesList.children.length === 0) {
                const initial = inputimg && inputimg.value ? (inputimg.value.split(',').map(s => s.trim()).filter(Boolean)) : [];
                initProductImages(initial);
            }
            if (btnAddProductImg) {
                btnAddProductImg.addEventListener('click', () => {
                    if (productImagesList) productImagesList.appendChild(createProductImageRow('', true));
                });
            }
            btnAdd.addEventListener('click', () => {
                selectType.style.display='block'  
                listView.style.display = 'none';
                btnAdd.style.display = 'none';          
            });
            // Chọn loại sản phẩm
            document.getElementById("btnSelectType").addEventListener("click", function (e) {
                let type = document.getElementById("productType").value;
                let textType = document.getElementById("productType").options[document.getElementById("productType").selectedIndex].text;
                // Hiện đúng loại
                if (type === "0" || type === "1") 
                {
                    resetForm();
                    inputType.value = textType;
                    selectType.style.display='none';
                    addView.style.display = "block";
                    formLen.style.display = "block";
                }
                // if (type === "1") 
                // {
                //     alert("da chon cong cu");
                //     // resetForm();
                //     // selectType.style.display='none';
                //     // addView.style.display = "block";
                //     // formLen.style.display = "block";    
                                    
                // }
                if (type === "2") {
                    resetForm();
                    //formLen.style.display = "none";
                    // selectType.style.display='none';
                    // addView.style.display = "block";
                    // formWorkshop.style.display = "block";
                    alert('Workshop chua viet');
                }
            });
            //tro ve trnag chinh quan ly sp
            btnBackToView.addEventListener('click', () => {
                if (addView) {
                    addView.style.display = 'none';
                }
                if(selectType)
                {
                    selectType.style.display='none';
                }
                if (listView) {
                    listView.style.display = 'block';
                }
                if (btnAdd) {
                    btnAdd.style.display = 'inline-block';
                }
                resetForm();
                if (addView) {
                    addView.removeAttribute('data-edit-id');
                    const formTitle = addView.querySelector('h3');
                    if (formTitle) {
                        formTitle.textContent = 'Add New Product';
                    }
                }
            });
            // tro ve lua chon loia sp
            productBackToSelect.addEventListener('click',() =>{
                if (addView) {
                    addView.style.display = 'none';
                }
                if(selectType)
                {
                    selectType.style.display='block';
                }
                resetForm();
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
                    <p class="item-price">Price: ${product.price}k</p>
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

        // Create product-level image input row (removable=false => no delete button)
        function createProductImageRow(value = '', removable = true) {
            const row = document.createElement('div');
            row.classList.add('product-image-row');
            if (removable) {
                row.innerHTML = `
                    <input type="file" name="productImageInput" class="product-image-input" value="${value}">
                    <button type="button" class="btn btn-remove-product-image">Xóa</button>
                `;
                row.querySelector('.btn-remove-product-image').addEventListener('click', () => row.remove());
            } else {
                row.innerHTML = `
                    <input type="file" name="productImageInput" class="product-image-input" value="${value}">
                `;
            }
            return row;
        }

        // Initialize product-level images list with an array of image URLs
        function initProductImages(images = []) {
            if (!productImagesList) return;
            productImagesList.innerHTML = '';
            if (images && images.length) {
                images.forEach((img, idx) => productImagesList.appendChild(createProductImageRow(img, idx > 0)));
            } else {
                productImagesList.appendChild(createProductImageRow('', false));
            }
        }

        // Collect product-level images into an array (filter out empty)
        function getProductImages() {
            if (!productImagesList) return [];
            return Array.from(productImagesList.querySelectorAll('.product-image-input')).map(i => i.value).filter(v => v && v.trim() !== '');
        }