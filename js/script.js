// Global employee data
let employeeData = [];

// Login System
const loginModal = document.getElementById('loginModal');
const appContent = document.getElementById('appContent');
const logoutBtn = document.getElementById('logoutBtn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('loginError');
const rememberMeCheckbox = document.getElementById('rememberMe');
const togglePasswordIcon = document.getElementById('togglePassword');
const userNameSmall = document.getElementById('userNameSmall');

function togglePasswordVisibility() {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  togglePasswordIcon.classList.toggle('fa-eye-slash');
  togglePasswordIcon.classList.toggle('fa-eye');
}

async function loadEmployeeData() {
  const employeeSheetID = "1eqVoLsZxGguEbRCC5rdI4iMVtQ7CK4T3uXRdx8zE3uw";
  const employeeSheetName = "Employee";
  const employeeUrl = `https://opensheet.elk.sh/${employeeSheetID}/${employeeSheetName}`;
  try {
    const response = await fetch(employeeUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error loading employee data:", error);
    throw error;
  }
}

async function handleLogin() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  loginError.style.display = 'none';
  if (!username || !password) {
    loginError.textContent = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน';
    loginError.style.display = 'block';
    return;
  }
  try {
    employeeData = await loadEmployeeData();
    const expectedPassword = username.slice(-4);
    const employee = employeeData.find(e => e.IDRec && e.IDRec.toString().trim() === username && expectedPassword === password);
    if (employee && employee.Name) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', username);
      localStorage.setItem('userName', employee.Name);
      if (rememberMeCheckbox.checked) {
        localStorage.setItem('savedUsername', username);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('savedUsername');
        localStorage.removeItem('rememberMe');
      }
      checkLoginStatus();
      // Focus on search input after login
      setTimeout(() => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
      }, 500);
    } else {
      loginError.textContent = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!';
      loginError.style.display = 'block';
      passwordInput.value = ''; // Clear password on error
    }
  } catch (error) {
    loginError.textContent = 'เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน กรุณาลองใหม่';
    loginError.style.display = 'block';
    console.error('Login error:', error);
  }
}

function checkLoginStatus() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const savedUsername = localStorage.getItem('username');
  if (isLoggedIn && savedUsername) {
    loginModal.classList.remove('active');
    appContent.classList.add('logged-in');
    logoutBtn.style.display = 'block';
    userNameSmall.textContent = localStorage.getItem('userName') || '';
    // Auto-load default tab if needed
    if (document.querySelector('.tab-button.active')) {
      showTab('parts');
    }
  } else {
    loginModal.classList.add('active');
    appContent.classList.remove('logged-in');
    logoutBtn.style.display = 'none';
    userNameSmall.textContent = '';
    // Clear invalid session
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('userName');
    localStorage.removeItem('savedPassword'); // Clear saved password on invalid session
  }
  // Load saved credentials if remember me was checked
  if (localStorage.getItem('rememberMe') === 'true') {
    const savedUsername = localStorage.getItem('savedUsername');
    if (savedUsername) usernameInput.value = savedUsername;
    rememberMeCheckbox.checked = true;
  }
}

function handleLogout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('username');
  localStorage.removeItem('userName');
  localStorage.removeItem('savedUsername');
  localStorage.removeItem('savedPassword');
  localStorage.removeItem('rememberMe');
  checkLoginStatus();
}

// Allow Enter key for login
passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleLogin();
  }
});

// Initial check on load
checkLoginStatus();

function showTab(tabId) {
  const buttons = document.querySelectorAll(".tab-button");
  const contents = document.querySelectorAll(".tab-content");
  document.getElementById("loading").style.display = "flex";
  buttons.forEach((btn) => btn.classList.remove("active"));
  contents.forEach((tab) => tab.classList.remove("active"));
  const targetTab = document.getElementById(tabId);
  targetTab.classList.add("active");
  const clickedButton = Array.from(buttons).find(
    (btn) => btn.id === `tab-${tabId}`
  );
  if (clickedButton) clickedButton.classList.add("active");
  if (tabId === "parts") {
    loadData();
  } else if (tabId === "today") {
    loadTodayData();
  } else if (tabId === "all") {
    loadAllData();
  } else if (tabId === "pending-calls") {
    loadPendingCallsData();
  }
  hideLoading();
}

function hideLoading() {
  document.getElementById("loading").style.display = "none";
}

function showQRCode() {
  Swal.fire({
    title: '📷 สแกน QR Code',
    html: `
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://request-nawanakorn.vercel.app/" alt="QR Code" class="swal2-qrcode" style="width: 150px; height: 150px;">
      <p>สแกนเพื่อเข้าสู่ระบบขอเบิกอะไหล่</p>
    `,
    confirmButtonText: 'ปิด',
    customClass: {
      popup: 'swal2-popup',
      title: 'swal2-title',
      confirmButton: 'swal2-confirm'
    }
  });
}

// Parts tab script (original)
const sheetID = "1nbhLKxs7NldWo_y0s4qZ8rlpIfyyGkR_Dqq8INmhYlw";
const sheetName = "MainSap";
const url = `https://opensheet.elk.sh/${sheetID}/${sheetName}`;
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const tableBody = document.querySelector("#data-table tbody");
const pagination = document.getElementById("pagination");
const pageNumbers = document.getElementById("pageNumbers");
const itemsPerPageSelect = document.getElementById("itemsPerPage");
const firstPageButton = document.getElementById("firstPage");
const prevPageButton = document.getElementById("prevPage");
const nextPageButton = document.getElementById("nextPage");
const lastPageButton = document.getElementById("lastPage");
const errorContainer = document.getElementById("error-container");
const retryButton = document.getElementById("retry-button");
let allData = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentFilteredData = [];

itemsPerPageSelect.addEventListener("change", () => {
  itemsPerPage = parseInt(itemsPerPageSelect.value, 10);
  currentPage = 1;
  renderTableData();
  renderPagination(allData.length);
});

retryButton.addEventListener("click", () => {
  errorContainer.style.display = "none";
  loadData();
});

