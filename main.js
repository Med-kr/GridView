/***************************** VARIABLES GLOBALES ET DONNÉES *****************************/
const STORAGE_KEY = 'employeeManagementData';
const DEFAULT_PHOTO_URL = 'images/default-avatar.webp'; // Assurez-vous d'avoir une image à ce chemin

let employees = [];
let nextEmployeeId = 1;
let currentEmployeeIdToEdit = null;

/***************************** RÈGLES MÉTIER *****************************/
const ZONE_RESTRICTIONS = {
    "Réception": ["Réceptionniste", "Manager"],
    "Salle des serveurs": ["Technicien IT", "Manager"],
    "Salle de sécurité": ["Agent de sécurité", "Manager"],
    "Salle de conférence": ["Manager", "Réceptionniste", "Technicien IT", "Agent de sécurité", "Nettoyage", "Autre"],
    "Salle du personnel": ["Manager", "Réceptionniste", "Technicien IT", "Agent de sécurité", "Nettoyage", "Autre"],
    "Salle d'archives": ["Manager", "Réceptionniste", "Technicien IT", "Agent de sécurité", "Autre"]
};

const ZONE_CAPACITIES = {};

/***************************** SÉLECTEURS DU DOM (récupérés dans init pour s'assurer que DOM est prêt *****************************/

let overlay, profileOverlay, closeModalBtn, cancelBtn, closeProfileBtn, employeeForm,
    openModalBtn, unassignedList, floorPlan, photoInput, avatarPreview,
    addExperienceBtn, experienceList, saveEmployeeBtn, searchInput, modalTitle;


/***************************** UTILITAIRES DE DONNÉES *****************************/


function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        try {
            const parsedData = JSON.parse(data);
            employees = parsedData.employees || [];
            const maxId = employees.reduce((max, e) => (e.id > max ? e.id : max), 0);
            nextEmployeeId = Math.max(maxId + 1, parsedData.nextEmployeeId || 1);
        } catch (err) {
            console.warn("Erreur en lisant le localStorage, chargement des démos.", err);
            employees = createDemoEmployees();
            nextEmployeeId = employees.length + 1;
        }
    } else {
        employees = createDemoEmployees();
        nextEmployeeId = employees.length + 1;
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        employees: employees,
        nextEmployeeId: nextEmployeeId
    }));
}

function createDemoEmployees() {
    return [
        { id: 1, name: "Alice Durand", role: "Réceptionniste", photo: "https://randomuser.me/api/portraits/women/1.jpg", email: "alice.durand@corp.com", phone: "0610203040", experiences: [], location: null },
        { id: 2, name: "Bob Martin", role: "Technicien IT", photo: "https://randomuser.me/api/portraits/men/2.jpg", email: "bob.martin@corp.com", phone: "0620304050", experiences: [], location: "Salle des serveurs" },
        { id: 3, name: "Charles Petit", role: "Manager", photo: "https://randomuser.me/api/portraits/men/3.jpg", email: "charles.petit@corp.com", phone: "0630405060", experiences: [], location: null },
        { id: 4, name: "Diane Lemaire", role: "Agent de sécurité", photo: "https://randomuser.me/api/portraits/women/4.jpg", email: "diane.lemaire@corp.com", phone: "0640506070", experiences: [], location: "Salle de sécurité" },
        { id: 5, name: "Eric Fournier", role: "Nettoyage", photo: "https://randomuser.me/api/portraits/men/5.jpg", email: "eric.fournier@corp.com", phone: "0650607080", experiences: [], location: null },
        { id: 6, name: "Fanny Leroy", role: "Autre", photo: "https://randomuser.me/api/portraits/women/6.jpg", email: "fanny.leroy@corp.com", phone: "0660708090", experiences: [], location: "Salle de conférence" }
    ];
}

/***************************** RENDU (Affichage) *****************************/

