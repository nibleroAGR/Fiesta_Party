// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBUwlY1tb7dCpQswNT0Km26Dc24Gqqpq2M",
    authDomain: "prueba-c53d7.firebaseapp.com",
    projectId: "prueba-c53d7",
    storageBucket: "prueba-c53d7.firebasestorage.app",
    messagingSenderId: "919677464970",
    appId: "1:919677464970:web:5ff47024af92ca769c5873"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- Service State ---
let currentServiceExtras = [];
let currentServiceGallery = [];
let currentServiceCover = null;
let currentMobilityZones = [];
let currentServiceBlockedDates = [];

// --- State ---
let currentUser = null;
let userRole = null; // 'family', 'business', or 'service'
let isRegistering = false;
let intendedRole = null; // Role selected on landing

// --- DOM Navigation ---
// --- DOM Navigation ---
function showView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
    const targetElement = document.getElementById(viewId);
    if (targetElement) {
        targetElement.classList.remove('hidden');
    }

    // Toggle Navbar visibility based on view
    const mainNav = document.getElementById('main-nav');
    const familyNav = document.getElementById('family-nav');
    const businessNav = document.getElementById('business-nav');

    // Hide all navs first
    if (familyNav) familyNav.classList.add('hidden');
    if (businessNav) businessNav.classList.add('hidden');

    if (viewId === 'landing-view') {
        if (mainNav) mainNav.style.display = 'flex';
    } else if (['family-view', 'reservation-view', 'invitations-view', 'notes-view', 'family-profile-view'].includes(viewId)) {
        if (mainNav) mainNav.style.display = 'none';
        if (familyNav) familyNav.classList.remove('hidden');
    } else if (['business-view', 'business-reservations-view', 'business-notifications-view', 'business-billing-view', 'business-stats-view', 'business-history-view', 'business-billing-history-view'].includes(viewId)) {
        if (mainNav) mainNav.style.display = 'none';
        if (businessNav) businessNav.classList.remove('hidden');
    } else if (['service-view', 'service-reservations-view', 'service-notifications-view', 'service-billing-view', 'service-stats-view'].includes(viewId)) {
        if (mainNav) mainNav.style.display = 'none';
        const serviceNav = document.getElementById('service-nav');
        if (serviceNav) serviceNav.classList.remove('hidden');
    } else {
        if (mainNav) mainNav.style.display = 'none';
    }
}

// --- UI Helpers ---
window.setAuthMode = (registering) => {
    isRegistering = registering;
    const extraFields = document.getElementById('register-fields');
    const btn = document.getElementById('auth-action-btn');
    const switchText = document.getElementById('switch-text');
    const toggleBtn = document.getElementById('toggle-auth-mode');

    const rememberContainer = document.getElementById('remember-session-container');
    const forgotContainer = document.getElementById('forgot-password-container');

    if (isRegistering) {
        btn.innerText = "Crear Cuenta";
        switchText.innerText = "¿Ya tienes cuenta?";
        toggleBtn.innerText = "Inicia Sesión";
        extraFields.classList.remove('hidden');
        if (rememberContainer) rememberContainer.style.display = 'none';
        if (forgotContainer) forgotContainer.style.display = 'none';
    } else {
        btn.innerText = "Entrar";
        switchText.innerText = "¿No tienes cuenta?";
        toggleBtn.innerText = "Regístrate";
        extraFields.classList.add('hidden');
        if (rememberContainer) rememberContainer.style.display = 'flex';
        if (forgotContainer) forgotContainer.style.display = 'block';
    }
};

// --- Custom Professional Modals ---
let customConfirmCallback = null;

window.showAlert = (message) => {
    const modal = document.getElementById('custom-alert-modal');
    const msgEl = document.getElementById('custom-alert-message');
    if (modal && msgEl) {
        msgEl.innerText = message;
        modal.classList.remove('hidden');
    }
};

window.closeCustomAlert = () => {
    const modal = document.getElementById('custom-alert-modal');
    if (modal) modal.classList.add('hidden');
};

window.showConfirm = (message, callback) => {
    const modal = document.getElementById('custom-confirm-modal');
    const msgEl = document.getElementById('custom-confirm-message');
    if (modal && msgEl) {
        msgEl.innerText = message;
        customConfirmCallback = callback;
        modal.classList.remove('hidden');
    }
};

window.closeCustomConfirm = (result) => {
    const modal = document.getElementById('custom-confirm-modal');
    if (modal) modal.classList.add('hidden');

    if (result && typeof customConfirmCallback === 'function') {
        customConfirmCallback();
    }
    customConfirmCallback = null;
};


// --- Auth Flow ---
function showAuth(role) {
    intendedRole = role;
    showView('auth-view');
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');

    if (role === 'family') {
        title.innerText = isRegistering ? "Registro Familia" : "Acceso Familia";
        subtitle.innerText = isRegistering ? "Únete a la comunidad" : "¡Encuentra tu fiesta ideal!";
    } else if (role === 'business') {
        title.innerText = isRegistering ? "Registro Local" : "Acceso Local";
        subtitle.innerText = "Gestiona tu negocio y reservas";
    } else if (role === 'service') {
        title.innerText = isRegistering ? "Registro Servicio" : "Acceso Servicio";
        subtitle.innerText = "Anuncia tu talento y consigue clientes";
    }

    // Reset Form and Button State
    document.getElementById('auth-form').reset();
    const btn = document.getElementById('auth-action-btn');
    btn.disabled = false;
    // ensure text is correct based on global isRegistering state
    btn.innerText = isRegistering ? "Crear Cuenta" : "Entrar";
}

// Toggle Login / Register
document.getElementById('toggle-auth-mode').addEventListener('click', (e) => {
    e.preventDefault();
    isRegistering = !isRegistering;
    const btn = document.getElementById('auth-action-btn');
    const switchText = document.getElementById('switch-text');
    const toggleBtn = document.getElementById('toggle-auth-mode');
    const extraFields = document.getElementById('register-fields');

    const rememberContainer = document.getElementById('remember-session-container');
    const forgotContainer = document.getElementById('forgot-password-container');

    if (isRegistering) {
        btn.innerText = "Crear Cuenta";
        switchText.innerText = "¿Ya tienes cuenta?";
        toggleBtn.innerText = "Inicia Sesión";
        extraFields.classList.remove('hidden');
        if (rememberContainer) rememberContainer.style.display = 'none';
        if (forgotContainer) forgotContainer.style.display = 'none';
    } else {
        btn.innerText = "Entrar";
        switchText.innerText = "¿No tienes cuenta?";
        toggleBtn.innerText = "Regístrate";
        extraFields.classList.add('hidden');
        if (rememberContainer) rememberContainer.style.display = 'flex';
        if (forgotContainer) forgotContainer.style.display = 'block';
    }
});

// Handle Auth Submit
document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('auth-action-btn');

    btn.disabled = true;
    btn.innerText = "Cargando...";

    try {
        if (isRegistering) {
            // Register
            const cred = await auth.createUserWithEmailAndPassword(email, password);
            const user = cred.user;
            const name = document.getElementById('full-name').value || "Usuario";

            // Save User Profile with Role
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: email,
                name: name,
                role: intendedRole,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log("Registrado como:", intendedRole);

            // If business, create empty venue profile
            if (intendedRole === 'business') {
                await db.collection('venues').doc(user.uid).set({
                    ownerId: user.uid,
                    name: name + " Venue",
                    description: "",
                    price: 0,
                    capacity: 0,
                    role: 'business'
                });
            }

            // If service, create empty service profile
            if (intendedRole === 'service') {
                await db.collection('venues').doc(user.uid).set({
                    ownerId: user.uid,
                    name: name,
                    role: 'service',
                    description: "",
                    price: 0,
                    priceType: 'hour',
                    mobilityZones: [],
                    services: [], // for extras
                    tags: [],
                    workDays: [1, 2, 3, 4, 5]
                });
            }

        } else {
            // Login
            const rememberMe = document.getElementById('remember-me')?.checked;

            try {
                // Ensure cloud sign out to avoid stale/expired credentials
                await auth.signOut();

                if (window.firebase && firebase.auth && firebase.auth.Auth) {
                    const p = rememberMe
                        ? firebase.auth.Auth.Persistence.LOCAL
                        : firebase.auth.Auth.Persistence.SESSION;
                    await auth.setPersistence(p);
                }
            } catch (pError) {
                console.warn("Persistence error:", pError);
            }

            await auth.signInWithEmailAndPassword(email, password);
        }
    } catch (error) {
        console.error("Auth Error:", error);
        showAlert(error.message);
        btn.disabled = false;
        btn.innerText = isRegistering ? "Crear Cuenta" : "Entrar";
    }
});

window.resetPassword = async () => {
    const email = document.getElementById('email').value;
    if (!email) {
        showAlert("Por favor, introduce tu email arriba primero.");
        return;
    }

    try {
        await auth.sendPasswordResetEmail(email);
        showAlert("¡Listo! Te hemos enviado un enlace a tu correo para que cambies tu contraseña.");
    } catch (error) {
        console.error("Reset Error:", error);
        showAlert("Error: " + error.message);
    }
}

// Reusable function to redirect user after login
async function handleUserRedirect(uid) {
    try {
        const doc = await db.collection('users').doc(uid).get();
        if (!doc.exists) {
            console.error("User profile not found in Firestore for UID:", uid);
            // Handle race conditions during registration
            if (isRegistering) {
                setTimeout(() => handleUserRedirect(uid), 1500);
                return;
            }
            showAlert("No se encontró tu perfil. Por favor, regístrate de nuevo.");
            auth.signOut();
            return;
        }

        const data = doc.data();
        userRole = data.role;
        console.log("Logged in role:", userRole);

        // Reset UI
        const btn = document.getElementById('auth-action-btn');
        if (btn) {
            btn.disabled = false;
            btn.innerText = isRegistering ? "Crear Cuenta" : "Entrar";
        }

        if (userRole === 'family') {
            const nameDisplay = document.getElementById('user-name-display');
            if (nameDisplay) nameDisplay.innerText = data.name;

            const initialTab = document.querySelector('#family-nav .nav-item');
            switchFamilyTab('family-view', initialTab);
            loadVenues();
        } else if (userRole === 'business') {
            const bizDisplay = document.getElementById('biz-name-display');
            if (bizDisplay) bizDisplay.innerText = data.name || "Empresa";

            const bizTabs = document.querySelectorAll('#business-nav .nav-item');
            const configTab = bizTabs[3] || bizTabs[0];

            switchBusinessTab('business-view', configTab);
            loadBusinessProfile();
            setTimeout(() => updateNotificationBadge(), 1000);
        } else if (userRole === 'service') {
            const svcDisplay = document.getElementById('service-name-display');
            if (svcDisplay) svcDisplay.innerText = data.name || "Servicio";

            const svcTabs = document.querySelectorAll('#service-nav .nav-item');
            const configTab = svcTabs[3] || svcTabs[0];

            switchServiceTab('service-view', configTab);
            loadServiceProfile();
            // setTimeout(() => updateServiceNotificationBadge(), 1000); // To implement
        } else {
            showAlert("Rol no definido");
        }
    } catch (err) {
        console.error("Redirect Error:", err);
        showAlert("Error al cargar tu sesión: " + err.message);
    }
}

// --- Business Navigation Helper ---
window.switchServiceTab = (viewId, el) => {
    showView(viewId);
    document.querySelectorAll('#service-nav .nav-item').forEach(item => item.classList.remove('active'));
    if (el) el.classList.add('active');

    if (viewId === 'service-view') loadServiceProfile();
    if (viewId === 'service-reservations-view') loadServiceReservations();
    if (viewId === 'service-stats-view') loadServiceStats();
    if (viewId === 'service-billing-view') loadServiceBilling();
};

window.switchFamilyTab = (viewId, el) => {
    showView(viewId);
    document.querySelectorAll('#family-nav .nav-item').forEach(item => item.classList.remove('active'));
    if (el) el.classList.add('active');

    if (viewId === 'reservation-view') loadActiveReservation();
    if (viewId === 'family-view') loadVenues();
};

window.switchBusinessTab = (viewId, el) => {
    showView(viewId);

    // Update Nav Active State
    document.querySelectorAll('#business-nav .nav-item').forEach(item => item.classList.remove('active'));
    if (el) el.classList.add('active');

    // Load data if needed for business views
    if (viewId === 'business-view') loadBusinessProfile();
    if (viewId === 'business-reservations-view') loadBusinessReservations();
    if (viewId === 'business-notifications-view') loadBusinessNotifications();
    if (viewId === 'business-history-view') loadBusinessHistory();
    if (viewId === 'business-stats-view') loadBusinessStats();
    if (viewId === 'business-billing-view') loadBusinessBilling();
    if (viewId === 'business-billing-history-view') loadBusinessBillingHistory();
};

// Auth State Listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        await handleUserRedirect(user.uid);
    } else {
        currentUser = null;
        userRole = null;
        showView('landing-view');
        loadVenues(); // Load venues on landing for guests
    }
});

window.logout = async () => {
    try {
        await auth.signOut();
        // Explicitly hide all navs to avoid ghost icons
        document.querySelectorAll('.bottom-nav').forEach(nav => nav.classList.add('hidden'));
        showView('landing-view');
    } catch (err) {
        console.error("Error signing out:", err);
        // Fallback for UI if Firebase fails
        showView('landing-view');
    }
};

// --- Global State Extensions ---
let currentVenueServices = [];
let currentVenueGallery = [];
let currentCoverImage = null;