function renderTable(data) {
  if (!tableBody) {
    console.error("Table body for #data-table not found");
    Swal.fire({
      icon: "error",
      title: "ข้อผิดพลาด",
      text: "ไม่พบตารางข้อมูล กรุณาตรวจสอบโครงสร้างหน้าเว็บ",
      confirmButtonText: "ตกลง",
    });
    return;
  }
  tableBody.innerHTML = "";
  data.forEach((row) => {
    const tr = document.createElement("tr");
    const requisitionTd = document.createElement("td");
    const btn = document.createElement("button");
    btn.textContent = "เบิก";
    btn.className = "requisition-button";
    btn.onclick = () => showRequisitionDialog(row);
    requisitionTd.appendChild(btn);
    tr.appendChild(requisitionTd);
    const columns = [
      "UrlWeb",
      "Material",
      "Description",
      "วิภาวดี",
      "Unrestricted",
      "Rebuilt",
      "หมายเหตุ",
      "Product",
      "OCRTAXT"
    ];
    // Convert values to numbers for comparison
    const vibhavadiValue = parseFloat(row["วิภาวดี"]) || 0;
    const unrestrictedValue = parseFloat(row["Unrestricted"]) || 0;
    // Determine styling based on conditions
    let textColor = "";
    let fontWeight = "";
    if (vibhavadiValue > 0) {
      textColor = "#4caf50"; // Green
      fontWeight = "bold";
    } else if (vibhavadiValue === 0 && unrestrictedValue > 0) {
      textColor = "#2196f3"; // Blue
      fontWeight = "bold";
    }
    columns.forEach((col) => {
      const td = document.createElement("td");
      let value = row[col] || "";
      if (col === "วิภาวดี" || col === "Unrestricted") {
        if (value && !isNaN(value)) {
          value = Number(value).toLocaleString("en-US", {
            maximumFractionDigits: 0,
          });
        } else if (value === "0" || value === 0) {
          value = "";
        }
      }
      if ((col === "หมายเหตุ" || col === "Rebuilt") && value) {
        td.style.color = "red";
        td.style.fontWeight = "bold";
      }
      // Apply conditional styling to Material, Description, วิภาวดี, and Unrestricted
      if (
        col === "Material" ||
        col === "Description" ||
        col === "วิภาวดี" ||
        col === "Unrestricted"
      ) {
        if (textColor) td.style.color = textColor;
        if (fontWeight) td.style.fontWeight = fontWeight;
      }
      if (col === "UrlWeb" && value && value.startsWith("https://drive.google.com/uc?")) {
        td.innerHTML = `
          <a href="${value}" target="_blank" rel="noopener noreferrer">
           <button class="image-button">Image</button>
          </a>
        `;
      } else if (col === "UrlWeb" && value) {
        td.innerHTML = `
          <a href="${value}" target="_blank" rel="noopener noreferrer">
            <button class="image-button">Image</button>
          </a>
        `;
      } else {
        td.textContent = value;
      }
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });
}

async function showRequisitionDialog(row) {
  document.body.style.overflow = 'hidden';
  const history = {
    employeeCode: getFromLocalStorage('employeeCode'),
    team: getFromLocalStorage('team'),
    contact: getFromLocalStorage('contact'),
    callNumber: getFromLocalStorage('callNumber'),
    callType: getFromLocalStorage('callType'),
  };
  if (employeeData.length === 0) {
    employeeData = await loadEmployeeData();
  }
  Swal.fire({
    title: '📋 เบิกอะไหล่นวนคร',
    html: `
      <style>
        .autocomplete-items {
          position: absolute;
          border: 1px solid #ccc;
          border-top: none;
          z-index: 9999;
          background-color: white;
          width: 100%;
          max-height: 120px;
          overflow-y: auto;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          margin-top: 2px;
          border-radius: 6px;
        }
        .autocomplete-item {
          padding: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        .autocomplete-item:hover {
          background-color: #f1f1f1;
        }
        .swal2-label {
          text-align: left !important;
          display: block !important;
          margin: 8px 0 4px !important;
          font-weight: bold !important;
          width: 100% !important;
        }
        .swal2-input, .swal2-select {
          width: 100% !important;
          margin: 4px 0 !important;
          padding: 6px !important;
          box-sizing: border-box !important;
          font-size: 14px !important;
          height: 36px !important;
        }
        .error-message {
          color: red !important;
          font-size: 12px !important;
          margin-top: 2px !important;
          display: block !important;
          text-align: left !important;
        }
        .invalid-input {
          border: 2px solid red !important;
          box-shadow: 0 0 5px rgba(255, 0, 0, 0.5) !important;
        }
        #swal-employee-name-display, #swal-team-display {
          color: #4caf50 !important;
          font-weight: bold !important;
          margin: 4px 0 !important;
          padding: 4px !important;
          background: #e8f5e8 !important;
          border-radius: 4px !important;
          text-align: left !important;
        }
      </style>
      <div class="swal2-label">📦 Material: ${row.Material || ''}</div>
      <div class="swal2-label">📝 Description: ${row.Description || ''}</div>
      <label class="swal2-label">🔢 จำนวน</label>
      <input id="swal-quantity" class="swal2-input" type="number" value="1" min="1">
      <span id="swal-quantity-error" class="error-message"></span>
      <label class="swal2-label">🆔 รหัสพนักงาน</label>
      <input id="swal-employee-code" class="swal2-input" placeholder="7xxxxxx">
      <div id="employee-code-history" class="autocomplete-items" style="display:none;"></div>
      <span id="swal-employee-code-error" class="error-message"></span>
      <label class="swal2-label">👤 ชื่อพนักงาน</label>
      <div id="swal-employee-name-display"></div>
      <label class="swal2-label">👥 ทีม</label>
      <div id="swal-team-display"></div>
      <label class="swal2-label">📞 เบอร์ติดต่อ</label>
      <input id="swal-contact" class="swal2-input" placeholder="เช่น 08xxxxxxxx">
      <div id="contact-history" class="autocomplete-items" style="display:none;"></div>
      <span id="swal-contact-error" class="error-message"></span>
      <label class="swal2-label">📄 เลขที่ Call</label>
      <input id="swal-call-number" class="swal2-input" placeholder="2... หรือ ...">
      <div id="call-number-history" class="autocomplete-items" style="display:none;"></div>
      <span id="swal-call-number-error" class="error-message"></span>
      <label class="swal2-label">🗳️ Call Type</label>
      <select id="swal-call-type" class="swal2-select">
        <option value="" disabled selected>เลือก Call Type</option>
        <option value="I">I</option>
        <option value="P">P</option>
        <option value="Q">Q</option>
        <option value="R">R</option>
      </select>
      <span id="swal-call-type-error" class="error-message"></span>
      <label class="swal2-label">🗒️ หมายเหตุ</label>
      <input id="swal-remark" class="swal2-input" placeholder="ไม่บังคับ" readonly>
      <span id="swal-remark-error" class="error-message"></span>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'ยืนยัน',
    cancelButtonText: 'ยกเลิก',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      // Force high z-index and ensure backdrop covers full screen
      const swalContainer = document.querySelector('.swal2-container');
      if (swalContainer) {
        swalContainer.style.zIndex = '99998';
        swalContainer.style.position = 'fixed';
        swalContainer.style.top = '0';
        swalContainer.style.left = '0';
        swalContainer.style.width = '100vw';
        swalContainer.style.height = '100vh';
        swalContainer.style.display = 'flex';
        swalContainer.style.justifyContent = 'center';
        swalContainer.style.alignItems = 'center';
      }
      const swalBackdrop = document.querySelector('.swal2-backdrop');
      if (swalBackdrop) {
        swalBackdrop.style.zIndex = '99997';
        swalBackdrop.style.position = 'fixed';
        swalBackdrop.style.top = '0';
        swalBackdrop.style.left = '0';
        swalBackdrop.style.width = '100vw';
        swalBackdrop.style.height = '100vh';
        swalBackdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        swalBackdrop.style.backdropFilter = 'blur(8px)';
      }
      const swalPopup = document.querySelector('.swal2-popup');
      if (swalPopup) {
        swalPopup.style.zIndex = '99999';
        swalPopup.style.position = 'relative';
        swalPopup.style.margin = '0';
        swalPopup.style.transform = 'none';
        swalPopup.style.maxHeight = '90vh';
        swalPopup.style.overflowY = 'auto';
        swalPopup.style.width = 'auto';
        swalPopup.style.maxWidth = '90vw';
        if (window.innerWidth <= 768) {
          swalPopup.style.width = '95vw';
          swalPopup.style.padding = '15px';
        }
      }
      const quantityInput = document.getElementById('swal-quantity');
      const employeeCodeInput = document.getElementById('swal-employee-code');
      const contactInput = document.getElementById('swal-contact');
      const callNumberInput = document.getElementById('swal-call-number');
      const callTypeInput = document.getElementById('swal-call-type');
      const remarkInput = document.getElementById('swal-remark');
      const confirmButton = document.querySelector('.swal2-confirm');
      confirmButton.disabled = true;
      function setupAutocomplete(input, key, containerId) {
        input.addEventListener('input', () => {
          const container = document.getElementById(containerId);
          const val = input.value.toLowerCase();
          const items = getFromLocalStorage(key).filter(item => item.toLowerCase().includes(val));
          container.innerHTML = '';
          items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            div.textContent = item;
            div.onclick = () => {
              input.value = item;
              container.style.display = 'none';
              validateInputs();
            };
            container.appendChild(div);
          });
          container.style.display = items.length ? 'block' : 'none';
        });
        input.addEventListener('blur', () => {
          setTimeout(() => {
            const container = document.getElementById(containerId);
            container.style.display = 'none';
          }, 200);
        });
      }
      setupAutocomplete(contactInput, 'contact', 'contact-history');
      setupAutocomplete(callNumberInput, 'callNumber', 'call-number-history');
      setupAutocomplete(callTypeInput, 'callType', 'call-type-history');
      const lastContact = getFromLocalStorage('contact')[0];
      if (lastContact) contactInput.value = lastContact;
      const inputs = [quantityInput, employeeCodeInput, contactInput, callNumberInput, callTypeInput, remarkInput];
      function validateInputs() {
        const errors = {
          quantityError: document.getElementById('swal-quantity-error'),
          employeeCodeError: document.getElementById('swal-employee-code-error'),
          contactError: document.getElementById('swal-contact-error'),
          callNumberError: document.getElementById('swal-call-number-error'),
          callTypeError: document.getElementById('swal-call-type-error'),
          remarkError: document.getElementById('swal-remark-error')
        };
        inputs.forEach(input => input.classList.remove('invalid-input'));
        Object.values(errors).forEach(el => el.textContent = '');
        let isValid = true;
        if (!quantityInput.value || quantityInput.value < 1) {
          errors.quantityError.textContent = 'กรุณากรอกจำนวนที่มากกว่าหรือเท่ากับ 1';
          quantityInput.classList.add('invalid-input');
          isValid = false;
        }
        const employeeCode = employeeCodeInput.value.trim();
        if (!employeeCode || !/^\d{7}$/.test(employeeCode) || employeeCode[0] !== '7') {
          errors.employeeCodeError.textContent = 'รหัสพนักงานต้องเป็นตัวเลข 7 หลัก เริ่มด้วย 7 (เช่น 7512411)';
          employeeCodeInput.classList.add('invalid-input');
          document.getElementById('swal-employee-name-display').textContent = '';
          document.getElementById('swal-team-display').textContent = '';
          isValid = false;
        } else {
          // Check against employee data
          const employee = employeeData.find(e => e.IDRec && e.IDRec.toString().trim() === employeeCode);
          if (!employee || !employee.Name) {
            errors.employeeCodeError.textContent = 'ไม่พบรหัสพนักงานนี้ในระบบ';
            employeeCodeInput.classList.add('invalid-input');
            document.getElementById('swal-employee-name-display').textContent = '';
            document.getElementById('swal-team-display').textContent = '';
            isValid = false;
          } else {
            document.getElementById('swal-employee-name-display').textContent = `${employee.Name}`;
            document.getElementById('swal-team-display').textContent = `${employee.หน่วยงาน || ''}`;
            errors.employeeCodeError.textContent = '';
          }
        }
        if (!contactInput.value || !/^(0|\+66)[6-9][0-9]{7,8}$/.test(contactInput.value)) {
          errors.contactError.textContent = 'กรุณากรอกเบอร์ติดต่อที่ถูกต้อง (เช่น 08xxxxxxxx)';
          contactInput.classList.add('invalid-input');
          isValid = false;
        }
        const hasRemark = remarkInput.value.trim().length > 0;
        if (!hasRemark) {
          if (!callNumberInput.value) {
            errors.callNumberError.textContent = 'กรุณากรอกเลขที่ Call';
            callNumberInput.classList.add('invalid-input');
            isValid = false;
          } else if (
            (callNumberInput.value.startsWith('2') && callNumberInput.value.length !== 11) ||
            (!callNumberInput.value.startsWith('2') && callNumberInput.value.length !== 7)
          ) {
            errors.callNumberError.textContent = 'เลขที่ Call ต้องขึ้นต้นด้วย 2 (11 ตัวอักษร) หรือ (7 ตัวอักษร)';
            callNumberInput.classList.add('invalid-input');
            isValid = false;
          }
          if (!callTypeInput.value) {
            errors.callTypeError.textContent = 'กรุณาเลือก Call Type';
            callTypeInput.classList.add('invalid-input');
            isValid = false;
          }
        }
        confirmButton.disabled = !isValid;
      }
      quantityInput.addEventListener('input', validateInputs);
      employeeCodeInput.addEventListener('input', validateInputs);
      contactInput.addEventListener('input', validateInputs);
      callNumberInput.addEventListener('input', validateInputs);
      callTypeInput.addEventListener('change', validateInputs);
      remarkInput.addEventListener('input', validateInputs);
      validateInputs();
      quantityInput.focus();
    },
    didClose: () => {
      document.body.style.overflow = 'auto';
    },
    preConfirm: () => {
      const quantityInput = document.getElementById('swal-quantity');
      const employeeCodeInput = document.getElementById('swal-employee-code');
      const contactInput = document.getElementById('swal-contact');
      const callNumberInput = document.getElementById('swal-call-number');
      const callTypeInput = document.getElementById('swal-call-type');
      const remarkInput = document.getElementById('swal-remark');
      const errors = {
        quantityError: document.getElementById('swal-quantity-error'),
        employeeCodeError: document.getElementById('swal-employee-code-error'),
        contactError: document.getElementById('swal-contact-error'),
        callNumberError: document.getElementById('swal-call-number-error'),
        callTypeError: document.getElementById('swal-call-type-error'),
        remarkError: document.getElementById('swal-remark-error')
      };
      [quantityInput, employeeCodeInput, contactInput, callNumberInput, callTypeInput, remarkInput].forEach(input => {
        input.classList.remove('invalid-input');
      });
      Object.values(errors).forEach(el => el.textContent = '');
      let isValid = true;
      if (!quantityInput.value || quantityInput.value < 1) {
        errors.quantityError.textContent = 'กรุณากรอกจำนวนที่มากกว่าหรือเท่ากับ 1';
        quantityInput.classList.add('invalid-input');
        isValid = false;
      }
      const employeeCode = employeeCodeInput.value.trim();
      console.log('Employee Code Input:', employeeCode);
      if (!employeeCode || !/^\d{7}$/.test(employeeCode) || employeeCode[0] !== '7') {
        errors.employeeCodeError.textContent = 'รหัสพนักงานต้องเป็นตัวเลข 7 หลัก เริ่มด้วย 7 (เช่น 7512411)';
        employeeCodeInput.classList.add('invalid-input');
        isValid = false;
      } else {
        const employee = employeeData.find(e => e.IDRec && e.IDRec.toString().trim() === employeeCode);
        if (!employee || !employee.Name) {
          errors.employeeCodeError.textContent = 'ไม่พบรหัสพนักงานนี้ในระบบ';
          employeeCodeInput.classList.add('invalid-input');
          isValid = false;
        }
      }
      if (!contactInput.value || !/^(0|\+66)[6-9][0-9]{7,8}$/.test(contactInput.value)) {
        errors.contactError.textContent = 'กรุณากรอกเบอร์ติดต่อที่ถูกต้อง (เช่น 08xxxxxxxx)';
        contactInput.classList.add('invalid-input');
        isValid = false;
      }
      const hasRemark = remarkInput.value.trim().length > 0;
      const callValue = callNumberInput.value.trim(); // Fixed: Trim and store in var to avoid repeated access
      if (!hasRemark) {
        if (!callValue) {
          errors.callNumberError.textContent = 'กรุณากรอกเลขที่ Call';
          callNumberInput.classList.add('invalid-input');
          isValid = false;
        } else if (
          (callValue.startsWith('2') && callValue.length !== 11) ||
          (!callValue.startsWith('2') && callValue.length !== 7)
        ) {
          errors.callNumberError.textContent = 'เลขที่ Call ต้องขึ้นต้นด้วย 2 (11 ตัวอักษร) หรือ (7 ตัวอักษร)';
          callNumberInput.classList.add('invalid-input');
          isValid = false;
        }
        if (!callTypeInput.value) {
          errors.callTypeError.textContent = 'กรุณาเลือก Call Type';
          callTypeInput.classList.add('invalid-input');
          isValid = false;
        }
      }
      if (isValid) {
        const employee = employeeData.find(e => e.IDRec && e.IDRec.toString().trim() === employeeCode);
        saveToLocalStorage('employeeCode', employeeCode);
        saveToLocalStorage('contact', contactInput.value);
        if (callValue) {
          saveToLocalStorage('callNumber', callValue);
        }
        if (callTypeInput.value) {
          saveToLocalStorage('callType', callTypeInput.value);
        }
        return {
          quantity: quantityInput.value,
          employeeCode: employeeCode,
          employeeName: employee ? employee.Name : '',
          team: employee ? (employee.หน่วยงาน || '') : '',
          contact: contactInput.value,
          callNumber: callValue,
          callType: callTypeInput.value,
          remark: remarkInput.value
        };
      }
      return false;
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      const formValues = result.value;
      const vibhavadiValue = parseFloat(row["วิภาวดี"]) || 0;
      const quantity = parseFloat(formValues.quantity) || 0;
      // เช็คเงื่อนไขเตือน
      if (quantity <= vibhavadiValue) {
        await Swal.fire({
          icon: 'warning',
          title: '⚠️ คำเตือน',
          text: `ที่คลังวิภาวดีมีอะไหล่ ${vibhavadiValue.toLocaleString()} ชิ้น (จำนวนที่เบิก ${quantity} ชิ้น)`,
          confirmButtonText: 'ยืนยันดำเนินการต่อ',
          allowOutsideClick: false,
          allowEscapeKey: false
        });
      }
      // เพิ่ม popup สรุปข้อมูลที่นี่
      let imageHtml = '';
      if (row.UrlWeb && row.UrlWeb.trim()) {
        imageHtml = `<img src="${row.UrlWeb}" alt="Product Image" class="summary-image">`;
      }
      const summaryResult = await Swal.fire({
        title: 'สรุปข้อมูลการเบิก',
        html: `
          ${imageHtml}
          <div style="text-align: left; font-size: 14px;">
            <p><strong>Material:</strong> ${row.Material || ''}</p>
            <p><strong>Description:</strong> ${row.Description || ''}</p>
            <p><strong>จำนวน:</strong> ${formValues.quantity}</p>
            <p><strong>รหัสพนักงาน:</strong> ${formValues.employeeCode}</p>
            <p><strong>ชื่อพนักงาน:</strong> ${formValues.employeeName}</p>
            <p><strong>ทีม:</strong> ${formValues.team}</p>
            <p><strong>เบอร์ติดต่อ:</strong> ${formValues.contact}</p>
            <p><strong>เลขที่ Call:</strong> ${formValues.callNumber || 'ไม่มี'}</p>
            <p><strong>Call Type:</strong> ${formValues.callType || 'ไม่มี'}</p>
            <p><strong>หมายเหตุ:</strong> ${formValues.remark || 'ไม่มี'}</p>
            <hr style="margin: 10px 0;">
          </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'ยืนยันการเบิก',
        cancelButtonText: 'แก้ไข',
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
          title: 'dark-blue-title'
        },
        didOpen: () => {
          // Ensure full blur backdrop for summary popup as well
          const swalContainer = document.querySelector('.swal2-container');
          if (swalContainer) {
            swalContainer.style.zIndex = '99998';
            swalContainer.style.position = 'fixed';
            swalContainer.style.top = '0';
            swalContainer.style.left = '0';
            swalContainer.style.width = '100vw';
            swalContainer.style.height = '100vh';
            swalContainer.style.display = 'flex';
            swalContainer.style.justifyContent = 'center';
            swalContainer.style.alignItems = 'center';
          }
          const swalBackdrop = document.querySelector('.swal2-backdrop');
          if (swalBackdrop) {
            swalBackdrop.style.zIndex = '99997';
            swalBackdrop.style.position = 'fixed';
            swalBackdrop.style.top = '0';
            swalBackdrop.style.left = '0';
            swalBackdrop.style.width = '100vw';
            swalBackdrop.style.height = '100vh';
            swalBackdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            swalBackdrop.style.backdropFilter = 'blur(8px)';
          }
          const swalPopup = document.querySelector('.swal2-popup');
          if (swalPopup) {
            swalPopup.style.zIndex = '99999';
            swalPopup.style.position = 'relative';
            swalPopup.style.margin = '0';
            swalPopup.style.transform = 'none';
            swalPopup.style.maxHeight = '90vh';
            swalPopup.style.overflowY = 'auto';
            swalPopup.style.width = 'auto';
            swalPopup.style.maxWidth = '90vw';
            if (window.innerWidth <= 768) {
              swalPopup.style.width = '95vw';
              swalPopup.style.padding = '15px';
            }
          }
        }
      });
      if (summaryResult.isConfirmed) {
        // ดำเนินการส่งข้อมูล
        const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLScEkPW7y1aM-Zb4YmvL_ytjgSssPZMpiEjOSspQZd_vzo7bRA/formResponse";
        const formData = new URLSearchParams();
        formData.append("entry.1920472981", row.Material);
        formData.append("entry.1467523821", row.Description);
        formData.append("entry.795690319", formValues.quantity);
        formData.append("entry.794964518", formValues.contact);
        formData.append("entry.702998988", formValues.employeeCode);
        formData.append("entry.1899594146", formValues.team);
        formData.append("entry.1607225659", formValues.callNumber);
        formData.append("entry.738519154", formValues.callType);
        Swal.fire({
          title: 'กำลังบันทึกข้อมูล...',
          html: `
            <div class="swal2-spinner-container">
              <div class="swal2-spinner"></div>
              <p>กรุณารอสักครู่...</p>
            </div>
          `,
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            // Ensure full blur for loading popup
            const swalContainer = document.querySelector('.swal2-container');
            if (swalContainer) {
              swalContainer.style.zIndex = '99998';
              swalContainer.style.position = 'fixed';
              swalContainer.style.top = '0';
              swalContainer.style.left = '0';
              swalContainer.style.width = '100vw';
              swalContainer.style.height = '100vh';
              swalContainer.style.display = 'flex';
              swalContainer.style.justifyContent = 'center';
              swalContainer.style.alignItems = 'center';
            }
            const swalBackdrop = document.querySelector('.swal2-backdrop');
            if (swalBackdrop) {
              swalBackdrop.style.zIndex = '99997';
              swalBackdrop.style.position = 'fixed';
              swalBackdrop.style.top = '0';
              swalBackdrop.style.left = '0';
              swalBackdrop.style.width = '100vw';
              swalBackdrop.style.height = '100vh';
              swalBackdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
              swalBackdrop.style.backdropFilter = 'blur(8px)';
            }
            const swalPopup = document.querySelector('.swal2-popup');
            if (swalPopup) {
              swalPopup.style.zIndex = '99999';
              swalPopup.style.position = 'relative';
              swalPopup.style.margin = '0';
              swalPopup.style.transform = 'none';
              swalPopup.style.maxHeight = '90vh';
              swalPopup.style.overflowY = 'auto';
              swalPopup.style.width = 'auto';
              swalPopup.style.maxWidth = '90vw';
              if (window.innerWidth <= 768) {
                swalPopup.style.width = '95vw';
                swalPopup.style.padding = '15px';
              }
            }
          }
        });
        try {
          const response = await fetch(formUrl, {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData.toString()
          });
          await new Promise(resolve => setTimeout(resolve, 2000));
          Swal.fire({
            icon: 'success',
            title: 'ส่งข้อมูลสำเร็จ!',
            text: 'ข้อมูลได้ถูกบันทึกเรียบร้อยแล้ว',
            confirmButtonText: 'OK'
          }).then((result) => {
            if (result.isConfirmed) {
              Swal.fire({
                title: 'กำลังเปลี่ยนหน้า...',
                html: `
                  <div class="swal2-spinner-container">
                    <div class="swal2-spinner"></div>
                    <p>กรุณารอสักครู่...</p>
                  </div>
                `,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                  // Ensure full blur for redirect popup
                  const swalContainer = document.querySelector('.swal2-container');
                  if (swalContainer) {
                    swalContainer.style.zIndex = '99998';
                    swalContainer.style.position = 'fixed';
                    swalContainer.style.top = '0';
                    swalContainer.style.left = '0';
                    swalContainer.style.width = '100vw';
                    swalContainer.style.height = '100vh';
                    swalContainer.style.display = 'flex';
                    swalContainer.style.justifyContent = 'center';
                    swalContainer.style.alignItems = 'center';
                  }
                  const swalBackdrop = document.querySelector('.swal2-backdrop');
                  if (swalBackdrop) {
                    swalBackdrop.style.zIndex = '99997';
                    swalBackdrop.style.position = 'fixed';
                    swalBackdrop.style.top = '0';
                    swalBackdrop.style.left = '0';
                    swalBackdrop.style.width = '100vw';
                    swalBackdrop.style.height = '100vh';
                    swalBackdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                    swalBackdrop.style.backdropFilter = 'blur(8px)';
                  }
                  const swalPopup = document.querySelector('.swal2-popup');
                  if (swalPopup) {
                    swalPopup.style.zIndex = '99999';
                    swalPopup.style.position = 'relative';
                    swalPopup.style.margin = '0';
                    swalPopup.style.transform = 'none';
                    swalPopup.style.maxHeight = '90vh';
                    swalPopup.style.overflowY = 'auto';
                    swalPopup.style.width = 'auto';
                    swalPopup.style.maxWidth = '90vw';
                    if (window.innerWidth <= 768) {
                      swalPopup.style.width = '95vw';
                      swalPopup.style.padding = '15px';
                    }
                  }
                }
              });
              setTimeout(() => {
                Swal.close();
                showTab('today');
                // Fix for mobile scroll lock after tab switch
                setTimeout(() => {
                  document.body.style.overflow = 'auto';
                  const searchInputToday = document.getElementById('searchInputToday');
                  if (searchInputToday) {
                    searchInputToday.focus();
                    searchInputToday.blur(); // Trigger a touch event to unlock scroll on mobile
                  }
                  // Simulate a touch event to unlock scroll
                  if ('ontouchstart' in window) {
                    const event = new Event('touchstart', { bubbles: true });
                    document.body.dispatchEvent(event);
                  }
                }, 100);
              }, 2000);
            }
          });
        } catch (error) {
          console.error('เกิดข้อผิดพลาดในการส่งฟอร์ม:', error);
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถส่งข้อมูลไปยัง Google Form ได้ กรุณาลองใหม่',
            confirmButtonText: 'ตกลง'
          });
        }
      }
    }
  });
}

