// //Quản lý Tài Khoản Người dùng
// (function() {
// 	function getToken() {
// 		return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
// 	}
// 	function getRole() {
// 		return (localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || '').toLowerCase();
// 	}
// 	function api(endpoint, options = {}) {
// 		const url = (typeof getApiUrl !== 'undefined') ? getApiUrl(endpoint) : ((API_CONFIG?.BASE_URL || '') + endpoint);
// 		const headers = Object.assign({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() }, options.headers || {});
// 		return fetch(url, Object.assign({}, options, { headers }));
// 	}

// 	async function fetchUsers() {
// 		const res = await api('/users');
// 		if (res.status === 401) throw new Error('UNAUTHORIZED');
// 		if (res.status === 403) throw new Error('FORBIDDEN');
// 		if (!res.ok) throw new Error('Fetch users failed');
// 		return res.json();
// 	}

// 	function renderUsers(users) {
// 		const tbody = document.querySelector('#usersTable tbody');
// 		if (!tbody) return;
// 		tbody.innerHTML = users.map(u => `
// 			<tr data-id="${u.id}">
// 				<td>${u.id}</td>
// 				<td>${u.name || ''}</td>
// 				<td>${u.username || ''}</td>
// 				<td>${u.email || ''}</td>
// 				<td>${u.phone || ''}</td>
// 				<td>${u.role || ''}</td>
// 				<td>
// 					<button class="btn-edit" data-id="${u.id}">Edit</button>
// 					<button class="btn-delete" data-id="${u.id}">Delete</button>
// 				</td>
// 			</tr>
// 		`).join('');
// 	}

// 	function getFormData(form) {
// 		const data = Object.fromEntries(new FormData(form).entries());
// 		//Xóa các trường rỗng
// 		Object.keys(data).forEach(k => { if (data[k] === '') delete data[k]; });
// 		return data;
// 	}

// 	async function createUser(payload) {
// 		const res = await api('/users', { method: 'POST', body: JSON.stringify(payload) });
// 		if (res.status === 401) throw new Error('UNAUTHORIZED');
// 		if (res.status === 403) throw new Error('FORBIDDEN');
// 		return res.json();
// 	}
// 	async function updateUser(id, payload) {
// 		const res = await api(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
// 		if (res.status === 401) throw new Error('UNAUTHORIZED');
// 		if (res.status === 403) throw new Error('FORBIDDEN');
// 		return res.json();
// 	}
// 	async function deleteUser(id) {
// 		const res = await api(`/users/${id}`, { method: 'DELETE' });
// 		if (res.status === 401) throw new Error('UNAUTHORIZED');
// 		if (res.status === 403) throw new Error('FORBIDDEN');
// 		return res.json();
// 	}

// 	document.addEventListener('DOMContentLoaded', async function() {
// 		if (!document.querySelector('.main-section[data-section="account-management"]')) return;

// 		// //Kiểm tra token và quyền
// 		// const token = getToken();
// 		// const role = getRole();
// 		// if (!token) {
// 		// 	alert('Vui lòng đăng nhập để truy cập trang quản trị.');
// 		// 	window.location.href = 'login.html';
// 		// 	return;
// 		// }
// 		// if (role !== 'admin') {
// 		// 	alert('Bạn không có quyền admin để truy cập mục này.');
// 		// 	window.location.href = 'index.html';
// 		// 	return;
// 		// }

// 		const container = document.querySelector('.main-section[data-section="account-management"]');
// 		container.insertAdjacentHTML('beforeend', `
// 			<div class="admin-accounts">
// 				<div class="toolbar">
// 					<button id="btnAddUser">+ Add User</button>
// 				</div>
// 				<table id="usersTable" class="users-table">
// 					<thead>
// 						<tr>
// 							<th>ID</th>
// 							<th>Name</th>
// 							<th>Username</th>
// 							<th>Email</th>
// 							<th>Phone</th>
// 							<th>Role</th>
// 							<th>Actions</th>
// 						</tr>
// 					</thead>
// 					<tbody></tbody>
// 				</table>
// 			</div>