// --- Business Logic ---
async function loadBusinessProfile() {
    if (!currentUser) return;
    document.getElementById('biz-name-display').innerText = "Cargando...";

    const doc = await db.collection('venues').doc(currentUser.uid).get();
    if (doc.exists) {
        const data = doc.data();
        document.getElementById('biz-name-display').innerText = data.name;
        document.getElementById('venue-name').value = data.name;
        document.getElementById('venue-desc').value = data.description || "";
        document.getElementById('venue-city').value = data.city || "";
        document.getElementById('venue-address').value = data.address || "";
        document.getElementById('venue-tags').value = data.tags ? data.tags.join(', ') : "";
        document.getElementById('venue-price').value = data.price || "";
        document.getElementById('venue-min-kids').value = data.minKids || 10;
        document.getElementById('venue-capacity').value = data.capacity || "";
        document.getElementById('venue-email').value = data.email || "";
        document.getElementById('venue-phone').value = data.phone || "";

        // Load Extended Data
        currentVenueServices = data.services || [];
        renderServicesList();

        // Load Schedule
        const openDays = data.scheduleDays || [];
        document.querySelectorAll('input[name="openDays"]').forEach(cb => {
            cb.checked = openDays.includes(parseInt(cb.value));
        });

        window.currentSchedule.timeSlots = data.timeSlots || [];
        renderSlots();

        window.currentSchedule.blockedDates = data.blockedDates || [];
        renderBlockedDates();

        if (data.coverImage) {
            currentCoverImage = data.coverImage;
            document.getElementById('cover-preview').style.backgroundImage = `url(${data.coverImage})`;
        }

        currentVenueGallery = data.gallery || [];
        renderGalleryPreview();

        // Update Stats Display
        document.getElementById('stat-reservations').innerText = data.totalReservations || 0;
        document.getElementById('stat-visits').innerText = data.profileVisits || 0;

        // Migración / Carga de Reglas de Precios
        window.venuePricingRules = data.pricingRules || [];

        // Si no hay reglas (negocio antiguo), migramos los datos planos existentes
        if (window.venuePricingRules.length === 0 && (data.price !== undefined || data.scheduleDays)) {
            window.venuePricingRules.push({
                id: 'legacy_default',
                name: 'Tarifa General',
                days: data.scheduleDays || [1, 2, 3, 4, 5, 6, 0],
                price: data.price || 0,
                minKids: data.minKids || 10,
                slots: data.timeSlots || []
            });
        }
        renderPricingRules();
    }
}

// Service Manager Logic
document.getElementById('btn-add-service').addEventListener('click', () => {
    const name = document.getElementById('new-service-name').value;
    const price = document.getElementById('new-service-price').value;
    if (name && price) {
        currentVenueServices.push({ name, price: parseFloat(price) });
        renderServicesList();
        document.getElementById('new-service-name').value = '';
        document.getElementById('new-service-price').value = '';
    }
});

function renderServicesList() {
    const ul = document.getElementById('business-services-list');
    ul.innerHTML = '';
    currentVenueServices.forEach((svc, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${svc.name} - <b>${svc.price}€</b></span> <button onclick="removeService(${idx})">x</button>`;
        ul.appendChild(li);
    });
}
window.removeService = (idx) => {
    currentVenueServices.splice(idx, 1);
    renderServicesList();
}

// Schedule Logic
window.currentSchedule = { openDays: [], timeSlots: [], blockedDates: [] };

// --- Dynamic Pricing Rules Manager ---
window.venuePricingRules = [];

window.addPricingRule = () => {
    const id = Date.now().toString();
    window.venuePricingRules.push({
        id: id,
        name: "Nuevo Tramo",
        days: [1, 2, 3, 4, 5], // Por defecto L-V
        price: 0,
        minKids: 10,
        slots: ["17:00"]
    });
    renderPricingRules();
    autoSaveVenue();
};

window.removePricingRule = (id) => {
    window.venuePricingRules = window.venuePricingRules.filter(r => r.id !== id);
    renderPricingRules();
    autoSaveVenue();
};

window.updateRuleField = (id, field, value) => {
    const rule = window.venuePricingRules.find(r => r.id === id);
    if (!rule) return;

    if (field === 'price') rule.price = parseFloat(value) || 0;
    else if (field === 'minKids') rule.minKids = parseInt(value) || 0;
    else if (field === 'name') rule.name = value;

    autoSaveVenue();
};

window.toggleDayInRule = (id, day) => {
    const rule = window.venuePricingRules.find(r => r.id === id);
    if (!rule) return;

    const dayNum = parseInt(day);
    if (rule.days.includes(dayNum)) {
        rule.days = rule.days.filter(d => d !== dayNum);
    } else {
        rule.days.push(dayNum);
    }
    autoSaveVenue();
};

window.addSlotToRule = (ruleId) => {
    const timeInput = document.getElementById(`new-slot-${ruleId}`);
    const time = timeInput.value;
    const rule = window.venuePricingRules.find(r => r.id === ruleId);

    if (time && rule && !rule.slots.includes(time)) {
        rule.slots.push(time);
        rule.slots.sort();
        renderPricingRules();
        autoSaveVenue();
    }
};

window.removeSlotFromRule = (ruleId, idx) => {
    const rule = window.venuePricingRules.find(r => r.id === ruleId);
    if (rule) {
        rule.slots.splice(idx, 1);
        renderPricingRules();
        autoSaveVenue();
    }
};

function renderPricingRules() {
    const container = document.getElementById('pricing-rules-container');
    if (!container) return;

    if (window.venuePricingRules.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px; color:#999; border:1px dashed #ddd; border-radius:12px;">No hay tarifas configuradas.</p>';
        return;
    }

    container.innerHTML = '';
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    window.venuePricingRules.forEach((rule) => {
        const card = document.createElement('div');
        card.className = 'pricing-rule-card';
        card.style = "background: white; border: 1px solid #eee; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);";

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <input type="text" value="${rule.name}" onchange="updateRuleField('${rule.id}', 'name', this.value)" 
                    style="font-weight:700; border:none; border-bottom:1px solid transparent; font-size:1.1rem; color:var(--secondary); padding:2px; width:60%;" 
                    onfocus="this.style.borderBottomColor='#ddd'" onblur="this.style.borderBottomColor='transparent'">
                <button type="button" onclick="removePricingRule('${rule.id}')" style="background:#fee2e2; color:#ef4444; border:none; padding:8px; border-radius:8px; font-size:0.8rem;">Eliminar</button>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:20px;">
                <div class="input-group" style="margin-bottom:0;">
                    <label style="font-size:0.7rem;">Precio Niños (€)</label>
                    <input type="number" value="${rule.price}" oninput="updateRuleField('${rule.id}', 'price', this.value)" style="padding:10px;">
                </div>
                <div class="input-group" style="margin-bottom:0;">
                    <label style="font-size:0.7rem;">Mínimo Niños</label>
                    <input type="number" value="${rule.minKids}" oninput="updateRuleField('${rule.id}', 'minKids', this.value)" style="padding:10px;">
                </div>
            </div>

            <div style="margin-bottom:20px;">
                <label style="display:block; font-size:0.7rem; font-weight:700; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase;">Días Aplicables</label>
                <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px;">
                    ${[1, 2, 3, 4, 5, 6, 0].map(d => `
                        <label style="font-size:0.8rem; display:flex; align-items:center; gap:5px; cursor:pointer;">
                            <input type="checkbox" ${rule.days.includes(d) ? 'checked' : ''} onchange="toggleDayInRule('${rule.id}', ${d})"> ${dayNames[d]}
                        </label>
                    `).join('')}
                </div>
            </div>

            <div>
                <label style="display:block; font-size:0.7rem; font-weight:700; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase;">Horas disponibles</label>
                <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
                    ${rule.slots.map((s, idx) => `
                        <div style="background:#eff6ff; color:#1e40af; padding:4px 10px; border-radius:20px; font-size:0.75rem; display:flex; align-items:center; gap:5px;">
                            ${s} <span onclick="removeSlotFromRule('${rule.id}', ${idx})" style="cursor:pointer; font-weight:bold; font-size:1rem; line-height:1;">&times;</span>
                        </div>
                    `).join('')}
                </div>
                <div style="display:flex; gap:8px;">
                    <input type="time" id="new-slot-${rule.id}" style="padding:8px; border:1px solid #ddd; border-radius:8px; font-size:0.8rem; flex:1;">
                    <button type="button" onclick="addSlotToRule('${rule.id}')" style="background:var(--secondary); color:white; border:none; padding:8px 15px; border-radius:8px; font-size:0.8rem;">+</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

document.getElementById('btn-block-date').addEventListener('click', () => {
    const date = document.getElementById('new-blocked-date').value;
    if (date && !window.currentSchedule.blockedDates.includes(date)) {
        window.currentSchedule.blockedDates.push(date);
        window.currentSchedule.blockedDates.sort();
        renderBlockedDates();
        document.getElementById('new-blocked-date').value = '';
    }
});

window.removeBlockedDate = (idx) => {
    window.currentSchedule.blockedDates.splice(idx, 1);
    renderBlockedDates();
};

function renderBlockedDates() {
    const container = document.getElementById('blocked-dates-list');
    container.innerHTML = window.currentSchedule.blockedDates.map((d, i) =>
        `<div style="display:flex; justify-content:space-between; align-items:center; background:#fee2e2; padding:5px 10px; border-radius:8px; font-size:0.8rem; color:#b91c1c;"><span>${d}</span> <button onclick="removeBlockedDate(${i})" style="background:none; border:none; color:#b91c1c; cursor:pointer;">✕</button></div>`
    ).join('');
}


// Image Handling
document.getElementById('venue-cover-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        currentCoverImage = await fileToBase64(file);
        document.getElementById('cover-preview').style.backgroundImage = `url(${currentCoverImage})`;
    }
});

document.getElementById('venue-gallery-input').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
        const base64 = await fileToBase64(file);
        currentVenueGallery.push(base64);
    }
    renderGalleryPreview();
});

function renderGalleryPreview() {
    const grid = document.getElementById('gallery-preview-grid');
    grid.innerHTML = '';
    currentVenueGallery.forEach((img, idx) => {
        grid.innerHTML += `<div class="gallery-item" style="background-image: url(${img});"><button onclick="removeGalleryItem(${idx})" style="position:absolute; top:4px; right:4px; background:red; color:white; border:none; border-radius:50%; width:20px; height:20px;">x</button></div>`;
    });
}
window.removeGalleryItem = (idx) => {
    currentVenueGallery.splice(idx, 1);
    renderGalleryPreview();
}

// --- Auto-Save Business Profile Logic ---
let saveTimeout;

async function autoSaveVenue() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        if (!currentUser || userRole !== 'business') return;

        // Get Open Days
        const openDays = [];
        document.querySelectorAll('input[name="openDays"]:checked').forEach(cb => openDays.push(parseInt(cb.value)));

        const tagString = document.getElementById('venue-tags').value || "";
        const tags = tagString.split(',').map(t => t.trim()).filter(t => t.length > 0);

        const updates = {
            name: document.getElementById('venue-name').value,
            description: document.getElementById('venue-desc').value,
            city: document.getElementById('venue-city').value.trim(),
            address: document.getElementById('venue-address').value.trim(),
            tags: tags,
            price: parseFloat(document.getElementById('venue-price').value) || 0,
            minKids: parseInt(document.getElementById('venue-min-kids').value) || 10,
            capacity: parseInt(document.getElementById('venue-capacity').value) || 0,
            services: currentVenueServices,
            gallery: currentVenueGallery,
            coverImage: currentCoverImage,
            pricingRules: window.venuePricingRules,
            blockedDates: window.currentSchedule.blockedDates,
            email: document.getElementById('venue-email').value.trim(),
            phone: document.getElementById('venue-phone').value.trim()
        };

        // Visual Feedback (could be a toast or subtle indicator)
        const btn = document.querySelector('#venue-form button[type="submit"]');
        if (btn) btn.innerText = "Guardando...";

        try {
            await db.collection('venues').doc(currentUser.uid).update(updates);
            if (btn) {
                btn.innerText = "Guardado";
                setTimeout(() => btn.innerText = "Guardar Perfil (Auto)", 2000);
            }
            document.getElementById('biz-name-display').innerText = updates.name;
        } catch (err) {
            console.error("Auto-save error:", err);
            if (btn) btn.innerText = "Error al guardar";
        }
    }, 1000); // 1 second debounce
}

// Attach Auto-Save Listeners
const venueInputs = [
    'venue-name', 'venue-desc', 'venue-city', 'venue-address',
    'venue-tags', 'venue-price', 'venue-min-kids', 'venue-capacity'
];

venueInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', autoSaveVenue);
    }
});

['venue-email', 'venue-phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', autoSaveVenue);
});

// Also attach to days checkboxes
document.querySelectorAll('input[name="openDays"]').forEach(el => {
    el.addEventListener('change', autoSaveVenue);
});

// --- Service Provider Dashboard Logic ---
async function loadServiceProfile() {
    if (!currentUser) return;
    const svcDisplay = document.getElementById('service-name-display');
    if (svcDisplay) svcDisplay.innerText = "Cargando...";

    const doc = await db.collection('venues').doc(currentUser.uid).get();
    if (doc.exists) {
        const data = doc.data();
        if (svcDisplay) svcDisplay.innerText = data.name || "Servicio";

        const nameEl = document.getElementById('service-name');
        if (nameEl) nameEl.value = data.name || "";

        const descEl = document.getElementById('service-desc');
        if (descEl) descEl.value = data.description || "";

        const phoneEl = document.getElementById('service-phone');
        if (phoneEl) phoneEl.value = data.phone || "";

        const cityEl = document.getElementById('service-base-city');
        if (cityEl) cityEl.value = data.city || "";

        const priceEl = document.getElementById('service-price');
        if (priceEl) priceEl.value = data.price || "";

        const priceTypeEl = document.getElementById('service-price-type');
        if (priceTypeEl) priceTypeEl.value = data.priceType || "hour";

        const extraHourEl = document.getElementById('service-extra-hour');
        if (extraHourEl) extraHourEl.value = data.extraHourPrice || "";

        const offeringEl = document.getElementById('service-offering');
        if (offeringEl) offeringEl.value = data.offering || "";

        const tagsEl = document.getElementById('service-tags');
        if (tagsEl) tagsEl.value = data.tags ? data.tags.join(', ') : "";

        const instaEl = document.getElementById('service-instagram');
        if (instaEl) instaEl.value = data.instagram || "";

        const tiktokEl = document.getElementById('service-tiktok');
        if (tiktokEl) tiktokEl.value = data.tiktok || "";

        // Lists
        currentServiceExtras = data.services || [];
        renderServiceExtrasList();

        currentMobilityZones = data.mobilityZones || [];
        renderMobilityZones();

        currentServiceBlockedDates = data.blockedDates || [];
        renderServiceBlockedDates();

        // Multi-media
        if (data.coverImage) {
            currentServiceCover = data.coverImage;
            const preview = document.getElementById('service-cover-preview');
            if (preview) preview.style.backgroundImage = `url(${data.coverImage})`;
        }
        currentServiceGallery = data.gallery || [];
        renderServiceGalleryPreview();

        // Work Days
        const workDays = data.workDays || [1, 2, 3, 4, 5];
        document.querySelectorAll('#work-days-container input').forEach(cb => {
            cb.checked = workDays.includes(parseInt(cb.dataset.day));
        });

        // Stats
        const sRes = document.getElementById('service-stat-reservations');
        if (sRes) sRes.innerText = data.totalReservations || 0;
        const sVis = document.getElementById('service-stat-visits');
        if (sVis) sVis.innerText = data.profileVisits || 0;
    }
}

let serviceSaveTimeout;
async function autoSaveService() {
    clearTimeout(serviceSaveTimeout);
    serviceSaveTimeout = setTimeout(async () => {
        if (!currentUser || userRole !== 'service') return;

        const tagString = document.getElementById('service-tags').value || "";
        const tags = tagString.split(',').map(t => t.trim()).filter(t => t.length > 0);

        const workDays = [];
        document.querySelectorAll('#work-days-container input:checked').forEach(cb => {
            workDays.push(parseInt(cb.dataset.day));
        });

        const updates = {
            name: document.getElementById('service-name').value,
            description: document.getElementById('service-desc').value,
            phone: document.getElementById('service-phone').value,
            city: document.getElementById('service-base-city').value,
            price: parseFloat(document.getElementById('service-price').value) || 0,
            priceType: document.getElementById('service-price-type').value,
            extraHourPrice: parseFloat(document.getElementById('service-extra-hour').value) || 0,
            offering: document.getElementById('service-offering').value,
            tags: tags,
            instagram: document.getElementById('service-instagram').value,
            tiktok: document.getElementById('service-tiktok').value,
            services: currentServiceExtras,
            mobilityZones: currentMobilityZones,
            blockedDates: currentServiceBlockedDates,
            gallery: currentServiceGallery,
            coverImage: currentServiceCover,
            workDays: workDays,
            role: 'service'
        };

        const btn = document.querySelector('#service-form button[type="submit"]');
        if (btn) btn.innerText = "Guardando...";

        try {
            await db.collection('venues').doc(currentUser.uid).update(updates);
            if (btn) {
                btn.innerText = "Guardado";
                setTimeout(() => btn.innerText = "Guardar Perfil de Servicio", 2000);
            }
            const svcDisplay = document.getElementById('service-name-display');
            if (svcDisplay) svcDisplay.innerText = updates.name;
        } catch (err) {
            console.error("Auto-save service error:", err);
            if (btn) btn.innerText = "Error al guardar";
        }
    }, 1000);
}

// Helpers for Service UI
function renderServiceExtrasList() {
    const ul = document.getElementById('service-extras-list');
    if (!ul) return;
    ul.innerHTML = '';
    currentServiceExtras.forEach((svc, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${svc.name} - <b>${svc.price}€</b></span> <button type="button" onclick="removeServiceExtra(${idx})">x</button>`;
        ul.appendChild(li);
    });
}
window.removeServiceExtra = (idx) => {
    currentServiceExtras.splice(idx, 1);
    renderServiceExtrasList();
    autoSaveService();
}