function saveToLocalStorage(key, value) {
  let items = JSON.parse(localStorage.getItem(key)) || [];
  if (!items.includes(value)) {
    items.unshift(value);
    if (items.length > 5) items.pop();
    localStorage.setItem(key, JSON.stringify(items));
  }
}

function getFromLocalStorage(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  pageNumbers.innerHTML = "";
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);
  if (totalPages <= 5) {
    startPage = 1;
    endPage = totalPages;
  } else {
    if (currentPage <= 3) {
      endPage = 5;
    } else if (currentPage >= totalPages - 2) {
      startPage = totalPages - 4;
    }
  }
  for (let page = startPage; page <= endPage; page++) {
    const button = document.createElement("button");
    button.textContent = page;
    button.className = page === currentPage ? "active" : "";
    button.onclick = () => changePage(page);
    pageNumbers.appendChild(button);
  }
  firstPageButton.disabled = currentPage === 1;
  prevPageButton.disabled = currentPage === 1;
  nextPageButton.disabled = currentPage === totalPages;
  lastPageButton.disabled = currentPage === totalPages;
}

function changePage(page) {
  currentPage = page;
  renderTableData();
  renderPagination(currentFilteredData.length);
}

function renderTableData() {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  renderTable(currentFilteredData.slice(startIndex, endIndex));
}