function renderUnassignedList(filter = '') {
    unassignedList.innerHTML = '';
    const unassignedStaff = employees.filter(e => e.location === null);

    const filteredStaff = unassignedStaff.filter(e => {
        const searchLower = filter.toLowerCase();
        return e.name.toLowerCase().includes(searchLower) || e.role.toLowerCase().includes(searchLower);
    });

    if (filteredStaff.length === 0) {
        unassignedList.innerHTML = `<p class="no-experience">Aucun employé non assigné${filter ? ' correspondant au filtre' : ''}.</p>`;
        return;
    }

    filteredStaff.forEach(employee => {
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.id = `employee-${employee.id}`;
        card.setAttribute('draggable', true);
        card.dataset.id = employee.id;
        card.innerHTML = `
            <img src="${employee.photo || DEFAULT_PHOTO_URL}" alt="${employee.name}">
            <p><strong>${employee.name}</strong></p>
            <p>${employee.role}</p>
            <div class="card-actions">
              <button class="edit-btn" data-id="${employee.id}">Modifier</button>
              <button class="delete-btn" data-id="${employee.id}">Supprimer</button>
            </div>
        `;
        unassignedList.appendChild(card);
    });

    setupUnassignedCardEvents();
}

function renderFloorPlan() {
    document.querySelectorAll('.P-etage section').forEach(section => {
        const zoneName = section.dataset.zone;
        const zonePeopleContainer = section.querySelector('.zone-people');
        zonePeopleContainer.innerHTML = '';

        let currentCount = 0;

        const zoneEmployees = employees.filter(e => e.location === zoneName);

        zoneEmployees.forEach(employee => {
            currentCount++;
            const employeeDiv = document.createElement('div');
            employeeDiv.className = 'zone-employee';
            employeeDiv.dataset.id = employee.id;
            employeeDiv.setAttribute('draggable', true);
            employeeDiv.innerHTML = `
                <img src="${employee.photo || DEFAULT_PHOTO_URL}" alt="${employee.name}">
                <span>${employee.name} (${employee.role})</span>
                <button class="remove" data-id="${employee.id}" title="Retirer">×</button>
            `;
            zonePeopleContainer.appendChild(employeeDiv);
        });

        updateZoneVisualState(section, currentCount);
    });

    setupZoneEvents();
}


function updateZoneVisualState(section, count) {
    const zoneName = section.dataset.zone;
    section.classList.remove('zone-alert');
    section.classList.remove('zone-full');

    if (count === 0 && zoneName !== "Salle de conférence" && zoneName !== "Salle du personnel") {
        section.classList.add('zone-alert');
    }
}

function showProfile(employee) {
    const profileContent = document.getElementById('profileContent');
    const experiencesHtml = employee.experiences && employee.experiences.length > 0
        ? employee.experiences.map(exp => `
            <li>
                <strong>${exp.poste}</strong> chez ${exp.entreprise}
                <p class="date">${exp.debut} - ${exp.fin || 'En cours'}</p>
            </li>
        `).join('')
        : '<p>Aucune expérience professionnelle enregistrée.</p>';

    profileContent.innerHTML = `
        <img src="${employee.photo || DEFAULT_PHOTO_URL}" alt="${employee.name}">
        <h2>${employee.name}</h2>
        <p><strong>Rôle:</strong> ${employee.role}</p>
        <p><strong>Email:</strong> ${employee.email}</p>
        <p><strong>Téléphone:</strong> ${employee.phone}</p>
        <p><strong>Localisation:</strong> ${employee.location || 'Non assigné'}</p>
        <hr>
        <h3>Historique d'expériences</h3>
        <ul>${experiencesHtml}</ul>
    `;
    profileOverlay.classList.remove('hidden');
}

/***************************** GESTION DES EXPÉRIENCES DANS LA MODALE *****************************/