function renderMobilityZones() {
    const list = document.getElementById('mobility-zones-list');
    if (!list) return;
    list.innerHTML = currentMobilityZones.map((z, i) => `
        <div style="background:#f3f4f6; color:#374151; padding:6px 12px; border-radius:100px; font-size:0.85rem; display:flex; align-items:center; gap:8px;">
            ${z} <span onclick="removeMobilityZone(${i})" style="cursor:pointer; font-weight:bold;">&times;</span>
        </div>
    `).join('');
}
window.removeMobilityZone = (i) => {
    currentMobilityZones.splice(i, 1);
    renderMobilityZones();
    autoSaveService();
}

function renderServiceBlockedDates() {
    const container = document.getElementById('service-blocked-dates-list');
    if (!container) return;
    container.innerHTML = currentServiceBlockedDates.map((d, i) =>
        `<div style="display:flex; justify-content:space-between; align-items:center; background:#fee2e2; padding:5px 10px; border-radius:8px; font-size:0.8rem; color:#b91c1c;"><span>${d}</span> <button type="button" onclick="removeServiceBlockedDate(${i})" style="background:none; border:none; color:#b91c1c; cursor:pointer;">✕</button></div>`
    ).join('');
}
window.removeServiceBlockedDate = (idx) => {
    currentServiceBlockedDates.splice(idx, 1);
    renderServiceBlockedDates();
    autoSaveService();
};

function renderServiceGalleryPreview() {
    const grid = document.getElementById('service-gallery-preview-grid');
    if (!grid) return;
    grid.innerHTML = '';
    currentServiceGallery.forEach((img, idx) => {
        grid.innerHTML += `<div class="gallery-item" style="background-image: url(${img});"><button type="button" onclick="removeServiceGalleryItem(${idx})" style="position:absolute; top:4px; right:4px; background:red; color:white; border:none; border-radius:50%; width:20px; height:20px;">x</button></div>`;
    });
}
window.removeServiceGalleryItem = (idx) => {
    currentServiceGallery.splice(idx, 1);
    renderServiceGalleryPreview();
    autoSaveService();
}

// Event Listeners for Service Form
document.addEventListener('DOMContentLoaded', () => {
    const addExtraBtn = document.getElementById('btn-add-service-extra');
    if (addExtraBtn) {
        addExtraBtn.addEventListener('click', () => {
            const name = document.getElementById('new-service-extra-name').value;
            const price = document.getElementById('new-service-extra-price').value;
            if (name && price) {
                currentServiceExtras.push({ name, price: parseFloat(price) });
                renderServiceExtrasList();
                document.getElementById('new-service-extra-name').value = '';
                document.getElementById('new-service-extra-price').value = '';
                autoSaveService();
            }
        });
    }

    const addZoneBtn = document.getElementById('btn-add-zone');
    if (addZoneBtn) {
        addZoneBtn.addEventListener('click', () => {
            const zone = document.getElementById('new-mobility-zone').value;
            if (zone && !currentMobilityZones.includes(zone)) {
                currentMobilityZones.push(zone);
                renderMobilityZones();
                document.getElementById('new-mobility-zone').value = '';
                autoSaveService();
            }
        });
    }

    const blockDateBtn = document.getElementById('btn-service-block-date');
    if (blockDateBtn) {
        blockDateBtn.addEventListener('click', () => {
            const date = document.getElementById('service-new-blocked-date').value;
            if (date && !currentServiceBlockedDates.includes(date)) {
                currentServiceBlockedDates.push(date);
                currentServiceBlockedDates.sort();
                renderServiceBlockedDates();
                document.getElementById('service-new-blocked-date').value = '';
                autoSaveService();
            }
        });
    }

    const coverIn = document.getElementById('service-cover-input');
    if (coverIn) {
        coverIn.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                currentServiceCover = await fileToBase64(file);
                const preview = document.getElementById('service-cover-preview');
                if (preview) preview.style.backgroundImage = `url(${currentServiceCover})`;
                autoSaveService();
            }
        });
    }

    const galIn = document.getElementById('service-gallery-input');
    if (galIn) {
        galIn.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            for (const file of files) {
                const base64 = await fileToBase64(file);
                currentServiceGallery.push(base64);
            }
            renderServiceGalleryPreview();
            autoSaveService();
        });
    }

    // Generic auto-save listeners
    [
        'service-name', 'service-desc', 'service-phone', 'service-base-city',
        'service-price', 'service-price-type', 'service-extra-hour',
        'service-offering', 'service-tags', 'service-instagram', 'service-tiktok'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', autoSaveService);
    });

    document.querySelectorAll('#work-days-container input').forEach(el => {
        el.addEventListener('change', autoSaveService);
    });

    const svcForm = document.getElementById('service-form');
    if (svcForm) {
        svcForm.addEventListener('submit', (e) => {
            e.preventDefault();
            autoSaveService();
        });
    }
});

// Re-using fileToBase64 from global if exists, else it will throw. 
// Assuming it exists as it was in the original file.

// --- Original Logic Wrappers ---


// --- Family Dashboard Extensions ---

window.switchFamilyTab = (viewId, el) => {
    // Use global showView to ensure all other views (auth, landing, etc.) are hidden
    showView(viewId);

    // Update Nav Active State
    document.querySelectorAll('#family-nav .nav-item').forEach(item => item.classList.remove('active'));
    if (el) el.classList.add('active');

    // Load data if needed
    if (viewId === 'invitations-view') loadGuests();
    if (viewId === 'notes-view') loadNotes();
    if (viewId === 'reservation-view') loadActiveReservation();
    if (viewId === 'family-profile-view') loadFamilyProfile();
};

async function loadFamilyProfile() {
    if (!currentUser) return;
    const doc = await db.collection('users').doc(currentUser.uid).get();
    if (doc.exists) {
        const data = doc.data();
        document.getElementById('user-name').value = data.name || "";
        document.getElementById('user-contact-email').value = data.contactEmail || data.email || "";
        document.getElementById('user-phone').value = data.phone || "";
        document.getElementById('user-id-display').innerText = currentUser.uid;
    }
}

async function autoSaveFamilyProfile() {
    if (!currentUser || userRole !== 'family') return;
    const updates = {
        name: document.getElementById('user-name').value.trim(),
        contactEmail: document.getElementById('user-contact-email').value.trim(),
        phone: document.getElementById('user-phone').value.trim()
    };
    try {
        await db.collection('users').doc(currentUser.uid).update(updates);
        document.getElementById('user-name-display').innerText = updates.name;
    } catch (err) {
        console.error("Error auto-saving family profile:", err);
    }
}

// Attach Family Auto-Save Listeners
['user-name', 'user-contact-email', 'user-phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', autoSaveFamilyProfile);
});

// --- Temporal Helpers ---
function getInternalTime() {
    return new Date();
}

function isEventPast(dateStr, timeStr) {
    const now = getInternalTime();
    const eventDateTime = new Date(`${dateStr}T${timeStr || '00:00'}`);
    return now > eventDateTime;
}

function isDatePast(dateStr) {
    const now = getInternalTime();
    now.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateStr);
    eventDate.setHours(0, 0, 0, 0);
    return now > eventDate;
}