searchButton.addEventListener("click", () => {
  const keyword = searchInput.value.trim().toLowerCase();
  if (!keyword) {
    Swal.fire({
      icon: "warning",
      title: "กรุณากรอกคำค้นหา",
      text: "โปรดใส่ข้อความที่ต้องการค้นหาก่อนกดปุ่มค้นหา!",
      confirmButtonText: "ตกลง",
    });
    currentFilteredData = allData;
  } else {
    currentFilteredData = allData.filter((row) => {
      return (
        (row["Material"] || "").toLowerCase().includes(keyword) ||
        (row["Description"] || "").toLowerCase().includes(keyword) ||
        (row["Rebuilt"] || "").toLowerCase().includes(keyword) ||
        (row["Product"] || "").toLowerCase().includes(keyword) ||
        (row["OCRTAXT"] || "").toLowerCase().includes(keyword) ||
        (row["หมายเหตุ"] || "").toLowerCase().includes(keyword)
      );
    });
  }
  currentPage = 1;
  renderTableData();
  renderPagination(currentFilteredData.length);
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchButton.click();
    searchInput.blur();
  }
});

firstPageButton.addEventListener("click", () => {
  currentPage = 1;
  renderTableData();
  renderPagination(currentFilteredData.length);
});

prevPageButton.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTableData();
    renderPagination(currentFilteredData.length);
  }
});

