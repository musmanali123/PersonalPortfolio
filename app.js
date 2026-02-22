const navbar = document.getElementById('navbar');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileMenu = document.getElementById('mobileMenu');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  syncMobileMenuPosition();
});

function syncMobileMenuPosition() {
  const navHeight = Math.round(navbar.getBoundingClientRect().height);
  mobileMenu.style.top = `${navHeight}px`;
  mobileMenu.style.maxHeight = `calc(100dvh - ${navHeight}px)`;
}

function closeMobileMenu() {
  mobileMenu.classList.remove('active');
  hamburgerBtn.classList.remove('active');
  document.body.classList.remove('menu-open');
}

function toggleMobileMenu() {
  const willOpen = !mobileMenu.classList.contains('active');
  mobileMenu.classList.toggle('active', willOpen);
  hamburgerBtn.classList.toggle('active', willOpen);
  document.body.classList.toggle('menu-open', willOpen);
}

hamburgerBtn.addEventListener('click', toggleMobileMenu);

document.querySelectorAll('.mobile-menu a').forEach((link) => {
  link.addEventListener('click', closeMobileMenu);
});

document.addEventListener('click', (event) => {
  if (!mobileMenu.classList.contains('active')) {
    return;
  }

  const clickedInsideMenu = mobileMenu.contains(event.target);
  const clickedHamburger = hamburgerBtn.contains(event.target);
  if (!clickedInsideMenu && !clickedHamburger) {
    closeMobileMenu();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMobileMenu();
  }
});

window.addEventListener('resize', () => {
  syncMobileMenuPosition();
  if (window.innerWidth > 768) {
    closeMobileMenu();
  }
});

syncMobileMenuPosition();

// ===== SCROLL ANIMATION =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

// ===== CONSULTATION FORM =====
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
];
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/usman232429@gmail.com';

let selectedFile = null;

const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const form = document.getElementById('consultationForm');
const submitBtn = document.getElementById('submitBtn');

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) {
    return;
  }

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const isAllowedByType = ALLOWED_TYPES.includes(file.type);
  const isAllowedByExtension = ALLOWED_EXTENSIONS.includes(ext);

  if (!isAllowedByType && !isAllowedByExtension) {
    showToast('Invalid file type', `${file.name} is not allowed. Use PDF, DOC, or DOCX.`, true);
    fileInput.value = '';
    selectedFile = null;
    renderFiles();
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    showToast('File too large', `${file.name} exceeds 5MB limit.`, true);
    fileInput.value = '';
    selectedFile = null;
    renderFiles();
    return;
  }

  selectedFile = file;
  renderFiles();
});

function renderFiles() {
  fileList.innerHTML = '';
  if (!selectedFile) {
    return;
  }

  const chip = document.createElement('span');
  chip.className = 'file-chip';

  const name = document.createElement('span');
  name.textContent = selectedFile.name;

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = 'x';
  removeBtn.addEventListener('click', removeSelectedFile);

  chip.appendChild(name);
  chip.appendChild(removeBtn);
  fileList.appendChild(chip);
}

function removeSelectedFile() {
  selectedFile = null;
  fileInput.value = '';
  renderFiles();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const summary = form.summary.value.trim();

  if (!name || !email || !summary) {
    showToast('Missing fields', 'Please fill in name, email, and summary.', true);
    return;
  }

  const isFileProtocol = window.location.protocol === 'file:';

  if (isFileProtocol) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Opening Email...';

    const subject = encodeURIComponent(`Free Consultation Request from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\n\nSummary:\n${summary}\n\n${selectedFile ? 'Attachment selected in form. Please attach it manually before sending.' : 'No attachment provided.'}`
    );

    window.location.href = `mailto:usman232429@gmail.com?subject=${subject}&body=${body}`;

    setTimeout(() => {
      showToast('Email draft opened', 'Please press Send in your email app to deliver this query.');
      form.reset();
      selectedFile = null;
      renderFiles();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Consultation Request';
    }, 600);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  const formData = new FormData();
  formData.append('name', name);
  formData.append('email', email);
  formData.append('phone', phone || 'N/A');
  formData.append('summary', summary);
  formData.append('_subject', `Free Consultation Request from ${name}`);
  formData.append('_captcha', 'false');
  formData.append('_url', window.location.href);
  if (selectedFile) {
    formData.append('attachment', selectedFile);
  }

  try {
    const response = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Form submission failed');
    }

    const result = await response.json();
    const isSuccess = result && String(result.success).toLowerCase() === 'true';
    if (!isSuccess) {
      throw new Error(result?.message || 'Form submission was rejected');
    }

    showToast('Request sent', 'Your consultation request was sent successfully.');
    form.reset();
    selectedFile = null;
    renderFiles();
  } catch (error) {
    showToast('Send failed', 'Unable to send right now. Please try again in a moment.', true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Consultation Request';
  }
});

// ===== TOAST =====
function showToast(title, desc, isError = false) {
  const toast = document.getElementById('toast');
  toast.querySelector('.toast-title').textContent = title;
  toast.querySelector('.toast-desc').textContent = desc;
  toast.className = 'toast show' + (isError ? ' error' : '');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}