// 			<div id="userModal" class="modal" style="display:none;">
// 				<div class="modal-content">
// 					<h3 id="modalTitle">Add User</h3>
// 					<form id="userForm">
// 						<input type="hidden" name="id" />
// 						<label>Name</label>
// 						<input type="text" name="name" required />
// 						<label>Username</label>
// 						<input type="text" name="username" required />
// 						<label>Email</label>
// 						<input type="email" name="email" required />
// 						<label>Password <small>(để trống để giữ nguyên mật khẩu hiện tại)</small></label>
// 						<input type="password" name="password" />
// 						<label>Phone</label>
// 						<input type="text" name="phone" />
// 						<label>Role</label>
// 						<select name="role">
// 							<option value="khach_hang">khach_hang</option>
// 							<option value="nhan_vien">nhan_vien</option>
// 							<option value="admin">admin</option>
// 						</select>
// 						<div class="actions">
// 							<button type="submit" class="btn-save">Save</button>
// 							<button type="button" class="btn-cancel">Cancel</button>
// 						</div>
// 					</form>
// 				</div>
// 			</div>
// 		`);

// 		const modal = document.getElementById('userModal');
// 		const form = document.getElementById('userForm');
// 		const btnAdd = document.getElementById('btnAddUser');

// 		function openModal(title, user) {
// 			document.getElementById('modalTitle').textContent = title;
// 			form.reset();
// 			form.elements.id.value = user?.id || '';
// 			if (user) {
// 				form.elements.name.value = user.name || '';
// 				form.elements.username.value = user.username || '';
// 				form.elements.email.value = user.email || '';
// 				form.elements.phone.value = user.phone || '';
// 				form.elements.role.value = user.role || 'khach_hang';
// 			}
// 			modal.style.display = 'block';
// 		}
// 		function closeModal() { modal.style.display = 'none'; }

// 		btnAdd.addEventListener('click', () => openModal('Add User'));
// 		form.querySelector('.btn-cancel').addEventListener('click', closeModal);

// 		form.addEventListener('submit', async function(e) {
// 			e.preventDefault();
// 			const id = form.elements.id.value;
// 			const payload = getFormData(form);
// 			try {
// 				if (id) {
// 					const resp = await updateUser(id, payload);
// 					if (resp.status !== 'success') throw new Error(resp.message || 'Update failed');
// 				} else {
// 					if (!payload.password) return alert('Password là bắt buộc khi tạo mới');
// 					const resp = await createUser(payload);
// 					if (resp.status !== 'success') throw new Error(resp.message || 'Create failed');
// 				}
// 				await reload();
// 				closeModal();
// 			} catch (err) {
// 				if (err.message === 'UNAUTHORIZED') {
// 					alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
// 					window.location.href = 'login.html';
// 					return;
// 				}
// 				if (err.message === 'FORBIDDEN') {
// 					alert('Bạn không có quyền admin để thực hiện thao tác này.');
// 					return;
// 				}
// 				alert(err.message || 'Lỗi thao tác');
// 			}
// 		});

// 		document.addEventListener('click', async function(e) {
// 			if (e.target.classList.contains('btn-edit')) {
// 				const tr = e.target.closest('tr');
// 				const id = tr.dataset.id;
// 				const user = {
// 					id,
// 					name: tr.children[1].textContent,
// 					username: tr.children[2].textContent,
// 					email: tr.children[3].textContent,
// 					phone: tr.children[4].textContent,
// 					role: tr.children[5].textContent
// 				};
// 				openModal('Edit User', user);
// 			}
// 			if (e.target.classList.contains('btn-delete')) {
// 				const id = e.target.dataset.id;
// 				if (!confirm('Xóa tài khoản này?')) return;
// 				try {
// 					const resp = await deleteUser(id);
// 					if (resp.status !== 'success') throw new Error(resp.message || 'Delete failed');
// 					await reload();
// 				} catch (err) {
// 					if (err.message === 'UNAUTHORIZED') {
// 						alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
// 						window.location.href = 'login.html';
// 						return;
// 					}
// 					if (err.message === 'FORBIDDEN') {
// 						alert('Bạn không có quyền admin để thực hiện thao tác này.');
// 						return;
// 					}
// 					alert(err.message || 'Lỗi xóa tài khoản');
// 				}
// 			}
// 		});