nextPageButton.addEventListener("click", () => {
  const totalPages = Math.ceil(currentFilteredData.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTableData();
    renderPagination(currentFilteredData.length);
  }
});

lastPageButton.addEventListener("click", () => {
  const totalPages = Math.ceil(currentFilteredData.length / itemsPerPage);
  currentPage = totalPages;
  renderTableData();
  renderPagination(currentFilteredData.length);
});

async function loadData() {
  document.getElementById("loading").style.display = "flex";
  errorContainer.style.display = "none";
  console.log("Starting data load from:", url);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Data loaded successfully:", data);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No data received or data is empty");
    }
    allData = data;
    currentFilteredData = data;
    renderTableData();
    renderPagination(data.length);
    document.getElementById("loading").style.display = "none";
  } catch (error) {
    console.error("Error loading data:", error);
    document.getElementById("loading").style.display = "none";
    errorContainer.style.display = "block";
    document.getElementById("error-message").textContent = error.message.includes("aborted")
      ? "การโหลดข้อมูลใช้เวลานานเกินไป กรุณาตรวจสอบการเชื่อมต่อ"
      : `ไม่สามารถโหลดข้อมูลได้: ${error.message}`;
    Swal.fire({
      icon: "error",
      title: "ไม่สามารถโหลดข้อมูล",
      text: error.message.includes("aborted")
        ? "การเชื่อมต่อช้าเกินไป กรุณาตรวจสอบเครือข่ายหรือลองใหม่"
        : "ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้ กรุณาตรวจสอบ Sheet ID, ชื่อ Sheet หรือการแชร์สาธารณะ",
      confirmButtonText: "ตกลง",
    });
  }
}

// Today tab script (original)
const sheetIDToday = "1fPzWLyR0xqU30gyIMSuSCuglKEr76AT1ekCR3mY-nrU";
const sheetNameToday = "ReQuesttoday";
const urlToday = `https://opensheet.elk.sh/${sheetIDToday}/${sheetNameToday}`;
const modal = document.getElementById("detailModal");
const modalContent = document.getElementById("modalContent");
const closeModal = document.getElementById("closeModal");
const searchInputToday = document.getElementById("searchInputToday");
const tableBodyToday = document.querySelector("#data-table-today tbody");
const errorContainerToday = document.getElementById("error-container-today");
const retryButtonToday = document.getElementById("retry-button-today");
let allDataToday = [];

retryButtonToday.addEventListener("click", () => {
  errorContainerToday.style.display = "none";
  loadTodayData();
});

closeModal.onclick = () => {
  modal.style.opacity = "0";
  modal.style.transform = "scale(0.95)";
  setTimeout(() => (modal.style.display = "none"), 300);
};

window.onclick = (event) => {
  if (event.target == modal) closeModal.click();
};

