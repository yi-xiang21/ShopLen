document.addEventListener('DOMContentLoaded', () => {
  // Tránh chèn 2 lần
  if (document.querySelector('footer.footer[data-inserted="true"]')) return;

  const footerHTML = `
    <div class="footer-col">
        <p class="footer-logo">PeaceChill</p>
        <p class="footer-desc">Creating beautiful things, one stitch at a time.</p>
        <div class="footer-social">
            <a href="#"><i class="bi bi-facebook"></i></a>
            <a href="#"><i class="bi bi-instagram"></i></a>
            <a href="#"><i class="bi bi-youtube"></i></a>
        </div>
    </div>
    <div class="footer-col">
        <p class="footer-title">Shop</p>
        <ul>
            <li><a href="#">All Yarns</a></li>
            <li><a href="#">Merino Wool</a></li>
            <li><a href="#">Alpaca Blend</a></li>
            <li><a href="#">Organic Cotton</a></li>
            <li><a href="#">Hand-Dyed Specialty</a></li>
        </ul>
    </div>
    <div class="footer-col">
        <p class="footer-title">Learn</p>
        <ul>
            <li><a href="#">Workshops</a></li>
            <li><a href="#">Tutorials</a></li>
            <li><a href="#">Patterns</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Community</a></li>
        </ul>
    </div>
    <div class="footer-col">
        <p class="footer-title">Customer Care</p>
        <ul>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Shipping & Returns</a></li>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Store Locations</a></li>
            <li><a href="about.html">About Us</a></li>
        </ul>
    </div>
  `;

  const footerEl = document.createElement('footer');
  footerEl.className = 'footer';
  footerEl.setAttribute('data-inserted', 'true');
  footerEl.innerHTML = footerHTML;

  const placeholder = document.getElementById('footer-placeholder') || document.querySelector('[data-insert-footer]');
  if (placeholder) {
    placeholder.replaceWith(footerEl);
  } else {
    document.body.appendChild(footerEl);
  }
});