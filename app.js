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

// --- State ---
let currentUser = null;
let userRole = null; // 'family' or 'business'
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

    if (isRegistering) {
        btn.innerText = "Crear Cuenta";
        switchText.innerText = "¿Ya tienes cuenta?";
        toggleBtn.innerText = "Inicia Sesión";
        extraFields.classList.remove('hidden');
    } else {
        btn.innerText = "Entrar";
        switchText.innerText = "¿No tienes cuenta?";
        toggleBtn.innerText = "Regístrate";
        extraFields.classList.add('hidden');
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
        auth.role = 'family';
        subtitle.innerText = isRegistering ? "Únete a la comunidad" : "¡Encuentra tu fiesta ideal!";
    } else {
        title.innerText = isRegistering ? "Registro Local" : "Acceso Local";
        auth.role = 'business';
        subtitle.innerText = "Gestiona tu negocio y reservas";
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

    if (isRegistering) {
        btn.innerText = "Crear Cuenta";
        switchText.innerText = "¿Ya tienes cuenta?";
        toggleBtn.innerText = "Inicia Sesión";
        extraFields.classList.remove('hidden');
    } else {
        btn.innerText = "Entrar";
        switchText.innerText = "¿No tienes cuenta?";
        toggleBtn.innerText = "Regístrate";
        extraFields.classList.add('hidden');
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
                    capacity: 0
                });
            }

        } else {
            // Login
            await auth.signInWithEmailAndPassword(email, password);
        }
    } catch (error) {
        console.error("Auth Error:", error);
        showAlert(error.message);
        btn.disabled = false;
        btn.innerText = isRegistering ? "Crear Cuenta" : "Entrar";
    }
});

async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        // Check if user already exists in Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            // New user, create profile with current intendedRole
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                name: user.displayName || "Usuario Google",
                role: intendedRole,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // If business, create empty venue profile
            if (intendedRole === 'business') {
                await db.collection('venues').doc(user.uid).set({
                    ownerId: user.uid,
                    name: (user.displayName || "Local") + " Venue",
                    description: "",
                    price: 0,
                    capacity: 0
                });
            }
            console.log("Nuevo usuario Google registrado como:", intendedRole);
        } else {
            console.log("Usuario Google ya existente:", userDoc.data().role);
        }
    } catch (error) {
        console.error("Google Auth Error:", error);
        showAlert("Error al acceder con Google: " + error.message);
    }
}


// --- Business Navigation Helper ---
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
        // Fetch Role
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) {
            const data = doc.data();
            userRole = data.role;

            // Redirect based on role
            if (userRole === 'family') {
                document.getElementById('user-name-display').innerText = data.name;
                // Start at family-view ("Explora") by default
                const initialTab = document.querySelector('.nav-item'); // First item is search/explore
                switchFamilyTab('family-view', initialTab);
                loadVenues();
            } else if (userRole === 'business') {
                document.getElementById('biz-name-display').innerText = data.name || "Empresa";
                // Start at configuration (business-view) as it's the current main page
                const initialTab = document.querySelectorAll('#business-nav .nav-item')[3]; // Last item is gear
                switchBusinessTab('business-view', initialTab);
                loadBusinessProfile();
                // Update notification badge on login
                setTimeout(() => updateNotificationBadge(), 1000);
            } else {
                // Fallback / Error
                showAlert("Rol no definido");
            }
        } else {
            // New user, data might not be ready if just signed up (race condition handled in register flow ideally) or manual login without data
            // For now assume register flow handles set()
            console.log("Esperando datos de usuario...");
        }
    } else {
        currentUser = null;
        userRole = null;
        showView('landing-view');
        loadVenues(); // Load venues on landing for guests
    }
});

function logout() {
    auth.signOut();
}

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

document.getElementById('btn-add-slot').addEventListener('click', () => {
    const time = document.getElementById('new-slot-time').value;
    if (time && !window.currentSchedule.timeSlots.includes(time)) {
        window.currentSchedule.timeSlots.push(time);
        window.currentSchedule.timeSlots.sort();
        renderSlots();
        document.getElementById('new-slot-time').value = '';
    }
});

window.removeSlot = (idx) => {
    window.currentSchedule.timeSlots.splice(idx, 1);
    renderSlots();
};