function renderTableToday(data) {
  tableBodyToday.innerHTML = "";
  data.forEach((row) => {
    const tr = document.createElement("tr");
    const statusTd = document.createElement("td");
    const status = row["Status"] || "";
    statusTd.textContent = status;
    statusTd.className = status === "สั่งเบิกแล้ว" ? "status-green" : "status-red";
    tr.appendChild(statusTd);
    const columns = [
      "Timestamp",
      "Code",
      "Material Description",
      "จำนวน",
      "วิภาวดี",
      "ชื่อช่าง",
      "หน่วยงาน",
      "CallNumber",
      "CallType",
      "หมายเหตุ",
    ];
    columns.forEach((col) => {
      const td = document.createElement("td");
      let value = row[col] || "";
      if (col === "จำนวน" || col === "วิภาวดี") {
        if (value && !isNaN(value)) {
          value = Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
        } else if (value === "0" || value === 0) {
          value = "";
        }
      }
      if (col === "หมายเหตุ" && value) {
        td.style.color = "red";
        td.style.fontWeight = "bold";
      }
      if (col === "Code" && (row["หมายเหตุ"] || "").trim() !== "") {
        td.style.color = "red";
        td.style.fontWeight = "bold";
      }
      if (col === "Material Description" && (row["หมายเหตุ"] || "").trim() !== "") {
        td.style.color = "red";
        td.style.fontWeight = "bold";
      }
      if (col === "Timestamp" && (row["หมายเหตุ"] || "").trim() !== "") {
        td.style.color = "red";
        td.style.fontWeight = "bold";
      }
      if (col === "วิภาวดี" && value) {
        td.style.color = "#4caf50"; // Green color
        td.style.fontWeight = "bold";
     }
      td.textContent = value;
      tr.appendChild(td);
    });
    const detailTd = document.createElement("td");
    const btn = document.createElement("button");
    btn.textContent = "ดูรายละเอียด";
    btn.className = "detail-button";
    btn.onclick = () => {
      modalContent.innerHTML = columns
        .map((col) => {
          let label = "";
          switch (col) {
            case "Timestamp": label = "📅 วันเวลา"; break;
            case "Code": label = "🔢 Material"; break;
            case "Material Description": label = "🛠️ Description"; break;
            case "จำนวน": label = "🔢 จำนวน"; break;
            case "ชื่อช่าง": label = "👷‍♂️ ชื่อช่าง"; break;
            case "หน่วยงาน": label = "🏢 หน่วยงาน"; break;
            case "CallNumber": label = "📄 Call"; break;
            case "CallType": label = "🗳️ CallType"; break;
            case "วิภาวดี": label = "📦 คลังวิภาวดี"; break;
            case "หมายเหตุ": label = "📝 หมายเหตุ"; break;
            default: label = col;
          }
          const value = row[col] || "";
          const valueHtml = col === "หมายเหตุ" && value
            ? `<span class='value' style='color:red'>${value}</span>`
            : `<span class='value'>${value}</span>`;
          return `<div><span class='label'>${label}:</span> ${valueHtml}</div>`;
        })
        .join("");
      modal.style.display = "block";
      setTimeout(() => {
        modal.style.opacity = "1";
        modal.style.transform = "scale(1)";
      }, 10);
    };
    detailTd.appendChild(btn);
    tr.appendChild(detailTd);
    tableBodyToday.appendChild(tr);
  });
}

searchInputToday.addEventListener("input", (e) => {
  const keyword = e.target.value.toLowerCase();
  const filtered = allDataToday.filter((row) => {
    return (
      (row["Code"] || "").toLowerCase().includes(keyword) ||
      (row["Material Description"] || "").toLowerCase().includes(keyword) ||
      (row["ชื่อช่าง"] || "").toLowerCase().includes(keyword) ||
      (row["หน่วยงาน"] || "").toLowerCase().includes(keyword)
    );
  });
  renderTableToday(filtered);
});

async function loadTodayData() {
  document.getElementById("loading").style.display = "flex";
  document.getElementById("loadingToday").style.display = "block";
  errorContainerToday.style.display = "none";
  console.log("Starting data load from:", urlToday);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(urlToday, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Today data loaded successfully:", data);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No data received or data is empty");
    }
    allDataToday = data;
    renderTableToday(data);
    document.getElementById("loading").style.display = "none";
    document.getElementById("loadingToday").style.display = "none";
    document.getElementById("data-table-today").style.display = "table";
    // Fix for mobile scroll after loading
    setTimeout(() => {
      document.body.style.overflow = 'auto';
      if ('ontouchstart' in window) {
        const event = new Event('touchstart', { bubbles: true });
        document.body.dispatchEvent(event);
      }
    }, 100);
  } catch (error) {
    console.error("Error loading today data:", error);
    document.getElementById("loading").style.display = "none";
    document.getElementById("loadingToday").style.display = "none";
    errorContainerToday.style.display = "block";
    document.getElementById("error-message-today").textContent = error.message.includes("aborted")
      ? "การโหลดข้อมูลใช้เวลานานเกินไป กรุณาตรวจสอบการเชื่อมต่อ"
      : `ไม่สามารถโหลดข้อมูลได้: ${error.message}`;
    Swal.fire({
      icon: "error",
      title: "ไม่สามารถโหลดข้อมูล",
      text: error.message.includes("aborted")
        ? "การเชื่อมต่อช้าเกินไป กรุณาตรวจสอบเครือข่ายหรือลองใหม่"
        : "ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้ กรุณาตรวจสอบ Sheet ID, ชื่อ Sheet หรือการแชร์สาธารณะ",
      confirmButtonText: "ตกลง",
    });
  }
}

// All tab script
const sheetIDAll = '1fPzWLyR0xqU30gyIMSuSCuglKEr76AT1ekCR3mY-nrU';
const sheetNameAll = 'ReQuestHistory';
const urlAll = `https://opensheet.elk.sh/${sheetIDAll}/${sheetNameAll}`;
const modalAll = document.getElementById("detailModalAll");
const modalContentAll = document.getElementById("modalContentAll");
const closeModalAll = document.getElementById("closeModalAll");
const searchInputAll = document.getElementById("searchInputAll");
const tableBodyAll = document.querySelector("#data-table-all tbody");
const pageNumbersContainerAll = document.getElementById("pageNumbersAll");
const firstPageButtonAll = document.getElementById("firstPageAll");
const prevPageButtonAll = document.getElementById("prevPageAll");
const nextPageButtonAll = document.getElementById("nextPageAll");
const lastPageButtonAll = document.getElementById("lastPageAll");
const itemsPerPageSelectAll = document.getElementById("itemsPerPageAll");
let allDataAll = [];
let currentPageAll = 1;
let itemsPerPageAll = parseInt(itemsPerPageSelectAll.value);

closeModalAll.onclick = () => modalAll.style.display = "none";

window.onclick = event => {
  if (event.target == modalAll) modalAll.style.display = "none";
};

itemsPerPageSelectAll.addEventListener("change", (e) => {
  itemsPerPageAll = parseInt(e.target.value);
  currentPageAll = 1;
  renderTableAll(allDataAll);
});

function renderTableAll(data) {
  tableBodyAll.innerHTML = '';
  const startIdx = (currentPageAll - 1) * itemsPerPageAll;
  const endIdx = startIdx + itemsPerPageAll;
  const paginatedData = data.slice(startIdx, endIdx);
  paginatedData.forEach((row, i) => {
    const tr = document.createElement("tr");
    tr.style.animationDelay = `${i * 0.05}s`; // Fade-in ทีละแถว
     const status = row["Status"] || "";
    const statusTd = document.createElement("td");
    statusTd.textContent = status;
    statusTd.className = status === "สั่งเบิกแล้ว" ? "status-green" : "status-red";
    tr.appendChild(statusTd);
    const columns = ["Timestamp", "Code", "Material Description", "จำนวน", "ชื่อช่าง", "หน่วยงาน","CallNumber","CallType", "Note"];
    columns.forEach(col => {
      const td = document.createElement("td");
      td.textContent = row[col] || "";
      tr.appendChild(td);
    });
    const detailTd = document.createElement("td");
    const btn = document.createElement("button");
    btn.textContent = "ดูรายละเอียด";
    btn.className = "detail-button";
    btn.onclick = () => {
      modalContentAll.innerHTML = columns.map(col => {
        const label = col === "Timestamp" ? "วันเวลา" : col;
        return `<div><span class='label'>${label}:</span> <span class='value'>${row[col] || ''}</span></div>`;
      }).join('');
      modalAll.style.display = "block";
    };
    detailTd.appendChild(btn);
    tr.appendChild(detailTd);
    tableBodyAll.appendChild(tr);
  });
  updatePaginationAll(data);
}