function addExperienceField(experience = {}) {
    const index = experienceList.querySelectorAll('.experience-item').length;

    const noExpMessage = experienceList.querySelector('.no-experience');
    if (noExpMessage) noExpMessage.remove();

    const expDiv = document.createElement('div');
    expDiv.className = 'experience-item';
    expDiv.innerHTML = `
        <fieldset class="experience-group" data-index="${index}">
            <legend>Expérience n°${index + 1} <button type="button" class="remove-experience-btn" data-index="${index}">×</button></legend>
            <label for="poste-${index}">Poste</label>
            <input id="poste-${index}" name="experience[${index}][poste]" type="text" value="${experience.poste || ''}" required>
            
            <label for="entreprise-${index}">Entreprise</label>
            <input id="entreprise-${index}" name="experience[${index}][entreprise]" type="text" value="${experience.entreprise || ''}" required>
            
            <label for="debut-${index}">Date de début</label>
            <input id="debut-${index}" name="experience[${index}][debut]" type="date" value="${experience.debut || ''}" required>
            
            <label for="fin-${index}">Date de fin</label>
            <input id="fin-${index}" name="experience[${index}][fin]" type="date" value="${experience.fin || ''}">
        </fieldset>
    `;
    experienceList.appendChild(expDiv);

    expDiv.querySelector('.remove-experience-btn').addEventListener('click', (e) => removeExperienceField(e.target));
}

function removeExperienceField(removeButton) {
    const expItem = removeButton.closest('.experience-item');
    if (expItem) {
        expItem.remove();
        if (experienceList.children.length === 0) {
            experienceList.innerHTML = `<div class="no-experience">Aucune expérience ajoutée</div>`;
        }
        updateExperienceTitles();
    }
}

function updateExperienceTitles() {
    experienceList.querySelectorAll('.experience-group').forEach((fieldset, index) => {
        const legend = fieldset.querySelector('legend');
        legend.innerHTML = `Expérience n°${index + 1} <button type="button" class="remove-experience-btn" data-index="${index}">×</button>`;
        const removeBtn = legend.querySelector('.remove-experience-btn');
        removeBtn.addEventListener('click', (e) => removeExperienceField(e.target));
        fieldset.dataset.index = index;
        ['poste', 'entreprise', 'debut', 'fin'].forEach(field => {
            const input = fieldset.querySelector(`[id^="${field}-"]`);
            if (input) {
                input.id = `${field}-${index}`;
                input.name = `experience[${index}][${field}]`;
            }
        });
    });
}

/***************************** VALIDATION DU FORMULAIRE *****************************/

function validateExperienceDates(experiences) {
    for (const exp of experiences) {
        if (exp.debut && exp.fin && new Date(exp.debut) > new Date(exp.fin)) {
            alert(`Erreur de validation : La date de début doit être antérieure à la date de fin pour le poste ${exp.poste}.`);
            return false;
        }
    }
    return true;
}

function validateFieldWithRegex(value, regex) {
    return regex.test(value);
}

/***************************** REGEX *****************************/
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]{2,100}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const PHONE_REGEX = /^(?:0|\+33|\+41|\+32)\s?(?:\d{1,2}\s?){4,5}\d{1}$/;

const URL_REGEX = /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|svg|gifv)(\?.*)?$/i;

function validateForm() {
    if (!employeeForm.checkValidity()) {
        employeeForm.reportValidity();
        return false;
    }

    const nameInput = document.getElementById('employeeName');
    const emailInput = document.getElementById('employeeEmail');
    const phoneInput = document.getElementById('employeePhone');
    const photoInputEl = document.getElementById('photoInput');

    if (!validateFieldWithRegex(nameInput.value, NAME_REGEX)) {
        alert('Erreur de validation : Nom complet invalide (au moins 2 lettres).');
        nameInput.focus();
        return false;
    }
    if (!validateFieldWithRegex(emailInput.value, EMAIL_REGEX)) {
        alert('Erreur de validation : Email invalide (ex: nom.prenom@domaine.com).');
        emailInput.focus();
        return false;
    }
    if (!validateFieldWithRegex(phoneInput.value, PHONE_REGEX)) {
        alert('Erreur de validation : Numéro de téléphone invalide (format standard attendu).');
        phoneInput.focus();
        return false;
    }
    if (photoInputEl.value && !validateFieldWithRegex(photoInputEl.value, URL_REGEX)) {
        alert('Erreur de validation : URL de la photo invalide. Doit être une URL se terminant par une extension d\'image.');
        photoInputEl.focus();
        return false;
    }

    const experiences = getExperiencesFromForm();
    if (!validateExperienceDates(experiences)) {
        return false;
    }

    return true;
}