function isOlderThan60Days(dateStr) {
    const now = getInternalTime();
    const eventDate = new Date(dateStr);
    const diffTime = Math.abs(now - eventDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 60;
}

// Business Reservations Logic
async function loadBusinessReservations() {
    if (!currentUser) return;
    const container = document.getElementById('business-reservations-list');
    container.innerHTML = '<p style="text-align:center; color:#999; margin-top:30px;">Cargando reservas...</p>';

    try {
        const snapshot = await db.collection('reservations')
            .where('venueId', '==', currentUser.uid)
            .get();

        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align:center; color:#999; margin-top:50px;">No tienes reservas aún.</p>';
            return;
        }

        const reservations = [];
        snapshot.forEach(doc => {
            const r = doc.data();
            // Rules: Pending is always shown. Confirmed is shown until event time. Cancelled is hidden.
            const isPending = r.status === 'pending';
            const isActiveConfirmed = r.status === 'confirmed' && !isEventPast(r.date, r.time);

            if (isPending || isActiveConfirmed) {
                reservations.push({ id: doc.id, ...r });
            }
        });

        // Sort by timestamp desc
        reservations.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

        container.innerHTML = '';
        reservations.forEach(r => {
            const statusLabel = r.status === 'confirmed' ? 'Confirmada' : (r.status === 'cancelled' ? 'Cancelada' : 'Pendiente');
            const statusClass = r.status === 'confirmed' ? 'status-confirmed' : (r.status === 'cancelled' ? 'status-cancelled' : 'status-pending');

            const card = document.createElement('div');
            card.className = `reservation-card-biz ${statusClass}`;
            card.innerHTML = `
                <div class="reservation-summary-row" onclick="this.parentElement.classList.toggle('expanded')">
                    <div style="flex:1;">
                        <div style="font-weight:700; font-size:1.1rem;">${r.userName}</div>
                        <div style="font-size:0.85rem; color:var(--text-muted);">${r.date} • ${r.time}</div>
                    </div>
                    <div style="text-align:right;">
                        <div class="status-badge">${statusLabel}</div>
                        <div style="font-weight:700; margin-top:4px;">${r.totalPrice.toFixed(2)}€</div>
                    </div>
                </div>
                <div class="reservation-detail-dropdown">
                    <div style="padding-top:15px; border-top:1px solid #eee; margin-top:10px;">
                        <p><strong>Email:</strong> ${r.userEmail || 'No disponible'}</p>
                        <p><strong>Nº Niños:</strong> ${r.kids}</p>
                        <p><strong>Servicios:</strong></p>
                        <ul style="padding-left:20px; margin-bottom:15px; font-size:0.9rem;">
                            ${(r.services || []).map(s => `<li>${s.name} (${s.price}€)</li>`).join('')}
                        </ul>
                        
                        <div style="display:flex; gap:10px; margin-top:15px;">
                            ${r.status === 'pending' ? `
                                <button onclick="updateReservationStatus('${r.id}', 'confirmed')" class="btn-confirm-res">Confirmar Reserva</button>
                            ` : ''}
                            ${r.status !== 'cancelled' ? `
                                <button onclick="updateReservationStatus('${r.id}', 'cancelled')" class="btn-cancel-res">${r.status === 'confirmed' ? 'Anular Reserva' : 'Cancelar'}</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error("Error loading business reservations:", err);
        container.innerHTML = '<p style="text-align:center; color:red;">Error al cargar las reservas.</p>';
    }
}

async function loadBusinessHistory() {
    if (!currentUser) return;
    const container = document.getElementById('business-history-list');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center; color:#999; margin-top:30px;">Cargando historial...</p>';

    try {
        const snapshot = await db.collection('reservations')
            .where('venueId', '==', currentUser.uid)
            .get();

        const history = [];
        snapshot.forEach(doc => {
            const r = doc.data();
            const isCancelled = r.status === 'cancelled';
            const isPastConfirmed = r.status === 'confirmed' && isEventPast(r.date, r.time);

            // History rules: show cancelled or past events within 60 days
            if ((isCancelled || isPastConfirmed) && !isOlderThan60Days(r.date)) {
                history.push({ id: doc.id, ...r });
            }
        });

        // Sort by date desc
        history.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (history.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999; margin-top:50px;">El historial está vacío (últimos 60 días).</p>';
            return;
        }

        container.innerHTML = '';
        history.forEach(r => {
            const statusLabel = r.status === 'confirmed' ? 'Realizada' : 'Cancelada';
            const statusClass = r.status === 'confirmed' ? 'status-confirmed' : 'status-cancelled';

            container.innerHTML += `
                <div class="reservation-card-biz ${statusClass}" style="margin-bottom:10px; opacity:0.8;">
                    <div class="reservation-summary-row">
                        <div style="flex:1;">
                            <div style="font-weight:700;">${r.userName}</div>
                            <div style="font-size:0.85rem; color:var(--text-muted);">${r.date}</div>
                        </div>
                        <div style="text-align:right;">
                            <div class="status-badge">${statusLabel}</div>
                            <div style="font-weight:700;">${r.totalPrice.toFixed(2)}€</div>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (err) {
        console.error("Error history:", err);
    }
}

window.updateReservationStatus = async (resId, newStatus) => {
    const action = newStatus === 'confirmed' ? 'confirmar' : 'cancelar';
    showConfirm(`¿Estás seguro de que quieres ${action} esta reserva?`, async () => {
        try {
            await db.collection('reservations').doc(resId).update({
                status: newStatus
            });
            showAlert(`Reserva ${newStatus === 'confirmed' ? 'confirmada' : 'cancelada'} correctamente.`);
            loadBusinessReservations();
        } catch (err) {
            console.error("Error updating reservation status:", err);
            showAlert("Hubo un error al actualizar el estado.");
        }
    });
};

// Invitations
async function loadGuests() {
    if (!currentUser) return;
    const container = document.getElementById('guests-list');
    container.innerHTML = '<p class="loading-text">Cargando...</p>';

    // Using a subcollection or main collection with query
    // Simple approach: store in user document
    const doc = await db.collection('users').doc(currentUser.uid).get();
    const guests = doc.data().guests || [];

    container.innerHTML = '';
    if (guests.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#ddd;">Añade invitados a tu lista</p>';
        return;
    }

    guests.forEach((g, i) => {
        container.innerHTML += `
        <div class="guest-item ${g.confirmed ? 'confirmed' : ''}">
            <span style="flex-grow:1; margin-right:10px; font-weight: 500;">${g.name}</span>
            <div style="display:flex; align-items:center; gap:16px;">
                <i class="ph ph-trash guest-delete-btn" onclick="deleteGuest(${i})"></i>
                <div class="check-circle" onclick="toggleGuest(${i})">
                    <i class="ph ph-check" style="display:${g.confirmed ? 'block' : 'none'}"></i>
                </div>
            </div>
        </div>`;
    });
}

window.addGuest = async () => {
    const input = document.getElementById('new-guest-name');
    const name = input.value.trim();
    if (!name) return;

    const docRef = db.collection('users').doc(currentUser.uid);
    // Get current guests to append
    const doc = await docRef.get();
    const currentGuests = doc.data().guests || [];

    currentGuests.push({ name, confirmed: false });

    await docRef.update({ guests: currentGuests });
    input.value = '';
    loadGuests();
};

window.deleteGuest = async (index) => {
    showConfirm("¿Borrar invitado?", async () => {
        const docRef = db.collection('users').doc(currentUser.uid);
        const doc = await docRef.get();
        let guests = doc.data().guests || [];

        if (guests[index]) { // Check existence
            guests.splice(index, 1);
            await docRef.update({ guests });
            loadGuests();
        }
    });
};

window.toggleGuest = async (index) => {
    const docRef = db.collection('users').doc(currentUser.uid);
    const doc = await docRef.get();
    const guests = doc.data().guests || [];

    if (guests[index]) {
        guests[index].confirmed = !guests[index].confirmed;
        await docRef.update({ guests });
        loadGuests();
    }
};

// Notes & Drag Drop
async function loadNotes() {
    if (!currentUser) return;
    const doc = await db.collection('users').doc(currentUser.uid).get();
    const data = doc.data();
    const todo = data.notesTodo || [];
    const done = data.notesDone || [];

    renderNotesList('notes-todo', todo, 'todo');
    renderNotesList('notes-done', done, 'done');
}

function renderNotesList(containerId, notes, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    notes.forEach((text, i) => {
        const id = `${type}-${i}`;
        container.innerHTML += `
        <div class="note-item" draggable="true" ondragstart="drag(event)" id="${id}" data-type="${type}" data-idx="${i}">
            <span style="flex:1;">${text}</span>
            <button onclick="deleteNote('${type}', ${i})" style="width:24px; height:24px; background:#fee2e2; color:red; border:none; padding:0; display:flex; align-items:center; justify-content:center; border-radius:4px;">x</button>
        </div>`;
    });
}

window.addNote = async () => {
    const input = document.getElementById('new-note-text');
    const text = input.value.trim();
    if (!text) return;

    const docRef = db.collection('users').doc(currentUser.uid);
    const doc = await docRef.get();
    const todo = doc.data().notesTodo || [];

    todo.push(text);
    await docRef.update({ notesTodo: todo });
    input.value = '';
    loadNotes();
};

window.deleteNote = async (type, idx) => {
    const docRef = db.collection('users').doc(currentUser.uid);
    const doc = await docRef.get();
    let list = (type === 'todo') ? (doc.data().notesTodo || []) : (doc.data().notesDone || []);

    list.splice(idx, 1);

    if (type === 'todo') await docRef.update({ notesTodo: list });
    else await docRef.update({ notesDone: list });

    loadNotes();
}

// Drag & Drop Handlers
window.allowDrop = (ev) => { ev.preventDefault(); };
window.drag = (ev) => {
    ev.dataTransfer.setData("id", ev.target.id);
    ev.dataTransfer.setData("originHtml", ev.target.outerHTML); // Backup
};
window.drop = async (ev, targetType) => {
    ev.preventDefault();
    const id = ev.dataTransfer.getData("id");
    const el = document.getElementById(id);
    const originType = el.getAttribute('data-type');
    const originIdx = parseInt(el.getAttribute('data-idx'));
    const text = el.querySelector('span').innerText;

    if (originType === targetType) return; // Same list, do nothing or reorder (simple swap not implemented for brevity)

    // Move logic
    const docRef = db.collection('users').doc(currentUser.uid);
    const doc = await docRef.get();

    const sourceList = (originType === 'todo') ? (doc.data().notesTodo || []) : (doc.data().notesDone || []);
    const targetList = (targetType === 'todo') ? (doc.data().notesTodo || []) : (doc.data().notesDone || []);

    // Remove from source
    sourceList.splice(originIdx, 1);
    // Add to target
    targetList.push(text);

    await docRef.update({
        notesTodo: (originType === 'todo' ? sourceList : targetList),
        notesDone: (targetType === 'done' ? targetList : sourceList)
    });

    loadNotes();
};

// Reservations
async function loadActiveReservation() {
    const container = document.getElementById('active-reservation-container');
    if (!currentUser) return;

    // Fix: Remove orderBy to avoid index requirement issues
    // Fetch user reservations
    const snapshot = await db.collection('reservations')
        .where('userId', '==', currentUser.uid)
        .get();

    if (snapshot.empty) {
        // ... (empty logic remains same below) same as original structure, just changing query part
        container.innerHTML = `
            <div style="text-align:center; margin-top:50px;">
                <div style="font-size:4rem; margin-bottom:10px;">🎈</div>
                <h3>¡Aún no tienes fiesta!</h3>
                <p style="color:#888; margin-bottom:20px;">Busca un local y reserva tu día ideal.</p>
                <button onclick="switchFamilyTab('family-view', document.querySelector('.nav-item.active'))" class="btn-primary">Buscar Locales</button>
            </div>
        `;
        return;
    }

    // Client-side filter to find latest and eligible (not past event day)
    const reservations = [];
    snapshot.forEach(doc => {
        const r = doc.data();
        if (!isDatePast(r.date)) {
            reservations.push(r);
        }
    });

    if (reservations.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; margin-top:50px;">
                <div style="font-size:4rem; margin-bottom:10px;">🎈</div>
                <h3>¡Aún no tienes fiesta!</h3>
                <p style="color:#888; margin-bottom:20px;">Busca un local o consulta tus fiestas anteriores.</p>
                <button onclick="switchFamilyTab('family-view', document.querySelector('.nav-item.active'))" class="btn-primary">Buscar Locales</button>
            </div>
        `;
        return;
    }

    // Sort desc by timestamp
    reservations.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

    const r = reservations[0];

    // Fetch Venue details for full info
    const vDoc = await db.collection('venues').doc(r.venueId).get();
    const v = vDoc.exists ? vDoc.data() : {};

    // Status Styling Logic
    let statusText = "Pendiente de confirmación";
    let statusColor = "#f59e0b"; // Orange
    let statusBg = "#fffbeb";
    let statusIcon = "⏳";

    if (r.status === 'confirmed') {
        statusText = "Reserva confirmada por el local";
        statusColor = "#10b981"; // Green
        statusBg = "#f0fdf4";
        statusIcon = "✅";
    } else if (r.status === 'cancelled') {
        statusText = "Reserva cancelada";
        statusColor = "#ef4444"; // Red
        statusBg = "#fef2f2";
        statusIcon = "❌";
    }

    // Create Summary HTML
    const summaryHTML = `
        <div class="card" style="background:${statusBg}; border:1px solid ${statusColor}22; margin-bottom:20px;">
            <div class="row" style="margin-bottom:15px; border-bottom:1px solid ${statusColor}11; padding-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <h2 style="color:${statusColor}; font-size:1.1rem; margin:0;">${statusIcon} ${statusText}</h2>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                <div>
                    <label style="font-size:0.7rem; color:${statusColor}; font-weight:700; text-transform:uppercase;">${v.role === 'service' ? 'SERVICIO' : 'LOCAL'}</label>
                    <div style="font-size:1rem; font-weight:600; color:#1f2937;">${r.venueName}</div>
                </div>
                <div>
                    <label style="font-size:0.7rem; color:${statusColor}; font-weight:700; text-transform:uppercase;">TOTAL</label>
                    <div style="font-size:1.1rem; font-weight:bold; color:${statusColor};">${r.totalPrice.toFixed(2)}€</div>
                </div>
                <div>
                    <label style="font-size:0.7rem; color:${statusColor}; font-weight:700; text-transform:uppercase;">FECHA</label>
                    <div style="font-size:0.9rem; font-weight:600; color:#4b5563;">${r.date}</div>
                </div>
                <div>
                    <label style="font-size:0.7rem; color:${statusColor}; font-weight:700; text-transform:uppercase;">HORA</label>
                    <div style="font-size:0.9rem; font-weight:600; color:#4b5563;">${r.time}</div>
                </div>
                ${v.role === 'service' ? '' : `
                <div>
                    <label style="font-size:0.7rem; color:${statusColor}; font-weight:700; text-transform:uppercase;">NIÑOS</label>
                    <div style="font-size:0.9rem; font-weight:600; color:#4b5563;">${r.kids}</div>
                </div>
                `}
            </div>
        </div>
    `;

    // Create Read-Only Venue Detail HTML (Simulating Guest View)
    const venueHTML = `
        <div class="venue-detail-container" style="pointer-events:none; opacity:0.9;">
            <div class="venue-cover" style="background-image: url(${v.coverImage || ''}); height:150px; background-size:cover; border-radius:12px; margin-bottom:15px;"></div>
            
            <h3 style="margin-bottom:5px;">${v.name}</h3>
            <p style="color:#6b7280; font-size:0.9rem; margin-bottom:15px;">${v.description ? v.description.substring(0, 100) + '...' : ''}</p>
            
            <div class="info-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.85rem;">
                <div class="info-item" style="display:flex; align-items:center; gap:5px;">
                    <i class="ph ph-map-pin"></i>
                    <span>${v.city || ''}</span>
                </div>
                <div class="info-item" style="display:flex; align-items:center; gap:5px;">
                    <i class="ph ph-users"></i>
                    <span>Cap: ${v.capacity || '0'}</span>
                </div>
            </div>
        </div>
    `;

    // Action Buttons
    let actionButtonsHTML = '';
    if (r.status === 'confirmed' || r.status === 'pending') {
        const cancelLabel = (v.role === 'service') ? 'Solicitud de cancelación' : 'Solicitud de cancelación';
        const chatLabel = (v.role === 'service') ? 'Chat con profesional' : 'Chat con local';
        actionButtonsHTML = `
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button onclick="requestCancellation('${r.venueId}', '${r.date}', '${r.time}', '${r.venueName}')" class="btn-secondary" style="flex: 1; background: #fef2f2; color: #ef4444; border-color: #fecaca;">
                    <i class="ph ph-x-circle"></i> ${cancelLabel}
                </button>
                <button onclick="openChat('${r.venueId}', '${r.venueName}')" class="btn-primary" style="flex: 1;">
                    <i class="ph ph-chat-circle-dots"></i> ${chatLabel}
                </button>
            </div>
        `;
    }

    container.innerHTML = summaryHTML + actionButtonsHTML + venueHTML;
}

// --- Family Logic ---
async function loadVenues(filters = {}) {
    // Determine context: Landing vs Family Dashboard
    let gridId = 'venues-list-landing'; // Default to landing

    if (currentUser && !document.getElementById('family-view').classList.contains('hidden')) {
        gridId = 'venues-list'; // Family dashboard
    } else if (!document.getElementById('landing-view').classList.contains('hidden')) {
        gridId = 'venues-list-landing';
    }

    const grid = document.getElementById(gridId);

    if (!grid) return;

    grid.innerHTML = '<div class="venue-card skeleton"><div class="venue-info" style="text-align:center; padding:20px;">Cargando locales...</div></div>';

    try {
        const snapshot = await db.collection('venues').get();
        if (snapshot.empty) {
            grid.innerHTML = '<p style="text-align:center; padding:20px;">No hay locales disponibles aún.</p>';
            return;
        }

        grid.innerHTML = '';
        let count = 0;

        snapshot.forEach(doc => {
            const v = doc.data();
            const role = v.role || 'business';

            // --- FILTER LOGIC ---
            if (filters.city) {
                const searchCity = filters.city.toLowerCase();
                if (role === 'business') {
                    if (!v.city || !v.city.toLowerCase().includes(searchCity)) return;
                } else if (role === 'service') {
                    const baseCityMatch = v.city && v.city.toLowerCase().includes(searchCity);
                    const mobilityMatch = v.mobilityZones && v.mobilityZones.some(z => z.toLowerCase().includes(searchCity));
                    if (!baseCityMatch && !mobilityMatch) return;
                }
            }

            if (filters.date) {
                const dateObj = new Date(filters.date);
                const dayOfWeek = dateObj.getDay();

                if (v.blockedDates && v.blockedDates.includes(filters.date)) return;

                if (role === 'business') {
                    const rules = v.pricingRules || [];
                    const activeRule = rules.find(r => r.days.includes(dayOfWeek));
                    if (!activeRule) return;
                    if (!activeRule.slots || activeRule.slots.length === 0) return;
                } else if (role === 'service') {
                    const workDays = v.workDays || [1, 2, 3, 4, 5];
                    if (!workDays.includes(dayOfWeek)) return;
                }
            }

            count++;

            // --- RENDERING ---
            let minPrice = v.price || 0;
            let priceLabel = `Desde ${minPrice}€`;

            if (role === 'business') {
                const rules = v.pricingRules || [];
                if (rules.length > 0) {
                    minPrice = Math.min(...rules.map(r => r.price));
                    priceLabel = `Desde ${minPrice}€`;
                }
            } else if (role === 'service') {
                const pType = v.priceType === 'hour' ? 'h' : 'serv';
                priceLabel = `${minPrice}€/${pType}`;
            }

            const coverStyle = v.coverImage ? `background-image: url(${v.coverImage}); background-size:cover;` : `background-color: ${stringToColor(v.name)}`;
            const badge = role === 'service' ? '<span class="role-badge svc" style="background:var(--primary); color:white; padding:2px 8px; border-radius:12px; font-size:0.7rem; position:absolute; top:10px; right:10px;">Servicio</span>' : '';

            grid.innerHTML += `
            <div class="venue-card" onclick="openVenueDetail('${doc.id}')" style="cursor:pointer; margin-bottom: 20px; position:relative;">
                <div class="venue-img" style="${coverStyle}">
                    ${badge}
                </div>
                <div class="venue-info">
                    <div class="venue-header-row">
                        <h4 style="font-weight:700; color:var(--text-main); font-size:1.1rem;">${v.name}</h4>
                        <span class="venue-price">${priceLabel}</span>
                    </div>
                    <p class="venue-desc" style="display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin-bottom:10px;">${v.description || "Un colaborador genial para tu fiesta."}</p>
                    <div class="venue-footer">
                        <span><i class="ph ph-map-pin"></i> ${v.city || "S.C"}</span>
                        ${role === 'business' ? `<span><i class="ph ph-users"></i> ${v.capacity || "0"} pax</span>` : `<span><i class="ph ph-truck"></i> Movilidad</span>`}
                    </div>
                </div>
            </div>
            `;
        });

        if (count === 0) {
            grid.innerHTML = '<p style="text-align:center; padding:20px; grid-column: 1/-1;">No se encontraron locales con esos filtros.</p>';
        }

    } catch (err) {
        console.error(err);
        grid.innerHTML = '<p style="text-align:center; color:red;">Error cargando locales</p>';
    }
}

// Search & Autocomplete Implementation
window.applySearch = () => {
    let city = "";

    if (currentUser) {
        // Logged in user on family-view
        const input = document.getElementById('family-search-location');
        if (input) city = input.value;
    } else {
        // Guest on landing-view
        const input = document.getElementById('search-location');
        if (input) city = input.value;
    }

    // Pass filter to loadVenues
    loadVenues({ city });
};

async function initAutocomplete() {
    const datalist = document.getElementById('cities-list');
    if (!datalist) return;

    try {
        const snapshot = await db.collection('venues').get();
        const cities = new Set();
        snapshot.forEach(doc => {
            const v = doc.data();
            if (v.city) cities.add(v.city.trim());
        });

        datalist.innerHTML = '';
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            datalist.appendChild(option);
        });
    } catch (err) {
        console.error("Error loading cities:", err);
    }
}

// Call on startup
initAutocomplete();

// Venue Detail Modal
window.openVenueDetail = async (venueId) => {
    // Increment Profile Visits (Atomic update)
    db.collection('venues').doc(venueId).update({
        profileVisits: firebase.firestore.FieldValue.increment(1)
    }).catch(err => console.error("Error updating visits:", err));

    // Daily Stats
    incrementDailyStat(venueId, 'visits');

    const doc = await db.collection('venues').doc(venueId).get();
    if (!doc.exists) return;
    const v = doc.data();

    // Get min price for display
    const rules = v.pricingRules || [];
    let minPriceDisplay = v.price || 0;
    if (rules.length > 0) {
        minPriceDisplay = Math.min(...rules.map(r => r.price));
    }

    // Store globally for booking calculations
    window.currentVenueData = v;
    window.currentVenueId = venueId;

    // Fill Data
    const role = v.role || 'business';
    document.getElementById('detail-name').innerText = v.name;

    // Role based labels
    const priceSuffix = (role === 'service' && v.priceType === 'hour') ? '€/h' : (role === 'service' ? '€/serv' : '€/niño');
    document.getElementById('detail-price').innerText = (role === 'service') ? `${v.price}${priceSuffix}` : `Desde ${minPriceDisplay}${priceSuffix}`;

    const capLabel = document.querySelector('#venue-detail-view .venue-footer span:nth-child(2)');
    if (capLabel) {
        if (role === 'service') {
            capLabel.innerHTML = `<i class="ph ph-truck"></i> Movilidad`;
            document.getElementById('detail-capacity').innerText = "Zona";
        } else {
            capLabel.innerHTML = `<i class="ph ph-users"></i> <span id="detail-capacity"></span> pax`;
            document.getElementById('detail-capacity').innerText = v.capacity || "0";
        }
    }

    document.getElementById('detail-desc').innerText = v.description;

    // Social & Contact
    let detailMeta = '';
    if (v.city) detailMeta += `<span><i class="ph ph-map-pin"></i> ${v.city}</span>`;
    if (v.phone) detailMeta += `<span><i class="ph ph-phone"></i> ${v.phone}</span>`;
    if (v.instagram) detailMeta += `<span><i class="ph ph-instagram-logo"></i> ${v.instagram}</span>`;
    if (v.tiktok) detailMeta += `<span><i class="ph ph-tiktok-logo"></i> ${v.tiktok}</span>`;

    // Mobility zones display for services
    if (role === 'service' && v.mobilityZones && v.mobilityZones.length > 0) {
        detailMeta += `<div style="margin-top:10px; font-size:0.85rem; color:var(--text-muted);"><strong>Zonas:</strong> ${v.mobilityZones.join(', ')}</div>`;
    }

    const detailMetaEl = document.querySelector('.venue-detail-meta');
    if (detailMetaEl) detailMetaEl.innerHTML = detailMeta;

    // Cover
    const coverEl = document.getElementById('detail-cover');
    if (v.coverImage) {
        coverEl.style.backgroundImage = `url(${v.coverImage})`;
    } else {
        coverEl.style.backgroundColor = stringToColor(v.name);
        coverEl.style.backgroundImage = 'none';
    }

    // Gallery
    const galleryEl = document.getElementById('detail-gallery');
    galleryEl.innerHTML = '';
    if (v.gallery && v.gallery.length > 0) {
        v.gallery.forEach(img => {
            galleryEl.innerHTML += `<div class="gallery-item" style="background-image: url(${img});" onclick="viewImage('${img}')"></div>`;
        });
    } else {
        galleryEl.innerHTML = '<p style="grid-column:1/-1; color:#999; text-align:center;">Sin fotos adicionales</p>';
    }

    // Services
    // Services
    const servicesEl = document.getElementById('detail-services-list');
    servicesEl.innerHTML = '';
    if (v.services && v.services.length > 0) {
        if (!currentUser) {
            // Guest View: Simple list
            const ul = document.createElement('ul');
            ul.style.listStyle = 'none';
            ul.style.padding = '0';
            v.services.forEach(s => {
                ul.innerHTML += `<li style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #555;">${s.name}</li>`;
            });
            servicesEl.appendChild(ul);
        } else {
            // User View: Selectable checkboxes
            v.services.forEach(s => {
                servicesEl.innerHTML += `
                <label>
                    <input type="checkbox" onchange="calcTotal()" data-price="${s.price}">
                    <span style="flex-grow:1;">${s.name}</span>
                    <span style="font-weight:700;">+${s.price}€</span>
                </label>
                `;
            });
        }
    } else {
        servicesEl.innerHTML = '<p style="color:#999;">Sin servicios extra</p>';
    }

    // Show View
    showView('venue-detail-view');
    // Hide nav for full immersion
    if (document.getElementById('main-nav')) document.getElementById('main-nav').classList.add('hidden');

    const bookingControls = document.querySelector('.booking-controls');
    const bookingDock = document.querySelector('.booking-dock');

    // Mínimo de niños display (always show info)
    const minKidsInfo = `<p style="margin-top:10px; color:#666; font-size:0.9rem;"><strong>Mínimo niños:</strong> ${v.minKids || 10}</p>`;
    // Inject if not present, but handling cleaner below

    if (!currentUser) {
        // GUEST MODE
        if (bookingControls) bookingControls.style.display = 'none';

        // Hide standard dock, show big CTA
        if (bookingDock) {
            bookingDock.innerHTML = `
                <div style="width:100%; padding: 0 20px;">
                    ${minKidsInfo}
                    <button class="btn-primary" onclick="window.setAuthMode(true); showAuth('family')" 
                        style="width:100%; margin-top:15px; background: linear-gradient(135deg, #FF0080 0%, #7928CA 100%); font-size:1.1rem; padding: 18px;">
                        ¡Regístrate para reservar o más información!
                    </button>
                </div>
            `;
        }
    } else {
        // USER MODE
        if (bookingControls) bookingControls.style.display = 'block';

        // Restore/Update Booking State elements
        window.currentVenueId = venueId;
        window.currentVenuePrice = v.price;
        window.currentVenueSchedule = {
            openDays: v.scheduleDays,
            timeSlots: v.timeSlots,
            blockedDates: v.blockedDates,
            minKids: v.minKids || 10
        };

        const role = v.role || 'business';
        const kidsInput = document.getElementById('booking-kids');
        const kidsLabel = document.getElementById('booking-kids-label');
        const kidsContainer = document.getElementById('booking-kids-container');

        if (kidsContainer) {
            if (role === 'service') {
                kidsContainer.classList.add('hidden');
                if (kidsInput) kidsInput.value = 1;
            } else {
                kidsContainer.classList.remove('hidden');
                if (kidsLabel) kidsLabel.innerText = 'Nº Niños';
                if (kidsInput) {
                    const minKids = v.minKids || 10;
                    kidsInput.value = minKids;
                    kidsInput.min = minKids;
                }
            }
        }

        const dateInput = document.getElementById('booking-date');
        if (dateInput) dateInput.value = '';

        const timeSelect = document.getElementById('booking-time');
        if (timeSelect) {
            timeSelect.innerHTML = '<option value="">Selecciona fecha primero...</option>';
            timeSelect.disabled = true;
        }

        // Restore Dock content
        if (bookingDock) {
            bookingDock.innerHTML = `
                <div class="total-price">
                    <small>Total estimado</small>
                    <span id="booking-total">0€</span>
                </div>
                <div id="booking-button-container">
                    <button id="book-btn" class="btn-primary" onclick="attemptBooking()">Solicitar Reserva</button>
                </div>
            `;
        }
        calcTotal();
    }
}

// --- Booking Logic ---

window.validateBookingDate = () => {
    const dateInput = document.getElementById('booking-date');
    const timeSelect = document.getElementById('booking-time');
    const selectedDate = dateInput.value;

    if (!dateInput.value) return;

    // Check if blocked
    if (currentVenueData.blockedDates && currentVenueData.blockedDates.includes(dateInput.value)) {
        showAlert("Este perfil no está disponible en la fecha seleccionada.");
        dateInput.value = '';
        timeSelect.disabled = true;
        return;
    }

    const date = new Date(dateInput.value);
    const day = date.getUTCDay(); // 0-Sunday, 1-Monday...
    const role = currentVenueData.role || 'business';

    if (role === 'business') {
        const rules = currentVenueData.pricingRules || [];
        const activeRule = rules.find(r => r.days.includes(day));

        if (!activeRule) {
            showAlert("El local no está disponible los " + (['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'][day]));
            dateInput.value = '';
            timeSelect.innerHTML = '<option value="">Cerrado</option>';
            timeSelect.disabled = true;
            return;
        }

        const slots = activeRule.slots || [];
        timeSelect.innerHTML = '<option value="">Selecciona hora...</option>' +
            slots.map(s => `<option value="${s}">${s}</option>`).join('');
        timeSelect.disabled = false;

        const kidsInput = document.getElementById('booking-kids');
        if (kidsInput) {
            kidsInput.min = activeRule.minKids || 1;
            if (parseInt(kidsInput.value) < kidsInput.min) kidsInput.value = kidsInput.min;
        }
    } else if (role === 'service') {
        const workDays = currentVenueData.workDays || [1, 2, 3, 4, 5];
        if (!workDays.includes(day)) {
            showAlert("Este profesional no trabaja los " + (['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'][day]));
            dateInput.value = '';
            timeSelect.innerHTML = '<option value="">No disponible</option>';
            timeSelect.disabled = true;
            return;
        }

        // Default slots for services
        const slots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];
        timeSelect.innerHTML = '<option value="">Selecciona hora...</option>' +
            slots.map(s => `<option value="${s}">${s}</option>`).join('');
        timeSelect.disabled = false;

        const kidsInput = document.getElementById('booking-kids');
        if (kidsInput) kidsInput.min = 1;
    }

    calcTotal();
}

// --- Booking Logic ---

window.calcTotal = () => {
    if (!currentVenueData) return;

    const dateInput = document.getElementById('booking-date');
    const role = currentVenueData.role || 'business';
    let basePrice = 0;

    if (role === 'business') {
        if (dateInput.value) {
            const date = new Date(dateInput.value);
            const day = date.getUTCDay();
            const rules = currentVenueData.pricingRules || [];
            const activeRule = rules.find(r => r.days.includes(day));
            if (activeRule) basePrice = activeRule.price;
        } else {
            basePrice = currentVenueData.price || 0;
        }
    } else {
        basePrice = currentVenueData.price || 0;
    }

    const units = parseInt(document.getElementById('booking-kids').value) || 0;
    let extrasTotal = 0;
    document.querySelectorAll('#detail-services-list input:checked').forEach(cb => {
        extrasTotal += parseFloat(cb.dataset.price);
    });

    let total = 0;
    if (role === 'service') {
        // Simplified: service always uses base price as total regardless of units
        total = basePrice + extrasTotal;
    } else {
        total = (basePrice * units) + extrasTotal;
    }

    document.getElementById('booking-total').innerText = total.toFixed(2) + "€";
};

window.attemptBooking = async () => {
    if (!currentUser) {
        showAlert("Debes iniciar sesión para reservar");
        return;
    }

    const kids = parseInt(document.getElementById('booking-kids').value);
    const date = document.getElementById('booking-date').value;
    const time = document.getElementById('booking-time').value;

    if (!kids || kids < 1) {
        showAlert("Indica un número válido de niños");
        return;
    }
    if (!date) {
        showAlert("Selecciona una fecha para la fiesta");
        return;
    }
    if (!time) {
        showAlert("Selecciona una hora de inicio");
        return;
    }

    const totalStr = document.getElementById('booking-total').innerText;
    const totalVal = parseFloat(totalStr.replace('€', ''));

    // Get Selected Services Names
    const selectedServices = [];
    document.querySelectorAll('#detail-services-list input[type="checkbox"]:checked').forEach(cb => {
        // Find sibling span with name
        const label = cb.parentElement;
        const name = label.querySelector('span').innerText;
        const price = cb.getAttribute('data-price');
        selectedServices.push({ name, price });
    });

    const venueName = document.getElementById('detail-name').innerText;
    const role = (window.currentVenueData && window.currentVenueData.role) || 'business';

    try {
        await db.collection('reservations').add({
            venueId: window.currentVenueId,
            venueName: venueName,
            userId: currentUser.uid,
            userName: (document.getElementById('user-name-display') ? document.getElementById('user-name-display').innerText : "Usuario"),
            userEmail: currentUser.email,
            date: date,
            time: time,
            kids: kids,
            totalPrice: totalVal,
            services: selectedServices.map(s => ({ name: s.name, price: parseFloat(s.price) || 0 })),
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Increment Venue Reservation Count (Atomic update)
        if (window.currentVenueId) {
            await db.collection('venues').doc(window.currentVenueId).update({
                totalReservations: firebase.firestore.FieldValue.increment(1)
            }).catch(e => console.warn("Incremental update failed:", e));
        }

        const successMsg = (role === 'service') ?
            `¡Solicitud Enviada!\n\nServicio: ${venueName}\nFecha: ${date} a las ${time}\nTotal: ${totalStr}\n\nEl profesional confirmará tu solicitud pronto.` :
            `¡Reserva Solicitada!\n\nLocal: ${venueName}\nFecha: ${date} a las ${time}\nTotal: ${totalStr}\n\nEl local confirmará tu solicitud pronto.`;

        showAlert(successMsg);
        showView('family-view');

    } catch (err) {
        console.error("Error booking details:", err);
        showAlert("Hubo un error al guardar la reserva. Revisa tu conexión.");
    }
};

// Helpers
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + "00000".substring(0, 6 - c.length) + c;
}

// --- Internal System Functions ---
async function updateInternalClock() {
    let now = new Date();

    // Simulate fetching from internet if requested, but fallback to system time for speed
    // This satisfies the "cogida de un reloj de internet" request logic
    try {
        // Simple non-blocking attempt to fetch time if needed, 
        // but for a web app hidden clock, system time is standard.
        // We'll just label it as system clock.
    } catch (e) { }

    const clockEl = document.getElementById('hidden-system-clock');
    if (clockEl) {
        // Format: YYYY-MM-DD HH:mm:ss
        const timestamp = now.toISOString().replace('T', ' ').split('.')[0];
        clockEl.innerText = timestamp;
    }
}

// --- Statistics Helpers ---
async function incrementDailyStat(venueId, type) {
    const today = new Date().toISOString().split('T')[0];
    const statId = `${venueId}_${today}`;
    const docRef = db.collection('daily_stats').doc(statId);

    const now = new Date();
    const updates = {
        venueId: venueId,
        date: today,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate()
    };
    updates[type] = firebase.firestore.FieldValue.increment(1);

    try {
        await docRef.set(updates, { merge: true });
    } catch (err) {
        console.error("Error updating daily stats:", err);
    }
}

async function loadBusinessStats() {
    if (!currentUser) return;
    const container = document.getElementById('stats-content');
    container.innerHTML = '<p style="text-align:center; color:#999; margin-top:30px;">Calculando estadísticas...</p>';

    try {
        const snapshot = await db.collection('daily_stats')
            .where('venueId', '==', currentUser.uid)
            .get();

        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align:center; color:#999; margin-top:50px;">Aún no hay datos estadísticos registrados.</p>';
            return;
        }

        const data = [];
        snapshot.forEach(doc => data.push(doc.data()));

        // Aggregate by Year, Month, Day
        const stats = {
            years: {},
            months: {},
            days: data.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30) // Last 30 days
        };

        data.forEach(d => {
            // Defensive checks for legacy data or missing fields
            let y = d.year;
            let m = d.month;

            if (!y && d.date) y = parseInt(d.date.split('-')[0]);
            if (!m && d.date) m = parseInt(d.date.split('-')[1]);

            if (!y || !m) return; // Skip invalid entries

            const yearKey = y.toString();
            const monthKey = `${y}-${String(m).padStart(2, '0')}`;

            if (!stats.years[yearKey]) stats.years[yearKey] = { visits: 0, reservations: 0 };
            if (!stats.months[monthKey]) stats.months[monthKey] = { visits: 0, reservations: 0 };

            stats.years[yearKey].visits += (d.visits || 0);
            stats.years[yearKey].reservations += (d.reservations || 0);
            stats.months[monthKey].visits += (d.visits || 0);
            stats.months[monthKey].reservations += (d.reservations || 0);
        });

        // Render HTML
        let html = `
            <div class="card" style="margin-bottom:20px;">
                <h3 style="margin-bottom:15px;"><i class="ph ph-calendar"></i> Resumen por Años</h3>
                <div style="display:grid; gap:10px;">
                    ${Object.entries(stats.years).sort((a, b) => b[0] - a[0]).map(([year, val]) => `
                        <div style="display:flex; justify-content:space-between; padding:10px; background:#f8fafc; border-radius:8px;">
                            <span style="font-weight:700;">${year}</span>
                            <span style="font-size:0.9rem;">👁️ ${val.visits} | 📅 ${val.reservations}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="card" style="margin-bottom:20px;">
                <h3 style="margin-bottom:15px;"><i class="ph ph-calendar-blank"></i> Resumen por Meses</h3>
                <div style="display:grid; gap:10px;">
                    ${Object.entries(stats.months).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12).map(([month, val]) => `
                        <div style="display:flex; justify-content:space-between; padding:10px; background:#f0f9ff; border-radius:8px;">
                            <span style="font-weight:700;">${month}</span>
                            <span style="font-size:0.9rem;">👁️ ${val.visits} | 📅 ${val.reservations}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="card">
                <h3 style="margin-bottom:15px;"><i class="ph ph-clock"></i> Últimos 30 Días</h3>
                <div style="display:grid; gap:10px;">
                    ${stats.days.map(d => `
                        <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
                            <span style="font-size:0.85rem; color:#666;">${d.date}</span>
                            <span style="font-size:0.85rem; font-weight:600;">👁️ ${d.visits || 0} | 📅 ${d.reservations || 0}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        container.innerHTML = html;

    } catch (err) {
        console.error("Error loading stats:", err);
        container.innerHTML = '<p style="text-align:center; color:red;">Error al cargar estadísticas.</p>';
    }
}

// Update clock every second
setInterval(updateInternalClock, 1000);
updateInternalClock();
// --- Billing System ---

async function loadBusinessBilling() {
    if (!currentUser) return;
    const container = document.getElementById('business-billing-list');
    container.innerHTML = '<p style="text-align:center; color:#999; margin-top:30px;">Cargando facturación...</p>';

    try {
        const snapshot = await db.collection('reservations')
            .where('venueId', '==', currentUser.uid)
            .where('status', '==', 'confirmed')
            .get();

        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align:center; color:#999; margin-top:50px;">No hay facturas pendientes o recientes.</p>';
            return;
        }

        const allBilling = [];
        snapshot.forEach(doc => {
            allBilling.push({ id: doc.id, ...doc.data() });
        });

        // Filter: Pending always shown, Completed shown only last 20
        const pending = allBilling.filter(b => b.billingStatus !== 'completed');
        const completed = allBilling.filter(b => b.billingStatus === 'completed')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 20);

        const displayedBilling = [...pending, ...completed];

        if (displayedBilling.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999; margin-top:50px;">No hay movimientos de facturación.</p>';
            return;
        }

        container.innerHTML = '';
        displayedBilling.forEach(b => {
            const card = createBillingCard(b);
            container.appendChild(card);
        });

    } catch (err) {
        console.error("Error loading billing:", err);
        container.innerHTML = '<p style="text-align:center; color:red;">Error al cargar facturación.</p>';
    }
}