function updatePaginationAll(data) {
  const totalPages = Math.ceil(data.length / itemsPerPageAll);
  pageNumbersContainerAll.innerHTML = '';
  const startPage = currentPageAll; // เริ่มที่หน้าปัจจุบัน
  const endPage = Math.min(totalPages, currentPageAll + 2); // ไปอีก 2 หน้า
  for (let i = startPage; i <= endPage; i++) {
    const pageNumberButton = document.createElement("button");
    pageNumberButton.className = `all-page-number ${i === currentPageAll ? 'active' : ''}`;
    pageNumberButton.textContent = i;
    pageNumberButton.onclick = () => {
      currentPageAll = i;
      renderTableAll(data);
    };
    pageNumbersContainerAll.appendChild(pageNumberButton);
  }
}

// ปุ่มเลื่อนไปหน้าแรก
firstPageButtonAll.onclick = () => {
  currentPageAll = 1;
  renderTableAll(allDataAll);
};

// ปุ่มย้อนกลับ
prevPageButtonAll.onclick = () => {
  if (currentPageAll > 1) {
    currentPageAll--;
    renderTableAll(allDataAll);
  }
};

// ปุ่มไปหน้า next
nextPageButtonAll.onclick = () => {
  const totalPages = Math.ceil(allDataAll.length / itemsPerPageAll);
  if (currentPageAll < totalPages) {
    currentPageAll++;
    renderTableAll(allDataAll);
  }
};

// ปุ่มไปหน้าสุดท้าย
lastPageButtonAll.onclick = () => {
  currentPageAll = Math.ceil(allDataAll.length / itemsPerPageAll);
  renderTableAll(allDataAll);
};

searchInputAll.addEventListener("input", e => {
  const keyword = e.target.value.toLowerCase();
  const filtered = allDataAll.filter(row => {
    return (
      (row["Code"] || "").toLowerCase().includes(keyword) ||
      (row["Material Description"] || "").toLowerCase().includes(keyword) ||
      (row["ชื่อช่าง"] || "").toLowerCase().includes(keyword) ||
      (row["หน่วยงาน"] || "").toLowerCase().includes(keyword) ||
      (row["หมายเหตุ"] || "").toLowerCase().includes(keyword)
    );
  });
  renderTableAll(filtered);
});

function loadAllData() {
  fetch(urlAll)
    .then(response => response.json())
    .then(data => {
      allDataAll = data;
      renderTableAll(data);
    })
    .catch(error => {
      console.error("ไม่สามารถโหลดข้อมูลได้:", error);
    });
}

// Pending-calls tab script
const sheetIDPending = '1dzE4Xjc7H0OtNUmne62u0jFQT-CiGsG2eBo-1v6mrZk';
const sheetNamePending = 'Call_Report';
const urlPending = `https://opensheet.elk.sh/${sheetIDPending}/${sheetNamePending}`;
const modalPending = document.getElementById("detailModalPending");
const modalContentPending = document.getElementById("modalContentPending");
const closeModalPending = document.getElementById("closeModalPending");
const teamFilterPending = document.getElementById("teamFilterPending");
const searchInputPending = document.getElementById("searchInputPending");
const searchButtonPending = document.getElementById("searchButtonPending");
const tableBodyPending = document.querySelector("#data-table-pending tbody");
const pageNumbersContainerPending = document.getElementById("pageNumbersPending");
const firstPageButtonPending = document.getElementById("firstPagePending");
const prevPageButtonPending = document.getElementById("prevPagePending");
const nextPageButtonPending = document.getElementById("nextPagePending");
const lastPageButtonPending = document.getElementById("lastPagePending");
const itemsPerPageSelectPending = document.getElementById("itemsPerPagePending");
let allDataPending = [];
let currentPagePending = 1;
let itemsPerPagePending = 20;
let sortConfigPending = { column: null, direction: 'asc' };

closeModalPending.onclick = () => modalPending.style.display = "none";

window.onclick = event => {
  if (event.target == modalPending) modalPending.style.display = "none";
};

itemsPerPageSelectPending.addEventListener("change", (e) => {
  itemsPerPagePending = parseInt(e.target.value);
  currentPagePending = 1; // รีเซ็ตหน้าเมื่อเปลี่ยนจำนวนรายการต่อหน้า
  filterAndRenderTablePending();
});

searchInputPending.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    currentPagePending = 1; // รีเซ็ตหน้าเมื่อค้นหาใหม่
    filterAndRenderTablePending();
  }
});

searchButtonPending.addEventListener("click", () => {
  currentPagePending = 1; // รีเซ็ตหน้าเมื่อค้นหาใหม่
  filterAndRenderTablePending();
});

function populateTeamFilterPending(data) {
  const filteredData = data.filter(row => {
    const vipa = Number(row["Vipa"] || 0);
    const pendingDept = (row["ค้างหน่วยงาน"] || "").toLowerCase();
    return vipa > 0 &&
           !pendingDept.includes("stock วิภาวดี 62") &&
           !pendingDept.includes("nec_ยกเลิกผลิต");
  });
  const teams = [...new Set(filteredData.map(row => row["Team"]).filter(team => team && team.trim() !== ""))].sort();
  teamFilterPending.innerHTML = '<option value="">ทั้งหมด</option>';
  if (teams.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "ไม่มีทีมที่ตรงตามเงื่อนไข";
    option.disabled = true;
    teamFilterPending.appendChild(option);
  } else {
    teams.forEach(team => {
      const option = document.createElement("option");
      option.value = team;
      option.textContent = team;
      teamFilterPending.appendChild(option);
    });
  }
}

function addSortListenersPending() {
  const sortableHeaders = document.querySelectorAll("#pending-calls th.sortable");
  sortableHeaders.forEach(header => {
    header.addEventListener("click", () => {
      const column = header.getAttribute("data-column");
      if (sortConfigPending.column === column) {
        sortConfigPending.direction = sortConfigPending.direction === 'asc' ? 'desc' : 'asc';
      } else {
        sortConfigPending.column = column;
        sortConfigPending.direction = 'asc';
      }
      updateSortArrowsPending();
      filterAndRenderTablePending();
    });
  });
}

function updateSortArrowsPending() {
  const sortableHeaders = document.querySelectorAll("#pending-calls th.sortable");
  sortableHeaders.forEach(header => {
    const arrow = header.querySelector(".pending-arrow");
    const column = header.getAttribute("data-column");
    if (column === sortConfigPending.column) {
      arrow.textContent = sortConfigPending.direction === 'asc' ? '↑' : '↓';
    } else {
      arrow.textContent = '';
    }
  });
}

function filterAndRenderTablePending() {
  const selectedTeam = teamFilterPending.value;
  const keyword = searchInputPending.value.toLowerCase().trim();
  let filteredData = allDataPending.filter(row => {
    const pendingDept = (row["ค้างหน่วยงาน"] || "").toLowerCase();
    return Number(row["Vipa"] || 0) > 0 &&
           !pendingDept.includes("stock วิภาวดี 62") &&
           !pendingDept.includes("nec_ยกเลิกผลิต") &&
           (!selectedTeam || row["Team"] === selectedTeam) &&
           (!keyword ||
             (row["DateTime"] || "").toLowerCase().includes(keyword) ||
             (row["Ticket Number"] || "").toLowerCase().includes(keyword) ||
             (row["Team"] || "").toLowerCase().includes(keyword) ||
             (row["Brand"] || "").toLowerCase().includes(keyword) ||
             (row["ค้างหน่วยงาน"] || "").toLowerCase().includes(keyword) ||
             (row["Material"] || "").toLowerCase().includes(keyword) ||
             (row["Description"] || "").toLowerCase().includes(keyword) ||
             (row["Vipa"] || "").toLowerCase().includes(keyword) ||
             (row["DayRepair"] || "").toLowerCase().includes(keyword)
           );
  });
  if (sortConfigPending.column) {
    filteredData.sort((a, b) => {
      let valueA = a[sortConfigPending.column] || "";
      let valueB = b[sortConfigPending.column] || "";
      if (sortConfigPending.column === 'DayRepair' || sortConfigPending.column === 'Vipa') {
        valueA = Number(valueA) || 0;
        valueB = Number(valueB) || 0;
        return sortConfigPending.direction === 'asc' ? valueA - valueB : valueB - valueA;
      } else {
        valueA = valueA.toString().toLowerCase();
        valueB = valueB.toString().toLowerCase();
        return sortConfigPending.direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }
    });
  }
  // ตรวจสอบว่า currentPage อยู่ในช่วงที่ถูกต้อง
  const totalPages = Math.ceil(filteredData.length / itemsPerPagePending);
  if (currentPagePending > totalPages) {
    currentPagePending = totalPages || 1;
  }
  renderTablePending(filteredData);
  updateCallCountPending(filteredData);
}