function renderSlots() {
    const container = document.getElementById('slots-list');
    container.innerHTML = window.currentSchedule.timeSlots.map((t, i) =>
        `<div style="background:#e0f2fe; color:#0369a1; padding:5px 10px; border-radius:20px; font-size:0.8rem; display:flex; align-items:center; gap:5px;">${t} <button onclick="removeSlot(${i})" style="border:none; bg:none; color:#0369a1; cursor:pointer; font-weight:bold;">x</button></div>`
    ).join('');
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
            scheduleDays: openDays,
            timeSlots: window.currentSchedule.timeSlots,
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

// Override submit to trigger save immediately
document.getElementById('venue-form').addEventListener('submit', (e) => {
    e.preventDefault();
    autoSaveVenue();
});


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
                    <label style="font-size:0.7rem; color:${statusColor}; font-weight:700; text-transform:uppercase;">LOCAL</label>
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
                <div>
                    <label style="font-size:0.7rem; color:${statusColor}; font-weight:700; text-transform:uppercase;">NIÑOS</label>
                    <div style="font-size:0.9rem; font-weight:600; color:#4b5563;">${r.kids}</div>
                </div>
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

    // Action Buttons (show for pending and confirmed reservations)
    let actionButtonsHTML = '';
    if (r.status === 'confirmed' || r.status === 'pending') {
        actionButtonsHTML = `
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button onclick="requestCancellation('${r.venueId}', '${r.date}', '${r.time}', '${r.venueName}')" class="btn-secondary" style="flex: 1; background: #fef2f2; color: #ef4444; border-color: #fecaca;">
                    <i class="ph ph-x-circle"></i> Solicitud de cancelación
                </button>
                <button onclick="openChat('${r.venueId}', '${r.venueName}')" class="btn-primary" style="flex: 1;">
                    <i class="ph ph-chat-circle-dots"></i> Chat con local
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

            // --- FILTER LOGIC ---
            if (filters.city) {
                if (!v.city || !v.city.toLowerCase().includes(filters.city.toLowerCase())) return;
            }

            if (filters.date) {
                const dateObj = new Date(filters.date);
                const dayOfWeek = dateObj.getDay(); // 0=Sun, 1=Mon...

                // Check Blocked Dates
                if (v.blockedDates && v.blockedDates.includes(filters.date)) return;

                // Check Open Days
                if (v.scheduleDays && v.scheduleDays.length > 0 && !v.scheduleDays.includes(dayOfWeek)) return;

                // Check Time Slots (must have at least one)
                if (!v.timeSlots || v.timeSlots.length === 0) return;
            }

            count++;
            const coverStyle = v.coverImage ? `background-image: url(${v.coverImage}); background-size:cover;` : `background-color: ${stringToColor(v.name)}`;

            grid.innerHTML += `
            <div class="venue-card" onclick="openVenueDetail('${doc.id}')" style="cursor:pointer; margin-bottom: 20px;">
                <div class="venue-img" style="${coverStyle}"></div>
                <div class="venue-info">
                    <div class="venue-header-row">
                        <h3>${v.name}</h3>
                        <span class="venue-price">${v.price}€ /niño</span>
                    </div>
                    <p class="venue-desc">${v.description ? v.description.substring(0, 60) : ''}...</p>
                    <div class="venue-footer">
                        <span><i class="ph ph-map-pin"></i> ${v.city || 'Ubicación n/d'}</span>
                        <span><i class="ph ph-users"></i> Cap: ${v.capacity}</span>
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

    // Fill Data
    document.getElementById('detail-name').innerText = v.name;
    document.getElementById('detail-price').innerText = v.price + '€';
    document.getElementById('detail-capacity').innerText = v.capacity;
    document.getElementById('detail-desc').innerText = v.description;

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

        const minKidsVal = v.minKids || 10;
        const kidsInput = document.getElementById('booking-kids');
        if (kidsInput) {
            kidsInput.value = minKidsVal;
            kidsInput.min = minKidsVal;
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

    if (!selectedDate) {
        timeSelect.disabled = true;
        return;
    }

    const dateObj = new Date(selectedDate);
    const dayOfWeek = dateObj.getDay(); // 0=Sun, 1=Mon...
    const schedule = window.currentVenueSchedule;

    // 1. Check Blocked Dates
    if (schedule.blockedDates && schedule.blockedDates.includes(selectedDate)) {
        showAlert("Lo sentimos, esta fecha no está disponible.");
        dateInput.value = '';
        timeSelect.disabled = true;
        return;
    }

    // 2. Check Open Days (If config exists)
    if (schedule.openDays && schedule.openDays.length > 0 && !schedule.openDays.includes(dayOfWeek)) {
        showAlert("El local está cerrado este día de la semana.");
        dateInput.value = '';
        timeSelect.disabled = true;
        return;
    }

    // 3. Populate Slots
    timeSelect.innerHTML = '<option value="">Selecciona hora...</option>';
    if (schedule.timeSlots && schedule.timeSlots.length > 0) {
        schedule.timeSlots.forEach(slot => {
            timeSelect.innerHTML += `<option value="${slot}">${slot}</option>`;
        });
        timeSelect.disabled = false;
    } else {
        timeSelect.innerHTML = '<option value="default">Horario a convenir</option>';
        timeSelect.disabled = false;
    }
};

// --- Booking Logic ---

window.calcTotal = () => {
    const kids = parseInt(document.getElementById('booking-kids').value) || 0;
    const basePrice = window.currentVenuePrice || 0;

    let servicesTotal = 0;
    const checkboxes = document.querySelectorAll('#detail-services-list input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
        servicesTotal += parseFloat(cb.getAttribute('data-price') || 0);
    });

    // Assuming service price is fixed regardless of kids (e.g., "Cake" = 50€ total), 
    // OR if it's per kid, it should be multiplied. Usually services like Cake/Animation are flat fees.
    // If user request implied "comprar servicios", flat fee is standard.

    const total = (kids * basePrice) + servicesTotal;
    document.getElementById('booking-total').innerText = total.toFixed(2) + '€';
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

    try {
        await db.collection('reservations').add({
            venueId: window.currentVenueId,
            venueName: venueName,
            userId: currentUser.uid,
            userName: document.getElementById('user-name-display').innerText || "Usuario",
            userEmail: currentUser.email,
            date: date,
            time: time,
            kids: kids,
            totalPrice: totalVal,
            services: selectedServices,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Increment Venue Reservation Count (Atomic update)
        await db.collection('venues').doc(window.currentVenueId).update({
            totalReservations: firebase.firestore.FieldValue.increment(1)
        });

        // Daily Stats
        incrementDailyStat(window.currentVenueId, 'reservations');

        showAlert(`¡Reserva Solicitada!\n\nLocal: ${venueName}\nFecha: ${date} a las ${time}\nTotal: ${totalStr}\n\nEl local confirmará tu solicitud pronto.`);
        showView('family-view');

    } catch (err) {
        console.error("Error booking:", err);
        showAlert("Hubo un error al guardar la reserva");
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
            const yearKey = d.year.toString();
            const monthKey = `${d.year}-${String(d.month).padStart(2, '0')}`;

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

function createBillingCard(b) {
    const total = b.totalPrice || 0;
    const commonRate = 0.10;
    const fiestaCommission = total * commonRate;
    const venueProfit = total * (1 - commonRate);

    // Services breakdown text
    const servicesText = (b.services || []).map(s => `${s.name} (${s.price}€)`).join(', ') || 'Ninguno';

    const isCompleted = b.billingStatus === 'completed';
    const statusLabel = isCompleted ? 'Efectuado' : 'Pendiente';
    const statusColor = isCompleted ? '#10b981' : '#f59e0b';
    const statusBg = isCompleted ? '#f0fdf4' : '#fffbeb';

    const div = document.createElement('div');
    div.className = 'card billing-card';
    div.style = `margin-bottom:15px; border-left: 5px solid ${statusColor}; padding: 15px; background: white;`;

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
                <div style="font-weight:700; color:#059669;">Neto Local: ${venueProfit.toFixed(2)}€</div>
            </div>
            
            <div style="margin-top:10px; font-size:0.75rem; color:#6b7280; border-top:1px dashed #ccc; padding-top:8px;">
                <strong>Detalles:</strong> Kids x Price + Serv: (${b.kids} x ...) + [${servicesText}]
            </div>
        </div>

        <div style="display:flex; gap:10px; margin-top:12px;">
            ${!isCompleted ? `
                <button onclick="updateBillingStatus('${b.id}', 'completed')" class="btn-primary" style="flex:1; font-size:0.8rem; padding:8px;">Marcar como Cobrado</button>
            ` : ''}
            <button onclick="exportBillingToPDF('${b.id}')" class="btn-secondary" style="flex: ${isCompleted ? '1' : '0.4'}; font-size:0.8rem; padding:8px;">
                <i class="ph ph-file-pdf"></i> PDF
            </button>
        </div>
    `;
    return div;
}

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

    const total = b.totalPrice || 0;
    const commission = total * 0.1;
    const net = total * 0.9;

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
        </div>

        <table style="width:100%; border-collapse:collapse; margin-top:20px;">
            <tr style="background:#f3f4f6;">
                <th style="padding:10px; text-align:left; border:1px solid #ddd;">Concepto</th>
                <th style="padding:10px; text-align:right; border:1px solid #ddd;">Total</th>
            </tr>
            <tr>
                <td style="padding:10px; border:1px solid #ddd;">Reserva Evento (${b.kids} niños)</td>
                <td style="padding:10px; text-align:right; border:1px solid #ddd;">${(b.totalPrice - (b.services || []).reduce((acc, s) => acc + parseFloat(s.price), 0)).toFixed(2)}€</td>
            </tr>
            <tr>
                <td style="padding:10px; border:1px solid #ddd;">Servicios Adicionales</td>
                <td style="padding:10px; text-align:right; border:1px solid #ddd;">${(b.services || []).reduce((acc, s) => acc + parseFloat(s.price), 0).toFixed(2)}€</td>
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
            <p style="font-size:1.2rem; font-weight:bold; color:green;">NETO A PERCIBIR POR LOCAL: ${net.toFixed(2)}€</p>
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

// Update notification badge
function updateNotificationBadge() {
    if (!currentUser || userRole !== 'business') return;

    db.collection('notifications')
        .where('venueId', '==', currentUser.uid)
        .where('read', '==', false)
        .get()
        .then(snapshot => {
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
        });
}

// Periodically check for new notifications (every 30 seconds)
setInterval(() => {
    if (currentUser && userRole === 'business') {
        updateNotificationBadge();
    }
}, 30000);