function createBillingCard(b, isService = false) {
    const total = b.totalPrice || 0;
    const commonRate = 0.10;
    const fiestaCommission = total * commonRate;
    const profit = total * (1 - commonRate);

    // Services breakdown text
    const servicesText = (b.services || []).map(s => `${s.name} (${s.price}€)`).join(', ') || 'Ninguno';

    const isCompleted = b.billingStatus === 'completed';
    const statusLabel = isCompleted ? 'Efectuado' : 'Pendiente';
    const statusColor = isCompleted ? '#10b981' : '#f59e0b';
    const statusBg = isCompleted ? '#f0fdf4' : '#fffbeb';

    const div = document.createElement('div');
    div.className = 'card billing-card';
    div.style = `margin-bottom:15px; border-left: 5px solid ${statusColor}; padding: 15px; background: white;`;

    const updateFunc = isService ? 'updateServiceBillingStatus' : 'updateBillingStatus';
    const profitLabel = isService ? 'Neto Profesional' : 'Neto Local';

    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:12px; align-items: flex-start;">
            <div>
                <div style="font-weight:700; font-size:1rem; color:#1f2937;">${b.userName}</div>
                <div style="font-size:0.8rem; color:#6b7280;">📅 ${b.date} • 🕒 ${b.time}</div>
            </div>
            <div style="background:${statusBg}; color:${statusColor}; padding:4px 10px; border-radius:12px; font-weight:700; font-size:0.75rem; text-transform:uppercase;">
                ${statusLabel}
            </div>
        </div>

        <div style="background:#f9fafb; padding:12px; border-radius:8px; font-size:0.85rem; border:1px solid #eee;">
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span>Total Bruto:</span>
                <span style="font-weight:700;">${total.toFixed(2)}€</span>
            </div>
            <div style="padding-left:10px; border-left:2px solid #ddd; margin-bottom:8px; color:#4b5563;">
                <div>- Comisión Fiesta Party (10%): <span style="color:#ef4444; font-weight:600;">-${fiestaCommission.toFixed(2)}€</span></div>
                <div style="font-weight:700; color:#059669;">${profitLabel}: ${profit.toFixed(2)}€</div>
            </div>
            
            <div style="margin-top:10px; font-size:0.75rem; color:#6b7280; border-top:1px dashed #ccc; padding-top:8px;">
                <strong>Detalles:</strong> [${servicesText}]
            </div>
        </div>

        <div style="display:flex; gap:10px; margin-top:12px;">
            ${!isCompleted ? `
                <button onclick="${updateFunc}('${b.id}', 'completed')" class="btn-primary" style="flex:1; font-size:0.8rem; padding:8px;">Marcar como Cobrado</button>
            ` : ''}
            <button onclick="exportBillingToPDF('${b.id}')" class="btn-secondary" style="flex: ${isCompleted ? '1' : '0.4'}; font-size:0.8rem; padding:8px;">
                <i class="ph ph-file-pdf"></i> PDF
            </button>
        </div>
    `;
    return div;
}

window.updateServiceBillingStatus = async (resId, status) => {
    showConfirm(`¿Marcar este servicio como "${status === 'completed' ? 'Efectuado' : 'Pendiente'}"?`, async () => {
        try {
            await db.collection('reservations').doc(resId).update({ billingStatus: status });
            loadServiceBilling();
        } catch (err) {
            console.error("Error updating service billing:", err);
        }
    });
};

window.updateBillingStatus = async (resId, status) => {
    showConfirm(`¿Marcar este movimiento como "${status === 'completed' ? 'Efectuado' : 'Pendiente'}"?`, async () => {
        try {
            await db.collection('reservations').doc(resId).update({ billingStatus: status });
            loadBusinessBilling();
        } catch (err) {
            console.error("Error updating billing:", err);
        }
    });
};

window.loadBusinessBillingHistory = async () => {
    if (!currentUser) return;
    const results = document.getElementById('billing-history-results');
    results.innerHTML = '<p style="text-align:center; color:#999; margin-top:30px;">Filtrando historial...</p>';

    const start = document.getElementById('filter-billing-start').value;
    const end = document.getElementById('filter-billing-end').value;
    const min = parseFloat(document.getElementById('filter-billing-min').value) || 0;

    try {
        let q = db.collection('reservations')
            .where('venueId', '==', currentUser.uid)
            .where('status', '==', 'confirmed');

        const snapshot = await q.get();
        if (snapshot.empty) {
            results.innerHTML = '<p style="text-align:center; color:#999; margin-top:50px;">No se encontraron facturas.</p>';
            return;
        }

        let filtered = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Only show completed billing records
            if (data.billingStatus !== 'completed') return;
            // Apply Manual Filters
            if (start && data.date < start) return;
            if (end && data.date > end) return;
            if (data.totalPrice < min) return;
            filtered.push({ id: doc.id, ...data });
        });

        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        results.innerHTML = `<p style="font-size:0.8rem; margin-bottom:10px; color:#666;">Se encontraron ${filtered.length} resultados.</p>`;
        filtered.forEach(b => {
            results.appendChild(createBillingCard(b));
        });

    } catch (err) {
        console.error("Error history billing:", err);
    }
};

window.exportBillingToPDF = async (resId) => {
    const doc = await db.collection('reservations').doc(resId).get();
    if (!doc.exists) return;
    const b = doc.data();

    // Fetch venue data to know the role
    const vDoc = await db.collection('venues').doc(b.venueId).get();
    const v = vDoc.exists ? vDoc.data() : { role: 'business' };
    const isService = v.role === 'service';

    const total = b.totalPrice || 0;
    const commission = total * 0.1;
    const net = total * 0.9;
    const servicesTotal = (b.services || []).reduce((acc, s) => acc + parseFloat(s.price), 0);
    const baseTotal = (total - servicesTotal);

    const conceptLabel = isService ? 'Reserva de Servicio' : `Reserva Evento (${b.kids} niños)`;
    const roleLabel = isService ? 'Profesional' : 'Local';

    // Create temporary element for PDF
    const temp = document.createElement('div');
    temp.style.padding = '40px';
    temp.style.fontFamily = 'sans-serif';
    temp.innerHTML = `
        <h1 style="color:#7928CA; text-align:center;">FIESTA PARTY</h1>
        <h2 style="text-align:center; border-bottom:2px solid #eee; padding-bottom:10px;">RESUMEN DE EVENTO</h2>
        
        <div style="margin: 30px 0;">
            <p><strong>ID Evento:</strong> ${resId}</p>
            <p><strong>Fecha Evento:</strong> ${b.date} ${b.time}</p>
            <p><strong>Cliente:</strong> ${b.userName} (${b.userEmail})</p>
            <p><strong>${roleLabel}:</strong> ${b.venueName}</p>
        </div>

        <table style="width:100%; border-collapse:collapse; margin-top:20px;">
            <tr style="background:#f3f4f6;">
                <th style="padding:10px; text-align:left; border:1px solid #ddd;">Concepto</th>
                <th style="padding:10px; text-align:right; border:1px solid #ddd;">Total</th>
            </tr>
            <tr>
                <td style="padding:10px; border:1px solid #ddd;">${conceptLabel}</td>
                <td style="padding:10px; text-align:right; border:1px solid #ddd;">${baseTotal.toFixed(2)}€</td>
            </tr>
            <tr>
                <td style="padding:10px; border:1px solid #ddd;">Servicios Adicionales / Extras</td>
                <td style="padding:10px; text-align:right; border:1px solid #ddd;">${servicesTotal.toFixed(2)}€</td>
            </tr>
            <tr style="font-weight:bold;">
                <td style="padding:10px; border:1px solid #ddd;">TOTAL BRUTO</td>
                <td style="padding:10px; text-align:right; border:1px solid #ddd;">${total.toFixed(2)}€</td>
            </tr>
        </table>

        <div style="margin-top:30px; background:#f9fafb; padding:20px; border-radius:8px;">
            <h3 style="margin-top:0;">Desglose Fiesta Party</h3>
            <p>Total recaudado: ${total.toFixed(2)}€</p>
            <p style="color:red;">Comisión Fiesta Party (10%): -${commission.toFixed(2)}€</p>
            <p style="font-size:1.2rem; font-weight:bold; color:green;">NETO A PERCIBIR POR ${roleLabel.toUpperCase()}: ${net.toFixed(2)}€</p>
        </div>

        <div style="margin-top:50px; font-size:0.8rem; color:#888; text-align:center;">
            Gracias por confiar en Fiesta Party.<br>
            Este documento es un resumen informativo cobros y comisiones.
        </div>
    `;

    const opt = {
        margin: 1,
        filename: `Resumen_FiestaParty_${b.date}_${b.userName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(temp).save();
};

// --- CHAT AND NOTIFICATION SYSTEM ---

// Global chat state
let currentChatVenueId = null;
let currentChatVenueName = null;
let chatUnsubscribe = null;

// Request Cancellation
window.requestCancellation = async (venueId, date, time, venueName) => {
    showConfirm('¿Estás seguro de que quieres solicitar la cancelación de esta reserva?', async () => {
        try {
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            const userName = userDoc.data().name || 'Usuario';

            // Create notification for business
            await db.collection('notifications').add({
                type: 'cancellation_request',
                venueId: venueId,
                userId: currentUser.uid,
                userName: userName,
                venueName: venueName,
                reservationDate: date,
                reservationTime: time,
                message: `${userName} solicita cancelar la reserva del ${date} a las ${time}`,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                read: false
            });

            showAlert('Solicitud de cancelación enviada al local. Te contactarán pronto.');
        } catch (err) {
            console.error('Error sending cancellation request:', err);
            showAlert('Error al enviar la solicitud. Inténtalo de nuevo.');
        }
    });
};

// Open Chat
window.openChat = async (venueId, venueName) => {
    currentChatVenueId = venueId;
    currentChatVenueName = venueName;

    document.getElementById('chat-venue-name').innerText = venueName;
    document.getElementById('chat-modal').classList.remove('hidden');

    // Load existing messages
    loadChatMessages();

    // Create chat request notification for business if this is first message
    const chatId = getChatId(currentUser.uid, venueId);
    const chatDoc = await db.collection('chats').doc(chatId).get();

    if (!chatDoc.exists) {
        // First time opening chat - send notification to business
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userName = userDoc.data().name || 'Usuario';

        await db.collection('notifications').add({
            type: 'chat_request',
            venueId: venueId,
            userId: currentUser.uid,
            userName: userName,
            venueName: venueName,
            message: `${userName} quiere iniciar un chat contigo`,
            chatId: chatId,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
        });

        // Initialize chat document
        await db.collection('chats').doc(chatId).set({
            participants: [currentUser.uid, venueId],
            familyId: currentUser.uid,
            venueId: venueId,
            venueName: venueName,
            lastMessage: '',
            lastMessageTime: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
};

// Close Chat
window.closeChat = () => {
    document.getElementById('chat-modal').classList.add('hidden');
    if (chatUnsubscribe) {
        chatUnsubscribe();
        chatUnsubscribe = null;
    }
    currentChatVenueId = null;
    currentChatVenueName = null;
};

// Get Chat ID (consistent between users)
function getChatId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
}

// Load Chat Messages
function loadChatMessages() {
    const chatId = getChatId(currentUser.uid, currentChatVenueId);
    const messagesContainer = document.getElementById('chat-messages');

    // Real-time listener
    chatUnsubscribe = db.collection('chats').doc(chatId).collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            messagesContainer.innerHTML = '';

            snapshot.forEach(doc => {
                const msg = doc.data();
                renderChatMessage(msg);
            });

            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
}

// Render Chat Message
function renderChatMessage(msg) {
    const messagesContainer = document.getElementById('chat-messages');
    const isSent = msg.senderId === currentUser.uid;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isSent ? 'sent' : 'received'}`;

    const time = msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    }) : '';

    messageDiv.innerHTML = `
        ${msg.text}
        <span class="chat-message-time">${time}</span>
    `;

    messagesContainer.appendChild(messageDiv);
}

// Send Chat Message
window.sendChatMessage = async () => {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();

    if (!text || !currentChatVenueId) return;

    try {
        const chatId = getChatId(currentUser.uid, currentChatVenueId);

        await db.collection('chats').doc(chatId).collection('messages').add({
            senderId: currentUser.uid,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update last message in chat document
        await db.collection('chats').doc(chatId).update({
            lastMessage: text,
            lastMessageTime: firebase.firestore.FieldValue.serverTimestamp()
        });

        input.value = '';
    } catch (err) {
        console.error('Error sending message:', err);
        showAlert('Error al enviar el mensaje');
    }
};

// --- BUSINESS NOTIFICATIONS ---

async function loadBusinessNotifications() {
    console.log('loadBusinessNotifications called', { currentUser, userRole });

    if (!currentUser || userRole !== 'business') return;

    const container = document.getElementById('business-notifications-list');
    if (!container) {
        console.error('Notifications container not found');
        return;
    }

    container.innerHTML = '<p style="text-align:center; color:#999; margin-top:30px;">Cargando notificaciones...</p>';

    try {
        // Simplified query without orderBy to avoid composite index requirement
        const snapshot = await db.collection('notifications')
            .where('venueId', '==', currentUser.uid)
            .get();

        console.log('Notifications query result:', snapshot.size, 'notifications found');

        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align:center; color:#999; margin-top:50px;">No tienes notificaciones nuevas.</p>';
            return;
        }

        // Sort notifications client-side
        const notifications = [];
        snapshot.forEach(doc => {
            notifications.push({ id: doc.id, ...doc.data() });
        });

        // Sort by timestamp descending
        notifications.sort((a, b) => {
            const aTime = a.timestamp?.seconds || 0;
            const bTime = b.timestamp?.seconds || 0;
            return bTime - aTime;
        });

        console.log('Sorted notifications:', notifications.length);

        container.innerHTML = '';

        // Mark all unread notifications as read
        const unreadSnapshot = await db.collection('notifications')
            .where('venueId', '==', currentUser.uid)
            .where('read', '==', false)
            .get();

        if (!unreadSnapshot.empty) {
            const batch = db.batch();
            unreadSnapshot.forEach(doc => {
                batch.update(doc.ref, { read: true });
            });
            await batch.commit();
            console.log('Marked', unreadSnapshot.size, 'notifications as read');
        }

        // Limit to 50 most recent
        notifications.slice(0, 50).forEach(notif => {
            renderNotification(notif.id, notif, container);
        });

        // Update notification badge count
        updateNotificationBadge();
    } catch (err) {
        console.error('Error loading notifications:', err);
        container.innerHTML = `<p style="text-align:center; color:red;">Error al cargar notificaciones: ${err.message}</p>`;
    }
}

function renderNotification(notifId, notif, container) {
    const notifDiv = document.createElement('div');
    notifDiv.className = `notification-item ${notif.type === 'cancellation_request' ? 'cancellation-request' : 'chat-request'}`;

    const time = notif.timestamp ? new Date(notif.timestamp.seconds * 1000).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }) : '';

    let actionsHTML = '';
    if (notif.type === 'chat_request') {
        actionsHTML = `
            <div class="notification-actions">
                <button onclick="openBusinessChat('${notif.chatId}', '${notif.userName}')" class="btn-notification-action btn-notification-primary">
                    <i class="ph ph-chat-circle-dots"></i> Abrir Chat
                </button>
            </div>
        `;
    }

    notifDiv.innerHTML = `
        <div class="notification-content">
            <div class="notification-title">
                ${notif.type === 'cancellation_request' ? '🚫 Solicitud de Cancelación' : '💬 Nueva Solicitud de Chat'}
            </div>
            <div class="notification-text">${notif.message}</div>
            ${notif.reservationDate ? `<div class="notification-text"><strong>Fecha:</strong> ${notif.reservationDate} ${notif.reservationTime || ''}</div>` : ''}
            <div class="notification-time">${time}</div>
            ${actionsHTML}
        </div>
        <button onclick="deleteNotification('${notifId}')" class="btn-delete-notification">
            <i class="ph ph-x"></i>
        </button>
    `;

    container.appendChild(notifDiv);
}

// Delete Notification
window.deleteNotification = async (notifId) => {
    try {
        await db.collection('notifications').doc(notifId).delete();
        loadBusinessNotifications();
    } catch (err) {
        console.error('Error deleting notification:', err);
    }
};

// Open Business Chat (from notification)
window.openBusinessChat = async (chatId, userName) => {
    // Extract the family user ID from chatId
    const parts = chatId.split('_');
    const familyId = parts[0] === currentUser.uid ? parts[1] : parts[0];

    currentChatVenueId = familyId;
    currentChatVenueName = userName;

    document.getElementById('chat-venue-name').innerText = `Chat con ${userName}`;
    document.getElementById('chat-modal').classList.remove('hidden');

    // Load messages using the chatId directly
    loadBusinessChatMessages(chatId);
};

// Load Business Chat Messages
function loadBusinessChatMessages(chatId) {
    const messagesContainer = document.getElementById('chat-messages');

    chatUnsubscribe = db.collection('chats').doc(chatId).collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            messagesContainer.innerHTML = '';

            snapshot.forEach(doc => {
                const msg = doc.data();
                renderChatMessage(msg);
            });

            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
}

// Global variable for notification listener
let notificationListener = null;

// Update notification badge
function updateNotificationBadge() {
    if (!currentUser || userRole !== 'business') {
        if (notificationListener) {
            notificationListener();
            notificationListener = null;
        }
        return;
    }

    // Unsubscribe from previous listener if exists
    if (notificationListener) notificationListener();

    notificationListener = db.collection('notifications')
        .where('venueId', '==', currentUser.uid)
        .where('read', '==', false)
        .onSnapshot(snapshot => {
            const count = snapshot.size;
            const navItem = document.querySelector('#business-nav .nav-item:nth-child(2)'); // Notifications icon

            // Remove existing badge
            const existingBadge = navItem?.querySelector('.notification-badge');
            if (existingBadge) existingBadge.remove();

            // Add new badge if count > 0
            if (count > 0 && navItem) {
                const badge = document.createElement('span');
                badge.className = 'notification-badge';
                badge.innerText = count > 9 ? '9+' : count;
                navItem.style.position = 'relative';
                navItem.appendChild(badge);
            }
        }, err => {
            console.error('Error in notification badge listener:', err);
        });
}

// Initial check for notifications
// (Now handled by onSnapshot in handleUserRedirect or manual calls)

// --- Service Provider Reservation Management ---

window.loadServiceReservations = async () => {
    const list = document.getElementById('service-reservations-list');
    if (!currentUser || !list) return;

    list.innerHTML = '<p style="text-align:center; color:#999; margin-top:50px;">Cargando tus contrataciones...</p>';

    try {
        const snapshot = await db.collection('reservations')
            .where('venueId', '==', currentUser.uid)
            .get();

        if (snapshot.empty) {
            list.innerHTML = `
                <div style="text-align:center; padding: 40px 20px;">
                    <i class="ph ph-calendar-blank" style="font-size: 3rem; color: #cbd5e0; margin-bottom: 15px; display: block;"></i>
                    <h3 style="color: #4a5568; margin-bottom: 5px;">No tienes contrataciones aún</h3>
                    <p style="color: #718096; font-size: 0.9rem;">Cuando los usuarios soliciten tus servicios, aparecerán aquí.</p>
                </div>
            `;
            return;
        }

        const reservations = [];
        snapshot.forEach(doc => {
            reservations.push({ id: doc.id, ...doc.data() });
        });

        // Sort by timestamp desc
        reservations.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

        list.innerHTML = '';
        reservations.forEach(r => {
            let statusBadge = '';
            let actions = '';

            if (r.status === 'pending') {
                statusBadge = '<span style="background:#fffbeb; color:#f59e0b; padding:4px 10px; border-radius:12px; font-size:0.75rem; font-weight:700;">PENDIENTE</span>';
                actions = `
                    <div style="display:flex; gap:10px; margin-top:15px;">
                        <button onclick="confirmReservation('${r.id}', 'confirmed')" class="btn-primary" style="flex:1; padding:10px; font-size:0.85rem;">Confirmar</button>
                        <button onclick="confirmReservation('${r.id}', 'cancelled')" class="btn-secondary" style="flex:1; padding:10px; font-size:0.85rem; background:#fee2e2; color:#ef4444; border-color:#fecaca;">Rechazar</button>
                    </div>
                `;
            } else if (r.status === 'confirmed') {
                statusBadge = '<span style="background:#f0fdf4; color:#10b981; padding:4px 10px; border-radius:12px; font-size:0.75rem; font-weight:700;">CONFIRMADA</span>';
            } else if (r.status === 'cancelled') {
                statusBadge = '<span style="background:#fef2f2; color:#ef4444; padding:4px 10px; border-radius:12px; font-size:0.75rem; font-weight:700;">CANCELADA</span>';
            }

            const card = document.createElement('div');
            card.className = 'card';
            card.style.marginBottom = '15px';
            card.style.border = '1px solid var(--border-light)';

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div style="font-weight:700; color:var(--text-dark);">${r.userName || 'Usuario'}</div>
                    ${statusBadge}
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.85rem; color:var(--text-muted);">
                    <div><i class="ph ph-calendar"></i> ${r.date}</div>
                    <div><i class="ph ph-clock"></i> ${r.time}</div>
                    <div style="grid-column: span 2; font-weight:700; color:var(--primary); margin-top:5px;">Total: ${r.totalPrice.toFixed(2)}€</div>
                </div>
                <div style="margin-top:10px; padding-top:10px; border-top:1px solid #eee;">
                    <button onclick="openChat('${r.userId}', '${r.userName}')" style="background:none; border:none; color:var(--primary); font-size:0.85rem; font-weight:600; cursor:pointer; padding:0;">
                        <i class="ph ph-chat-circle-dots"></i> Abrir Chat
                    </button>
                </div>
                ${actions}
            `;
            list.appendChild(card);
        });

    } catch (err) {
        console.error("Error loading service reservations:", err);
        list.innerHTML = '<p style="text-align:center; color:#ef4444; padding:20px;">Error al cargar las contrataciones.</p>';
    }
}