teamFilterPending.addEventListener("change", () => {
  currentPagePending = 1; // รีเซ็ตหน้าเมื่อเปลี่ยนทีม
  filterAndRenderTablePending();
});

function updateCallCountPending(data) {
  const uniqueTickets = [...new Set(data.map(row => row["Ticket Number"]))];
  const count = uniqueTickets.length;
  const callCountValue = document.getElementById("callCountValuePending");
  callCountValue.textContent = count;
}

function formatDateTimePending(dateTime) {
  if (!dateTime) return "";
  const datePart = dateTime.split(" ")[0];
  return datePart;
}

function renderTablePending(data) {
  tableBodyPending.innerHTML = '';
  const startIdx = (currentPagePending - 1) * itemsPerPagePending;
  const endIdx = startIdx + itemsPerPagePending;
  const paginatedData = data.slice(startIdx, endIdx);
  if (paginatedData.length === 0) {
    tableBodyPending.innerHTML = '<tr><td colspan="10" class="pending-text-center">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</td></tr>';
    updatePaginationPending(data);
    return;
  }
  const ticketGroups = {};
  data.forEach(row => {
    const ticket = row["Ticket Number"];
    if (!ticketGroups[ticket]) {
      ticketGroups[ticket] = [];
    }
    ticketGroups[ticket].push(row);
  });
  const uniqueTickets = Object.keys(ticketGroups).sort();
  const colorMap = {};
  uniqueTickets.forEach((ticket, index) => {
    if (ticket === "24103102058") {
      colorMap[ticket] = "pending-yellow-light";
    } else if (ticket === "25011101274") {
      colorMap[ticket] = "pending-pink-pastel";
    } else {
      colorMap[ticket] = index % 2 === 0 ? "pending-yellow-light" : "pending-pink-pastel";
    }
  });
  paginatedData.forEach((row, i) => {
    const tr = document.createElement("tr");
    tr.style.animationDelay = `${i * 0.05}s`;
    const ticket = row["Ticket Number"];
    tr.className = colorMap[ticket];
    const columns = ["DateTime", "Ticket Number", "Team", "Brand", "ค้างหน่วยงาน", "Material", "Description", "Vipa", "DayRepair"];
    columns.forEach(col => {
      const td = document.createElement("td");
      let cellValue = row[col] || "";
      if (col === "DateTime") {
        cellValue = formatDateTimePending(cellValue);
      } else if (col === "DayRepair" || col === "Vipa") {
        const numValue = Number(cellValue);
        cellValue = isNaN(numValue) ? "" : numValue.toString();
      }
      td.textContent = cellValue;
      if (col === "Description") {
        td.classList.add("pending-text-left");
      } else if (col === "Vipa" || col === "DayRepair") {
        td.classList.add("pending-text-center");
      }
      if ((col === "Material" || col === "Description") && row["Description"] === "Code ผิด") {
        td.className = "pending-highlight-red";
      }
      tr.appendChild(td);
    });
    const detailTd = document.createElement("td");
    const btn = document.createElement("button");
    btn.textContent = "ดูรายละเอียด";
    btn.className = "pending-detail-button";
    btn.onclick = () => {
      modalContentPending.innerHTML = columns.map(col => {
        let value = row[col] || "";
        if (col === "DateTime") {
          value = formatDateTimePending(value);
        } else if (col === "DayRepair" || col === "Vipa") {
          const numValue = Number(value);
          value = isNaN(numValue) ? "" : numValue.toString();
        }
        let valueClass = (col === "Material" || col === "Description") && row["Description"] === "Code ผิด" ? "pending-highlight-red" : "value";
        return `<div><span class='label'>${col}:</span> <span class='${valueClass}'>${value}</span></div>`;
      }).join('');
      modalPending.style.display = "block";
    };
    detailTd.appendChild(btn);
    tr.appendChild(detailTd);
    tableBodyPending.appendChild(tr);
  });
  updatePaginationPending(data);
}

function updatePaginationPending(data) {
  const totalPages = Math.ceil(data.length / itemsPerPagePending);
  pageNumbersContainerPending.innerHTML = '';
  if (totalPages === 0) {
    firstPageButtonPending.disabled = true;
    prevPageButtonPending.disabled = true;
    nextPageButtonPending.disabled = true;
    lastPageButtonPending.disabled = true;
    return;
  }
  const startPage = Math.max(1, currentPagePending - 1);
  const endPage = Math.min(totalPages, currentPagePending + 2);
  for (let i = startPage; i <= endPage; i++) {
    const pageNumberButton = document.createElement("button");
    pageNumberButton.className = `pending-page-number ${i === currentPagePending ? 'active' : ''}`;
    pageNumberButton.textContent = i;
    pageNumberButton.onclick = () => {
      currentPagePending = i;
      filterAndRenderTablePending();
    };
    pageNumbersContainerPending.appendChild(pageNumberButton);
  }
  firstPageButtonPending.disabled = currentPagePending === 1;
  prevPageButtonPending.disabled = currentPagePending === 1;
  nextPageButtonPending.disabled = currentPagePending === totalPages;
  lastPageButtonPending.disabled = currentPagePending === totalPages;
}

firstPageButtonPending.onclick = () => {
  currentPagePending = 1;
  filterAndRenderTablePending();
};

prevPageButtonPending.onclick = () => {
  if (currentPagePending > 1) {
    currentPagePending--;
    filterAndRenderTablePending();
  }
};

nextPageButtonPending.onclick = () => {
  const totalPages = Math.ceil(allDataPending.filter(row => {
    const pendingDept = (row["ค้างหน่วยงาน"] || "").toLowerCase();
    return Number(row["Vipa"] || 0) > 0 &&
           !pendingDept.includes("stock วิภาวดี 62") &&
           !pendingDept.includes("nec_ยกเลิกผลิต");
  }).length / itemsPerPagePending);
  if (currentPagePending < totalPages) {
    currentPagePending++;
    filterAndRenderTablePending();
  }
};

lastPageButtonPending.onclick = () => {
  currentPagePending = Math.ceil(allDataPending.filter(row => {
    const pendingDept = (row["ค้างหน่วยงาน"] || "").toLowerCase();
    return Number(row["Vipa"] || 0) > 0 &&
           !pendingDept.includes("stock วิภาวดี 62") &&
           !pendingDept.includes("nec_ยกเลิกผลิต");
  }).length / itemsPerPagePending);
  filterAndRenderTablePending();
};

function loadPendingCallsData() {
  fetch(urlPending)
    .then(response => response.json())
    .then(data => {
      allDataPending = data;
      populateTeamFilterPending(allDataPending);
      addSortListenersPending();
      filterAndRenderTablePending();
    })
    .catch(error => {
      console.error("ไม่สามารถโหลดข้อมูลได้:", error);
      tableBodyPending.innerHTML = '<tr><td colspan="10" class="pending-text-center">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
    });
}

// Event listeners for buttons (to replace onclick attributes in HTML for better practice)
// Note: Update HTML to remove onclick and add IDs if needed, e.g., <button id="loginBtn"> for login button
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn'); // Assume ID added in HTML
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }
  const toggleBtn = document.getElementById('togglePassword');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', togglePasswordVisibility);
  }
  // Add similar for other onclicks if any
});

// Auto-load default data if logged in
if (appContent.classList.contains('logged-in')) {
  loadData();
}
  