function getExperiencesFromForm() {
    const experienceGroups = experienceList.querySelectorAll('.experience-group');
    const experiences = [];
    experienceGroups.forEach(group => {
        const index = group.dataset.index;
        const poste = document.getElementById(`poste-${index}`).value;
        const entreprise = document.getElementById(`entreprise-${index}`).value;
        const debut = document.getElementById(`debut-${index}`).value;
        const fin = document.getElementById(`fin-${index}`).value;
        experiences.push({ poste, entreprise, debut, fin });
    });
    return experiences;
}

/***************************** MODALE D'AJOUT/MODIFICATION D'EMPLOYÉ *****************************/

function openModal(employee = null) {
    employeeForm.reset();
    experienceList.innerHTML = `<div class="no-experience">Aucune expérience ajoutée</div>`;
    avatarPreview.style.display = 'none';
    avatarPreview.src = '';
    currentEmployeeIdToEdit = employee ? employee.id : null;

    if (employee) {
        modalTitle.textContent = 'Modifier l’employé';
        saveEmployeeBtn.textContent = 'Sauvegarder les modifications';
        document.getElementById('employeeName').value = employee.name;
        document.getElementById('employeeRole').value = employee.role;
        document.getElementById('photoInput').value = employee.photo === DEFAULT_PHOTO_URL ? '' : employee.photo || '';
        document.getElementById('employeeEmail').value = employee.email;
        document.getElementById('employeePhone').value = employee.phone;

        const photoUrl = employee.photo === DEFAULT_PHOTO_URL ? '' : employee.photo;
        if (photoUrl) {
            avatarPreview.src = photoUrl;
            avatarPreview.style.display = 'block';
        }

        if (employee.experiences && employee.experiences.length > 0) {
            employee.experiences.forEach(exp => addExperienceField(exp));
        }

    } else {
        modalTitle.textContent = 'Ajouter un nouvel employé';
        saveEmployeeBtn.textContent = 'Ajouter l’employé';
    }

    overlay.classList.remove('hidden');
}

function closeModal() {
    overlay.classList.add('hidden');
    currentEmployeeIdToEdit = null;
    employeeForm.reset();
}

function handleEmployeeSubmit(event) {
    event.preventDefault();

    if (!validateForm()) return;

    const experiences = getExperiencesFromForm();
    const photoUrl = document.getElementById('photoInput').value.trim();

    const employeeData = {
        name: document.getElementById('employeeName').value.trim(),
        role: document.getElementById('employeeRole').value,
        photo: photoUrl || DEFAULT_PHOTO_URL,
        email: document.getElementById('employeeEmail').value.trim(),
        phone: document.getElementById('employeePhone').value.trim(),
        experiences: experiences
    };

    if (currentEmployeeIdToEdit !== null) {
        const index = employees.findIndex(e => e.id === currentEmployeeIdToEdit);
        if (index !== -1) {
            employees[index] = { ...employees[index], ...employeeData };
        }
    } else {
        employeeData.id = nextEmployeeId++;
        employeeData.location = null;
        employees.push(employeeData);
    }

    saveData();
    renderAll();
    closeModal();
}

/***************************** RÈGLES D'AFFECTATION ET GESTION DES EMPLOYÉS *****************************/

function isAssignmentValid(role, zone) {
    if (role === "Manager") return true;
    if (role === "Nettoyage" && zone === "Salle d'archives") return false;

    if (zone === "Réception" && role !== "Réceptionniste") return false;
    if (zone === "Salle des serveurs" && role !== "Technicien IT") return false;
    if (zone === "Salle de sécurité" && role !== "Agent de sécurité") return false;

    return true;
}

