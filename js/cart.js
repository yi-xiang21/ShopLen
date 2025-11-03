document.addEventListener('DOMContentLoaded', () => {
    const totalPriceshop = document.getElementById('total-price'); 
    const costPrice = document.querySelector('.price-col');
    const totalCol = document.querySelector('.total-col');

    // Function to calculate and update the overall total
    function updateOverallTotal() {
        let overallTotal = 0;
        document.querySelectorAll('.cart-row').forEach(row => {
            const totalCol = row.querySelector('.total-col');
            const totalText = totalCol.textContent.replace('₫', '').replace(/\./g, '').trim();
            const total = parseInt(totalText, 10) || 0;
            overallTotal += total;
        });
        totalPriceshop.textContent = overallTotal.toLocaleString() + 'd';
    }

  document.querySelectorAll('.cart-row').forEach(row => {
    const input = row.querySelector('.qty-input');
    const btnInc = row.querySelector('[data-action="inc"]');
    const btnDec = row.querySelector('[data-action="dec"]');
    const btnRemove = row.querySelector('#remove-cart');
    const priceCol = row.querySelector('.price-col');
    const totalCol = row.querySelector('.total-col');

    // Function to update the total for this row
    function updateRowTotal() {
        const priceText = priceCol.textContent.replace('₫', '').replace(/\./g, '').trim();
        const price = parseInt(priceText, 10) || 0;
        const qty = parseInt(input.value, 10) || 1;
        const total = price * qty;
        totalCol.textContent = total.toLocaleString() + '₫';
        updateOverallTotal();
    }

    // Xóa sản phẩm khỏi giỏ hàng khi nhấn nút "Xóa"
    btnRemove.addEventListener('click', (e) => {
      e.preventDefault();
      row.remove();
      updateOverallTotal();
    });

    // Chỉ cho nhập số, tự động ép về số >= 1
    input.addEventListener('input', () => {
      let val = input.value.replace(/\D/g, ''); // loại bỏ ký tự không phải số
      input.value = val;
      if(val === '') {
        input.value = 1;
      }
      updateRowTotal();
    });

    // Tăng số lượng
    btnInc.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Nút tăng được click'); // kiểm tra event
      let val = parseInt(input.value, 10) || 1;
      val++;
      input.value = val;
      updateRowTotal();
    });

    // Giảm số lượng, tối thiểu là 1
    btnDec.addEventListener('click', (e) => {
      e.preventDefault();
      let val = parseInt(input.value, 10) || 1;
      val = Math.max(0, val - 1);
      if (val === 0) {
        // Xóa sản phẩm khỏi giỏ hàng nếu số lượng về 0
        row.remove();
        updateOverallTotal();
      } else {
      input.value = val;
      updateRowTotal();
      }

    });

    // Initial calculation for existing items
    updateRowTotal();
  });
});