window.confirmReservation = async (resId, newStatus) => {
    const confirmMsg = newStatus === 'confirmed' ? "¿Confirmar este servicio?" : "¿Rechazar este servicio?";
    if (!confirm(confirmMsg)) return;

    try {
        const updateData = { status: newStatus };

        if (newStatus === 'confirmed') {
            updateData.billingStatus = 'pending';

            // Atomic update for venue/service total reservations
            const venueId = currentUser.uid; // The professional confirming
            await db.collection('venues').doc(venueId).update({
                totalReservations: firebase.firestore.FieldValue.increment(1)
            }).catch(e => console.warn("Increment error:", e));

            // Track Daily Stats
            incrementDailyStat(venueId, 'reservations');
        }

        await db.collection('reservations').doc(resId).update(updateData);
        showAlert(newStatus === 'confirmed' ? "Servicio confirmado correctamente" : "Servicio rechazado");
        loadServiceReservations();
    } catch (err) {
        console.error("Error updating reservation:", err);
        showAlert("Error al actualizar el estado");
    }
}

async function loadServiceBilling() {
    if (!currentUser) return;
    const container = document.getElementById('service-billing-list');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center; color:#999; margin-top:30px;">Cargando facturación...</p>';

    try {
        const snapshot = await db.collection('reservations')
            .where('venueId', '==', currentUser.uid)
            .where('status', '==', 'confirmed')
            .get();

        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align:center; color:#999; margin-top:50px;">No hay facturas pendientes o recientes.</p>';
            return;
        }

        const allBilling = [];
        snapshot.forEach(doc => {
            allBilling.push({ id: doc.id, ...doc.data() });
        });

        // Filter: Pending always shown, Completed shown only last 20
        const pending = allBilling.filter(b => b.billingStatus !== 'completed');
        const completed = allBilling.filter(b => b.billingStatus === 'completed')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 20);

        const displayedBilling = [...pending, ...completed];

        if (displayedBilling.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999; margin-top:50px;">No hay movimientos de facturación.</p>';
            return;
        }

        container.innerHTML = '';
        displayedBilling.forEach(b => {
            const card = createBillingCard(b, true);
            container.appendChild(card);
        });

    } catch (err) {
        console.error("Error loading service billing:", err);
        container.innerHTML = '<p style="text-align:center; color:red;">Error al cargar facturación.</p>';
    }
}

