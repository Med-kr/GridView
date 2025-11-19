const open = document.querySelector(".open-btn");
const overlay = document.querySelector(".overlay");
const close = document.querySelector(".close");
const cancel = document.querySelector(".btn-cancel");

open.onclick = () => overlay.style.display = "flex";
close.onclick = () => overlay.style.display = "none";
cancel.onclick = () => overlay.style.display = "none";

const input = document.querySelector("#photoInput");
const avatar = document.querySelector("#avatar");
const unassignedContainer = document.querySelector("list-n-attr");


input.addEventListener("input", () => {
    if (input.value.trim() !== "") {
        avatar.src = input.value;
        avatar.style.display = "block";
    } else {
        avatar.style.display = "none";
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const addExperienceBtn = document.querySelector('.add-experience-btn');
    const experienceList = document.getElementById('experience-list');
    let experienceCount = 0;

    addExperienceBtn.addEventListener('click', () => {
        const noExperienceDiv = experienceList.querySelector('.no-experience');
        if (noExperienceDiv) noExperienceDiv.remove();

        experienceCount++;
        const newExperienceDiv = document.createElement('div');
        newExperienceDiv.classList.add('experience-item');
        newExperienceDiv.innerHTML = `
            <div class="experience-detail" style="margin-bottom: 15px; padding: 15px; border: 1px solid #ccc; border-radius: 6px;">
                <p><strong>Expérience #${experienceCount}</strong></p>
                <div class="form-group">
                    <label for="company-${experienceCount}">Entreprise</label>
                    <input type="text" id="company-${experienceCount}" placeholder="Nom de l'entreprise">
                </div>
                <div class="form-group" style="margin-top: 10px;">
                    <label for="position-${experienceCount}">Poste</label>
                    <input type="text" id="position-${experienceCount}" placeholder="Intitulé du poste">
                </div>
                <button type="button" class="remove-experience-btn" style="float: right; margin-top: 10px; color: #e74c3c; background: none; border: none; cursor: pointer;">
                    ❌
                </button>
            </div>
        `;

        experienceList.appendChild(newExperienceDiv);

        newExperienceDiv.querySelector('.remove-experience-btn').addEventListener('click', () => {
            newExperienceDiv.remove();
            if (experienceList.children.length === 0) {
                const noExp = document.createElement('div');
                noExp.classList.add('no-experience');
                noExp.textContent = "Aucune expérience ajoutée";
                experienceList.appendChild(noExp);
            }
        });
    });
});

const unassignedList = document.getElementById('unassigned-list');
const form = document.querySelector('#employee-form');
function addEmployeeToUnassigned(employeeData) {
    const employeeDiv = document.createElement('div');
    employeeDiv.classList.add('unassigned-employee');
    employeeDiv.style.cursor = 'pointer';
    employeeDiv.style.border = '1px solid #ccc';
    employeeDiv.style.padding = '10px';
    employeeDiv.style.marginBottom = '5px';
    employeeDiv.style.borderRadius = '5px';
    employeeDiv.innerHTML = `
        <img src="${employeeData.photo || 'https://via.placeholder.com/50'}" alt="avatar" style="width:40px; height:40px; border-radius:50%; margin-right:10px;">
        <span class="employee-name">${employeeData.name}</span>
        <button class="edit-employee" style="float:right; margin-left:5px;">✏️</button>
        <button class="delete-employee" style="float:right; color:red; background:none; border:none; cursor:pointer;">❌</button>
    `;

    unassignedList.appendChild(employeeDiv);

    employeeDiv.querySelector('.delete-employee').addEventListener('click', (e) => {
        e.stopPropagation();
        employeeDiv.remove();
    });

    employeeDiv.querySelector('.edit-employee').addEventListener('click', (e) => {
        e.stopPropagation();
        openEmployeeForm(employeeData, employeeDiv);
    });

    employeeDiv.addEventListener('click', () => {
        openEmployeeForm(employeeData, employeeDiv);
    });
}

function openEmployeeForm(employeeData, employeeDiv) {
    overlay.style.display = 'flex';
    input.value = employeeData.photo || '';
    avatar.src = employeeData.photo || '';
    avatar.style.display = employeeData.photo ? 'block' : 'none';
    document.querySelector('#employeeName').value = employeeData.name || '';

    const saveBtn = document.querySelector('#saveEmployee');
    saveBtn.onclick = (event) => {
        event.preventDefault();
        employeeData.name = document.querySelector('#employeeName').value;
        employeeData.photo = input.value;
        employeeDiv.querySelector('.employee-name').textContent = employeeData.name;
        employeeDiv.querySelector('img').src = employeeData.photo || 'https://via.placeholder.com/50';
        overlay.style.display = 'none';
    };
}

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const newEmployee = {
        name: document.querySelector('#employeeName').value,
        photo: input.value,
        experiences: []
    };

    addEmployeeToUnassigned(newEmployee);

    form.reset();
    avatar.style.display = 'none';
    overlay.style.display = 'none';
});
