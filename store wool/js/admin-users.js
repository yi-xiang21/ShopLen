//Quản lý Tài Khoản Người dùng
(function() {
	function getToken() {
		return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
	}
	function getRole() {
		return (localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || '').toLowerCase();
	}
	function api(endpoint, options = {}) {
		const url = (typeof getApiUrl !== 'undefined') ? getApiUrl(endpoint) : ((API_CONFIG?.BASE_URL || '') + endpoint);
		const headers = Object.assign({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() }, options.headers || {});
		return fetch(url, Object.assign({}, options, { headers }));
	}

	//Get user
	async function fetchUsers() {
		const res = await api('/users');
		if (res.status === 401) throw new Error('UNAUTHORIZED');
		if (res.status === 403) throw new Error('FORBIDDEN');
		if (!res.ok) throw new Error('Fetch users failed');
		return res.json();
	}

	//Render user hiển thị
	function renderUsers(users) {
		const tbody = document.querySelector('#usersTable tbody');
		if (!tbody) return;
		tbody.innerHTML = users.map(u => `
			<tr data-id="${u.id}">
				<td>${u.id}</td>
				<td>${u.name || ''}</td>
				<td>${u.username || ''}</td>
				<td>${u.email || ''}</td>
				<td>${u.phone || ''}</td>
				<td>${u.role || ''}</td>
				<td>
					<button class="btn-edit-user" data-id="${u.id}">Sửa</button>
					<button class="btn-delete-user" data-id="${u.id}">Xóa</button>
				</td>
			</tr>
		`).join('');
	}

	//Lấy dữ liệu form
	function getFormData(form) {
		const data = Object.fromEntries(new FormData(form).entries());
		//Xóa các trường rỗng
		Object.keys(data).forEach(k => { if (data[k] === '') delete data[k]; });
		return data;
	}

	async function createUser(payload) {
		const res = await api('/users', { method: 'POST', body: JSON.stringify(payload) });
		if (res.status === 401) throw new Error('UNAUTHORIZED');
		if (res.status === 403) throw new Error('FORBIDDEN');
		return res.json();
	}
	async function updateUser(id, payload) {
		const res = await api(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
		if (res.status === 401) throw new Error('UNAUTHORIZED');
		if (res.status === 403) throw new Error('FORBIDDEN');
		return res.json();
	}
	async function deleteUser(id) {
		const res = await api(`/users/${id}`, { method: 'DELETE' });
		if (res.status === 401) throw new Error('UNAUTHORIZED');
		if (res.status === 403) throw new Error('FORBIDDEN');
		return res.json();
	}

	document.addEventListener('DOMContentLoaded', async function() {
		if (!document.querySelector('.main-section[data-section="account-management"]')) return;

		//Kiểm tra token và quyền
		const token = getToken();
		const role = getRole();
		if (!token) {
			alert('Vui lòng đăng nhập để truy cập trang quản trị.');
			window.location.href = 'login.html';
			return;
		}
		if (role !== 'admin') {
			alert('Bạn không có quyền admin để truy cập mục này.');
			window.location.href = 'index.html';
			return;
		}

		//Tạo giao diện quản lý
		const container = document.querySelector('.main-section[data-section="account-management"]');
		container.insertAdjacentHTML('beforeend', `
			<div class="admin-accounts">
				<div class="toolbar">
					<button id="btnAddUser">+ Add User</button>
				</div>
				<table id="usersTable" class="users-table">
					<thead>
						<tr>
							<th>ID</th>
							<th>Name</th>
							<th>Username</th>
							<th>Email</th>
							<th>Phone</th>
							<th>Role</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody></tbody>
				</table>
			</div>

			<div id="userModal" class="modal" style="display:none;">
				<div class="modal-content">
					<h3 id="modalTitle">Add User</h3>
					<form id="userForm">
						<input type="hidden" name="id" />
						<label>Name</label>
						<input type="text" name="name" required />
						<label>Username</label>
						<input type="text" name="username" required />
						<label>Email</label>
						<input type="email" name="email" required />
						<label>Password <small>(để trống để giữ nguyên mật khẩu hiện tại)</small></label>
						<input type="password" name="password" />
						<label>Phone</label>
						<input type="text" name="phone" />
						<label>Role</label>
						<select name="role">
							<option value="khach_hang">khach_hang</option>
							<option value="nhan_vien">nhan_vien</option>
							<option value="admin">admin</option>
						</select>
						<div class="actions">
							<button type="submit" class="btn-save">Save</button>
							<button type="button" class="btn-cancel">Cancel</button>
						</div>
					</form>
				</div>
			</div>
		`);

		const modal = document.getElementById('userModal');
		const form = document.getElementById('userForm');
		const btnAdd = document.getElementById('btnAddUser');

		//Mở modal
		function openModal(title, user) {
			document.getElementById('modalTitle').textContent = title;
			form.reset();
			form.elements.id.value = user?.id || '';
			if (user) {
				form.elements.name.value = user.name || '';
				form.elements.username.value = user.username || '';
				form.elements.email.value = user.email || '';
				form.elements.phone.value = user.phone || '';
				form.elements.role.value = user.role || 'khach_hang';
			}
			modal.style.display = 'block';
		}
		function closeModal() { modal.style.display = 'none'; }

		//Button Add, Cancel
		btnAdd.addEventListener('click', () => openModal('Add User'));
		form.querySelector('.btn-cancel').addEventListener('click', closeModal);

		//Button Submit
		form.addEventListener('submit', async function(e) {
			e.preventDefault();
			const id = form.elements.id.value;
			const payload = getFormData(form);
			try {
				if (id) {
					const resp = await updateUser(id, payload);
					if (resp.status !== 'success') throw new Error(resp.message || 'Update failed');
				} else {
					if (!payload.password) return alert('Password là bắt buộc khi tạo mới');
					const resp = await createUser(payload);
					if (resp.status !== 'success') throw new Error(resp.message || 'Create failed');
				}
				await reload();
				closeModal();
			} catch (err) {
				if (err.message === 'UNAUTHORIZED') {
					alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
					window.location.href = 'login.html';
					return;
				}
				if (err.message === 'FORBIDDEN') {
					alert('Bạn không có quyền admin để thực hiện thao tác này.');
					return;
				}
				alert(err.message || 'Lỗi thao tác');
			}
		});

		//Xử lý Edit, Delete
		document.addEventListener('click', async function(e) {
			if (e.target.classList.contains('btn-edit-user')) {
				const tr = e.target.closest('tr');
				const id = tr.dataset.id;
				const user = {
					id,
					name: tr.children[1].textContent,
					username: tr.children[2].textContent,
					email: tr.children[3].textContent,
					phone: tr.children[4].textContent,
					role: tr.children[5].textContent
				};
				openModal('Edit User', user);
			}
			if (e.target.classList.contains('btn-delete-user')) {
				const id = e.target.dataset.id;
				const tr = e.target.closest('tr');
				const userName = tr ? tr.children[1].textContent : 'tài khoản này';
				if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${userName}"? Hành động này không thể hoàn tác.`)) return;
				try {
					const resp = await deleteUser(id);
					if (resp.status !== 'success') throw new Error(resp.message || 'Delete failed');
					alert('Đã xóa tài khoản thành công!');
					await reload();
				} catch (err) {
					if (err.message === 'UNAUTHORIZED') {
						alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
						window.location.href = 'login.html';
						return;
					}
					if (err.message === 'FORBIDDEN') {
						alert('Bạn không có quyền admin để thực hiện thao tác này.');
						return;
					}
					alert(err.message || 'Lỗi xóa tài khoản');
				}
			}
		});

		//Hàm load danh sách
		async function reload() {
			try {
				const data = await fetchUsers();
				renderUsers(data.users || []);
			} catch (err) {
				const tbody = document.querySelector('#usersTable tbody');
				if (err.message === 'UNAUTHORIZED') {
					alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
					window.location.href = 'login.html';
					return;
				}
				if (err.message === 'FORBIDDEN') {
					alert('Bạn không có quyền admin để truy cập danh sách người dùng.');
					window.location.href = 'index.html';
					return;
				}
				if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="color:red;">Không thể tải danh sách người dùng</td></tr>';
			}
		}

		reload();
	});
})();