function assignEmployee(employeeId, zoneName) {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    if (!isAssignmentValid(employee.role, zoneName)) {
        alert(`Le rôle "${employee.role}" n'est pas autorisé dans la zone "${zoneName}".`);
        return;
    }

    if (employee.location && employee.location !== zoneName) {
        unassignEmployee(employee.id);
    }

    employee.location = zoneName;
    saveData();
    renderAll();
}

function unassignEmployee(employeeId) {
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
        employee.location = null;
        saveData();
        renderAll();
    }
}

function deleteEmployee(employeeId) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet employé définitivement ?")) {
        employees = employees.filter(e => e.id !== employeeId);
        saveData();
        renderAll();
    }
}

/***************************** DRAG & DROP (implémentation par délégation d'événements, robuste) *****************************/

let draggedEmployeeId = null;

function setupDragAndDropDelegation() {
    document.addEventListener('dragstart', (e) => {
        const card = e.target.closest('.employee-card, .zone-employee');
        if (!card) return;
        draggedEmployeeId = parseInt(card.dataset.id, 10);
        try {
            e.dataTransfer.setData('text/plain', String(draggedEmployeeId));
        } catch (err) {
        }
        card.classList.add('dragging');
    });


    document.addEventListener('dragend', () => {
        document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
        document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
        draggedEmployeeId = null;
    });

    document.addEventListener('dragover', (e) => {
        const dropZone = e.target.closest('.P-etage section, #unassigned-list');
        if (dropZone && draggedEmployeeId) {
            e.preventDefault();
            dropZone.classList.add('drop-target');
        }
    });

    document.addEventListener('dragleave', (e) => {
        const dropZone = e.target.closest('.P-etage section, #unassigned-list');
        if (dropZone) dropZone.classList.remove('drop-target');
    });

    document.addEventListener('drop', (e) => {
        const dropZone = e.target.closest('.P-etage section, #unassigned-list');
        if (!dropZone) return;
        e.preventDefault();
        dropZone.classList.remove('drop-target');

        if (!draggedEmployeeId) return;
        const employeeId = draggedEmployeeId;

        if (dropZone.id === 'unassigned-list') {
            unassignEmployee(employeeId);
        } else {
            const zoneName = dropZone.dataset.zone;
            if (zoneName) assignEmployee(employeeId, zoneName);
        }
    });
}

/***************************** RÉORGANISATION AUTOMATIQUE DES EMPLOYÉS *****************************/

function autoReorganize() {
    if (!confirm("Voulez-vous lancer la réorganisation automatique des employés non assignés ?")) return;

    const unassigned = employees.filter(e => e.location === null);
    const zones = Object.keys(ZONE_CAPACITIES);

    employees.forEach(e => e.location = null);

    unassigned.forEach(employee => {
        const potentialZones = zones.filter(zoneName => isAssignmentValid(employee.role, zoneName));
        if (potentialZones.length > 0) {
            const randomZone = potentialZones[Math.floor(Math.random() * potentialZones.length)];
            employee.location = randomZone;
        }
    });

    saveData();
    renderAll();
}

/***************************** ÉVÉNEMENTS GLOBALISÉS ET INITIALISATION *****************************/

function setupGlobalEvents() {
    openModalBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    employeeForm.addEventListener('submit', handleEmployeeSubmit);

    photoInput.addEventListener('input', () => {
        const url = photoInput.value;
        if (url) {
            avatarPreview.src = url;
            avatarPreview.style.display = 'block';
        } else {
            avatarPreview.style.display = 'none';
        }
    });

    addExperienceBtn.addEventListener('click', () => addExperienceField());

    closeProfileBtn.addEventListener('click', () => profileOverlay.classList.add('hidden'));

    searchInput.addEventListener('input', (e) => {
        renderUnassignedList(e.target.value);
    });

    let autoReorganizeBtn = document.querySelector('.btn-auto-reorganize');
    if (!autoReorganizeBtn) {
        autoReorganizeBtn = document.createElement('button');
        autoReorganizeBtn.textContent = 'Réorganisation Auto';
        autoReorganizeBtn.className = 'btn-auto-reorganize';
        autoReorganizeBtn.style.cssText = 'background: #2c2c2cff; color: white; padding: 8px 15px; border: none; border-radius: 8px; cursor: pointer; margin-left: 20px; transition: background 0.3s;';
        autoReorganizeBtn.addEventListener('click', autoReorganize);
        const footer = document.querySelector('footer');
        if (footer) footer.appendChild(autoReorganizeBtn);
    }
}