// 		async function reload() {
// 			try {
// 				const data = await fetchUsers();
// 				renderUsers(data.users || []);
// 			} catch (err) {
// 				const tbody = document.querySelector('#usersTable tbody');
// 				if (err.message === 'UNAUTHORIZED') {
// 					alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
// 					window.location.href = 'login.html';
// 					return;
// 				}
// 				if (err.message === 'FORBIDDEN') {
// 					alert('Bạn không có quyền admin để truy cập danh sách người dùng.');
// 					window.location.href = 'index.html';
// 					return;
// 				}
// 				if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="color:red;">Không thể tải danh sách người dùng</td></tr>';
// 			}
// 		}

// 		reload();
// 	});
// })();

// --- Thêm mock API JSON (không sửa phần comment phía trên) ---
(function() {
    // Nếu muốn luôn reset về dữ liệu gốc mỗi lần tải trang (xóa các thay đổi trước đó) -> đặt true
    const RESET_ON_LOAD = true;
    const STORAGE_KEY = 'mock_users_v1';

    async function loadInitialUsers() {
        // Nếu bật reset thì xóa key trước khi nạp
        if (RESET_ON_LOAD) {
            try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        }

        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try { return JSON.parse(raw); } catch (e) { /* fallthrough */ }
        }
        // Nếu không có trong localStorage, thử fetch file api/account.json (cùng project)
        try {
            const resp = await fetch('./api/account.json');
            if (resp.ok) {
                const obj = await resp.json();
                // Nếu file chứa 1 user object (như file hiện tại), chuyển thành mảng users
                const base = [];
                if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
                    const name = (obj.firstName || '') + (obj.lastName ? ' ' + obj.lastName : '');
                    const username = (obj.email || name).split('@')[0].replace(/\s+/g, '.').toLowerCase();
                    base.push({
                        id: 'U001',
                        name: name || 'User 1',
                        username: username || 'user1',
                        email: obj.email || '',
                        phone: obj.phone || '',
                        role: 'khach_hang'
                    });
                }
                // Thêm vài user mẫu bổ sung
                base.push(
                    { id: 'U002', name: 'John Smith', username: 'john.s', email: 'john.smith@example.com', phone: '(555) 234-5678', role: 'khach_hang' },
                    { id: 'A001', name: 'Admin User', username: 'admin', email: 'admin@storewool.com', phone: '(555) 999-0000', role: 'admin' }
                );
                localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
                return base;
            }
        } catch (e) {
            // ignore fetch errors
        }
        // Fallback static list
        const fallback = [
            { id: 'U001', name: 'Emily Mitchell', username: 'emily.m', email: 'emily.mitchell@example.com', phone: '(555) 123-4567', role: 'khach_hang' },
            { id: 'U002', name: 'John Smith', username: 'john.s', email: 'john.smith@example.com', phone: '(555) 234-5678', role: 'khach_hang' },
            { id: 'A001', name: 'Admin User', username: 'admin', email: 'admin@storewool.com', phone: '(555) 999-0000', role: 'admin' }
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
        return fallback;
    }

    function saveUsers(list) {
        // Lưu như trước (localStorage) để trong cùng 1 phiên load có thể thao tác,
        // nhưng nếu RESET_ON_LOAD = true thì key bị xoá khi next load trang.
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    // Mock response shape compatible with the commented code (res.status, res.ok, res.json())
    function makeResponse(status, payload) {
        return {
            status,
            ok: status >= 200 && status < 300,
            json: async () => payload
        };
    }

    // Expose a global api function that mimics the one in your commented code.
    // Không kiểm tra token/role theo yêu cầu.
    window.api = async function(endpoint, options = {}) {
        const method = (options.method || 'GET').toUpperCase();
        const users = await loadInitialUsers();

        // GET /users
        if (endpoint === '/users' && method === 'GET') {
            return makeResponse(200, { users });
        }

        // GET /users/:id
        const idMatch = endpoint.match(/^\/users\/([^\/]+)$/);
        if (idMatch && method === 'GET') {
            const id = idMatch[1];
            const u = users.find(x => x.id === id);
            if (!u) return makeResponse(404, { status: 'error', message: 'Not found' });
            return makeResponse(200, { user: u });
        }

        // POST /users
        if (endpoint === '/users' && method === 'POST') {
            let payload = {};
            try { payload = options.body ? JSON.parse(options.body) : {}; } catch (e) {}
            const id = 'U' + String(Date.now()).slice(-6);
            const user = {
                id,
                name: payload.name || payload.fullName || 'New User',
                username: payload.username || ((payload.email||'').split('@')[0]) || ('user' + id),
                email: payload.email || '',
                phone: payload.phone || '',
                role: payload.role || 'khach_hang'
            };
            users.push(user);
            saveUsers(users);
            return makeResponse(200, { status: 'success', data: user });
        }

        // PUT /users/:id
        if (idMatch && method === 'PUT') {
            const id = idMatch[1];
            let payload = {};
            try { payload = options.body ? JSON.parse(options.body) : {}; } catch (e) {}
            const idx = users.findIndex(x => x.id === id);
            if (idx === -1) return makeResponse(404, { status: 'error', message: 'Not found' });
            const updated = Object.assign({}, users[idx], payload);
            users[idx] = updated;
            saveUsers(users);
            return makeResponse(200, { status: 'success', data: updated });
        }

        // DELETE /users/:id
        if (idMatch && method === 'DELETE') {
            const id = idMatch[1];
            const idx = users.findIndex(x => x.id === id);
            if (idx === -1) return makeResponse(404, { status: 'error', message: 'Not found' });
            users.splice(idx,1);
            saveUsers(users);
            return makeResponse(200, { status: 'success' });
        }

        // Default: endpoint không tồn tại
        return makeResponse(404, { status: 'error', message: 'Endpoint not found in mock api' });
    };

    // Expose helper functions used in commented code (optional)
    window.fetchUsers = async function() {
        const res = await window.api('/users');
        if (res.status === 401) throw new Error('UNAUTHORIZED');
        if (res.status === 403) throw new Error('FORBIDDEN');
        if (!res.ok) throw new Error('Fetch users failed');
        return res.json();
    };
    // create/update/delete wrappers (để tương thích nếu phần comment dùng chúng globals)
    window.createUser = async function(payload) {
        const res = await window.api('/users', { method: 'POST', body: JSON.stringify(payload) });
        if (res.status === 401) throw new Error('UNAUTHORIZED');
        if (res.status === 403) throw new Error('FORBIDDEN');
        return res.json();
    };
    window.updateUser = async function(id, payload) {
        const res = await window.api(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        if (res.status === 401) throw new Error('UNAUTHORIZED');
        if (res.status === 403) throw new Error('FORBIDDEN');
        return res.json();
    };
    window.deleteUser = async function(id) {
        const res = await window.api(`/users/${id}`, { method: 'DELETE' });
        if (res.status === 401) throw new Error('UNAUTHORIZED');
        if (res.status === 403) throw new Error('FORBIDDEN');
        return res.json();
    };
})();

(function bootstrapAdminUsersForStatic() {
    document.addEventListener('DOMContentLoaded', async () => {
        // Tìm container admin trên trang, nếu không có thì tạo 1 cái để test
        let container = document.querySelector('.main-section[data-section="account-management"]');
        if (!container) {
            container = document.createElement('div');
            container.className = 'main-section';
            container.dataset.section = 'account-management';
            document.body.prepend(container);
        }

        // Chèn HTML quản lý tài khoản (như phần comment)
        if (!document.getElementById('usersTable')) {
            container.insertAdjacentHTML('beforeend', `
                <div class="admin-accounts">
                    <div class="toolbar">
                        <button id="btnAddUser">+ Add User</button>
                    </div>
                    <table id="usersTable" class="users-table">
                        <thead>
                            <tr>
                                <th>ID</th><th>Name</th><th>Username</th><th>Email</th><th>Phone</th><th>Role</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>

                <div id="userModal" class="modal" style="display:none;">
                    <div class="modal-content" style="background:#fff;padding:12px;border:1px solid #ccc;">
                        <h3 id="modalTitle">Add User</h3>
                        <form id="userForm">
                            <input type="hidden" name="id" />
                            <label>Name</label><input type="text" name="name" required /><br/>
                            <label>Username</label><input type="text" name="username" required /><br/>
                            <label>Email</label><input type="email" name="email" required /><br/>
                            <label>Password <small>(để trống để giữ nguyên mật khẩu hiện tại)</small></label><input type="password" name="password" /><br/>
                            <label>Phone</label><input type="text" name="phone" /><br/>
                            <label>Role</label>
                            <select name="role">
                                <option value="khach_hang">khach_hang</option>
                                <option value="nhan_vien">nhan_vien</option>
                                <option value="admin">admin</option>
                            </select>
                            <div class="actions" style="margin-top:8px;">
                                <button type="submit" class="btn-save">Save</button>
                                <button type="button" class="btn-cancel">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            `);
        }

        // Helpers (nội bộ)
        function renderUsers(users) {
            const tbody = document.querySelector('#usersTable tbody');
            if (!tbody) return;
            if (!Array.isArray(users)) users = [];
            tbody.innerHTML = users.map(u => `
                <tr data-id="${u.id}">
                    <td>${u.id}</td>
                    <td>${u.name || ''}</td>
                    <td>${u.username || ''}</td>
                    <td>${u.email || ''}</td>
                    <td>${u.phone || ''}</td>
                    <td>${u.role || ''}</td>
                    <td>
                        <button class="btn-edit" data-id="${u.id}">Edit</button>
                        <button class="btn-delete" data-id="${u.id}">Delete</button>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="7">No users</td></tr>';
        }
        function getFormData(form) {
            const data = Object.fromEntries(new FormData(form).entries());
            Object.keys(data).forEach(k => { if (data[k] === '') delete data[k]; });
            return data;
        }

        // DOM refs
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        const btnAdd = document.getElementById('btnAddUser');

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

        btnAdd.addEventListener('click', () => openModal('Add User'));
        form.querySelector('.btn-cancel').addEventListener('click', closeModal);

        // Use mock api wrappers exposed earlier (window.fetchUsers, window.createUser, ...)
        async function reload() {
            const tbody = document.querySelector('#usersTable tbody');
            try {
                if (typeof window.fetchUsers !== 'function') {
                    tbody.innerHTML = '<tr><td colspan="7" style="color:red;">Mock API không sẵn sàng</td></tr>';
                    return;
                }
                const data = await window.fetchUsers(); // trả về payload { users: [...] }
                const users = data?.users || data || [];
                renderUsers(users);
            } catch (err) {
                tbody.innerHTML = '<tr><td colspan="7" style="color:red;">Không thể tải danh sách người dùng</td></tr>';
                console.error(err);
            }
        }

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const id = form.elements.id.value;
            const payload = getFormData(form);
            try {
                if (id) {
                    if (typeof window.updateUser !== 'function') throw new Error('updateUser không khả dụng');
                    const resp = await window.updateUser(id, payload);
                    await resp; // wrapper trả payload
                } else {
                    if (!payload.password) return alert('Password là bắt buộc khi tạo mới');
                    if (typeof window.createUser !== 'function') throw new Error('createUser không khả dụng');
                    const resp = await window.createUser(payload);
                    await resp;
                }
                await reload();
                closeModal();
            } catch (err) {
                alert(err.message || 'Lỗi thao tác');
            }
        });

        document.addEventListener('click', async function(e) {
            if (e.target.classList.contains('btn-edit')) {
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
            if (e.target.classList.contains('btn-delete')) {
                const id = e.target.dataset.id;
                if (!confirm('Xóa tài khoản này?')) return;
                try {
                    if (typeof window.deleteUser !== 'function') throw new Error('deleteUser không khả dụng');
                    await window.deleteUser(id);
                    await reload();
                } catch (err) {
                    alert(err.message || 'Lỗi xóa tài khoản');
                }
            }
        });

        // initial load
        await reload();
    });
})();