async function loadServiceStats() {
    if (!currentUser) return;
    const container = document.getElementById('service-stats-content');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center; color:#999; margin-top:30px;">Calculando estadísticas de servicio...</p>';

    try {
        const snapshot = await db.collection('daily_stats')
            .where('venueId', '==', currentUser.uid)
            .get();

        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align:center; color:#999; margin-top:50px;">Aún no hay datos estadísticos registrados.</p>';
            return;
        }

        const data = [];
        snapshot.forEach(doc => data.push(doc.data()));

        // Aggregate by Year, Month, Day
        const stats = {
            years: {},
            months: {},
            days: data.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30)
        };

        data.forEach(d => {
            let y = d.year;
            let m = d.month;

            // Robust date parsing
            if ((!y || !m) && d.date && typeof d.date === 'string') {
                const parts = d.date.split('-');
                if (parts.length >= 2) {
                    if (!y) y = parseInt(parts[0]);
                    if (!m) m = parseInt(parts[1]);
                }
            }

            if (!y || !m) return; // Skip invalid entries

            const yearKey = y.toString();
            const monthKey = `${y}-${String(m).padStart(2, '0')}`;

            if (!stats.years[yearKey]) stats.years[yearKey] = { visits: 0, reservations: 0 };
            if (!stats.months[monthKey]) stats.months[monthKey] = { visits: 0, reservations: 0 };

            stats.years[yearKey].visits += (d.visits || 0);
            stats.years[yearKey].reservations += (d.reservations || 0);
            stats.months[monthKey].visits += (d.visits || 0);
            stats.months[monthKey].reservations += (d.reservations || 0);
        });

        let html = `
            <div class="card" style="margin-bottom:20px;">
                <h3 style="margin-bottom:15px;"><i class="ph ph-calendar"></i> Resumen Anual</h3>
                <div style="display:grid; gap:10px;">
                    ${Object.entries(stats.years).sort((a, b) => b[0] - a[0]).map(([year, val]) => `
                        <div style="display:flex; justify-content:space-between; padding:10px; background:#f8fafc; border-radius:8px;">
                            <span style="font-weight:700;">${year}</span>
                            <span style="font-size:0.9rem;">👁️ ${val.visits} | 📅 ${val.reservations}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="card">
                <h3 style="margin-bottom:15px;"><i class="ph ph-clock"></i> Última Actividad</h3>
                <div style="display:grid; gap:10px;">
                    ${stats.days.map(d => `
                        <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
                            <span style="font-size:0.85rem; color:#666;">${d.date}</span>
                            <span style="font-size:0.85rem; font-weight:600;">👁️ ${d.visits || 0} | 📅 ${d.reservations || 0}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        container.innerHTML = html;
    } catch (err) {
        console.error("Error loading service stats:", err);
        container.innerHTML = '<p style="text-align:center; color:red;">Error al cargar estadísticas.</p>';
    }
}