function setupUnassignedCardEvents() {
    document.querySelectorAll('.employee-card').forEach(card => {
        const employeeId = parseInt(card.dataset.id, 10);
        const employee = employees.find(e => e.id === employeeId);

        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                showProfile(employee);
            }
        });

        const editBtn = card.querySelector('.edit-btn');
        const delBtn = card.querySelector('.delete-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openModal(employee);
            });
        }
        if (delBtn) {
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteEmployee(employeeId);
            });
        }
    });
}

function setupZoneEvents() {
    document.querySelectorAll('.P-etage section').forEach(section => {
        const zoneName = section.dataset.zone;
        const assignBtn = section.querySelector('.assign-btn');
        if (assignBtn) assignBtn.onclick = () => showAssignSelection(zoneName);

        section.querySelectorAll('.zone-employee button.remove').forEach(removeBtn => {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const employeeId = parseInt(removeBtn.dataset.id, 10);
                unassignEmployee(employeeId);
            });
        });

        section.querySelectorAll('.zone-employee').forEach(employeeDiv => {
            const employeeId = parseInt(employeeDiv.dataset.id, 10);
            const employee = employees.find(e => e.id === employeeId);
            employeeDiv.addEventListener('click', (e) => {
                if (!e.target.closest('button.remove')) {
                    showProfile(employee);
                }
            });
        });
    });
}

function showAssignSelection(zoneName) {
    const unassignedEligible = employees.filter(e =>
        e.location === null && isAssignmentValid(e.role, zoneName)
    );

    if (unassignedEligible.length === 0) {
        alert(`Aucun employé non assigné n'est éligible pour la zone "${zoneName}".`);
        return;
    }

    const selectionText = unassignedEligible.map(e => `${e.id}: ${e.name} (${e.role})`).join('\n');
    const selectedId = prompt(`Sélectionnez l'ID de l'employé à assigner à "${zoneName}":\n\n${selectionText}`);

    const employeeId = parseInt(selectedId, 10);
    if (employeeId && unassignedEligible.some(e => e.id === employeeId)) {
        assignEmployee(employeeId, zoneName);
    } else if (selectedId) {
        alert("Sélection invalide ou employé non éligible.");
    }
}

/***************************** INITIALISATION *****************************/

function renderAll() {
    renderUnassignedList(searchInput.value);
    renderFloorPlan();
}

function init() {
    overlay = document.getElementById('overlay');
    profileOverlay = document.getElementById('profileOverlay');
    closeModalBtn = document.getElementById('closeModal');
    cancelBtn = document.getElementById('cancelBtn');
    closeProfileBtn = document.getElementById('closeProfile');
    employeeForm = document.getElementById('employee-form');
    openModalBtn = document.querySelector('.open-btn');
    unassignedList = document.getElementById('unassigned-list');
    floorPlan = document.getElementById('floorPlan');
    photoInput = document.getElementById('photoInput');
    avatarPreview = document.getElementById('avatar');
    addExperienceBtn = document.getElementById('addExperienceBtn');
    experienceList = document.getElementById('experience-list');
    saveEmployeeBtn = document.getElementById('saveEmployee');
    searchInput = document.getElementById('recherche');
    modalTitle = document.getElementById('modal-title');

    document.querySelectorAll('.P-etage section').forEach(section => {
        const zone = section.dataset.zone;
        const cap = parseInt(section.dataset.capacity, 10);
        if (!isNaN(cap)) ZONE_CAPACITIES[zone] = cap;
    });

    loadData();
    setupGlobalEvents();
    setupDragAndDropDelegation();
    renderAll();
    console.log("Application initialisée.");
}

document.addEventListener('DOMContentLoaded', init);

/***************************** FIN DU PROJECT  الحمد لله *****************************/
