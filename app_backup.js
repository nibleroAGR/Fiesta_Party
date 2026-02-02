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
function showView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');

    // Toggle Nav
    // Toggle Nav (Removed)
    // const nav = document.getElementById('main-nav');
    // if (viewId === 'family-view' || viewId === 'business-view') {
    //    nav.classList.remove('hidden');
    // } else {
    //    nav.classList.add('hidden');
    // }
}

// --- Auth Flow ---
function showAuth(role) {
    intendedRole = role;
    showView('auth-view');
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');

    if (role === 'family') {
        title.innerText = "Acceso Familia";
        auth.role = 'family';
        subtitle.innerText = "¡Encuentra tu fiesta ideal!";
    } else {
        title.innerText = "Acceso Local";
        auth.role = 'business';
        subtitle.innerText = "Gestiona tu negocio y reservas";
    }

    // Reset Form and Button State
    document.getElementById('auth-form').reset();
    const btn = document.getElementById('auth-action-btn');
    btn.disabled = false;
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
        alert(error.message);
        btn.disabled = false;
        btn.innerText = isRegistering ? "Crear Cuenta" : "Entrar";
    }
});

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
                showView('family-view');
                loadVenues();
            } else if (userRole === 'business') {
                showView('business-view');
                loadBusinessProfile();
            } else {
                // Fallback / Error
                alert("Rol no definido");
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
        document.getElementById('venue-price').value = data.price || "";
        document.getElementById('venue-capacity').value = data.capacity || "";

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

// Save Profile
document.getElementById('venue-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    // Get Open Days
    const openDays = [];
    document.querySelectorAll('input[name="openDays"]:checked').forEach(cb => openDays.push(parseInt(cb.value)));

    const updates = {
        name: document.getElementById('venue-name').value,
        description: document.getElementById('venue-desc').value,
        price: parseFloat(document.getElementById('venue-price').value),
        capacity: parseInt(document.getElementById('venue-capacity').value),
        services: currentVenueServices,
        gallery: currentVenueGallery,
        coverImage: currentCoverImage,
        scheduleDays: openDays,
        timeSlots: window.currentSchedule.timeSlots,
        blockedDates: window.currentSchedule.blockedDates
    };

    try {
        await db.collection('venues').doc(currentUser.uid).update(updates);
        alert("¡Perfil actualizado con éxito!");
        document.getElementById('biz-name-display').innerText = updates.name;
    } catch (err) {
        console.error(err);
        alert("Error al guardar");
    }
});


// --- Family Logic ---
async function loadVenues() {
    const grid = document.getElementById('venues-list');
    grid.innerHTML = '<div class="venue-card skeleton"><div class="venue-info" style="text-align:center; padding:20px;">Cargando locales...</div></div>';

    try {
        const snapshot = await db.collection('venues').get();
        if (snapshot.empty) {
            grid.innerHTML = '<p style="text-align:center; padding:20px;">No hay locales disponibles aún.</p>';
            return;
        }

        grid.innerHTML = '';
        snapshot.forEach(doc => {
            const v = doc.data();
            const coverStyle = v.coverImage ? `background-image: url(${v.coverImage}); background-size:cover;` : `background-color: ${stringToColor(v.name)}`;

            grid.innerHTML += `
            <div class="venue-card" onclick="openVenueDetail('${doc.id}')" style="cursor:pointer;">
                <div class="venue-img" style="${coverStyle}"></div>
                <div class="venue-info">
                    <div class="venue-header-row">
                        <h3>${v.name}</h3>
                        <span class="venue-price">${v.price}€ /niño</span>
                    </div>
                    <p class="venue-desc">${v.description ? v.description.substring(0, 60) : ''}...</p>
                    <div class="venue-footer">
                        <span><i class="ph ph-users"></i> Cap: ${v.capacity}</span>
                        <button class="btn-view">Ver Detalles</button>
                    </div>
                </div>
            </div>
            `;
        });
    } catch (err) {
        console.error(err);
        grid.innerHTML = '<p style="text-align:center; color:red;">Error cargando locales</p>';
    }
}

// Venue Detail Modal
window.openVenueDetail = async (venueId) => {
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
    const servicesEl = document.getElementById('detail-services-list');
    servicesEl.innerHTML = '';
    if (v.services && v.services.length > 0) {
        v.services.forEach(s => {
            servicesEl.innerHTML += `
            <label>
                <input type="checkbox" onchange="calcTotal()" data-price="${s.price}">
                <span style="flex-grow:1;">${s.name}</span>
                <span style="font-weight:700;">+${s.price}€</span>
            </label>
            `;
        });
    } else {
        servicesEl.innerHTML = '<p style="color:#999;">Sin servicios extra</p>';
    }

    // Show View
    showView('venue-detail-view');
    // Hide nav for full immersion
    document.getElementById('main-nav').classList.add('hidden');

    // Setup Booking State
    window.currentVenueId = venueId;
    window.currentVenuePrice = v.price;
    window.currentVenueSchedule = {
        openDays: v.scheduleDays,
        timeSlots: v.timeSlots,
        blockedDates: v.blockedDates
    };

    document.getElementById('booking-kids').value = 10; // Reset default
    document.getElementById('booking-date').value = '';

    // Reset Time Select
    const timeSelect = document.getElementById('booking-time');
    timeSelect.innerHTML = '<option value="">Selecciona fecha primero...</option>';
    timeSelect.disabled = true;

    calcTotal();
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
        alert("Lo sentimos, esta fecha no está disponible.");
        dateInput.value = '';
        timeSelect.disabled = true;
        return;
    }

    // 2. Check Open Days (If config exists)
    if (schedule.openDays && schedule.openDays.length > 0 && !schedule.openDays.includes(dayOfWeek)) {
        alert("El local está cerrado este día de la semana.");
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
    if (!currentUser) return alert("Debes iniciar sesión para reservar");

    const kids = parseInt(document.getElementById('booking-kids').value);
    const date = document.getElementById('booking-date').value;
    const time = document.getElementById('booking-time').value;

    if (!kids || kids < 1) return alert("Indica un número válido de niños");
    if (!date) return alert("Selecciona una fecha para la fiesta");
    if (!time) return alert("Selecciona una hora de inicio");

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
            userName: document.getElementById('user-name-display').innerText,
            date: date,
            time: time,
            kids: kids,
            totalPrice: totalVal,
            services: selectedServices,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`¡Reserva Solicitada!\n\nLocal: ${venueName}\nFecha: ${date} a las ${time}\nTotal: ${totalStr}\n\nEl local confirmará tu solicitud pronto.`);
        showView('family-view');

    } catch (err) {
        console.error("Error booking:", err);
        alert("Hubo un error al guardar la reserva");
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
