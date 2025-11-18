const open = document.querySelector(".open-btn");
const overlay = document.querySelector(".overlay");
const close = document.querySelector(".close");
const cancel = document.querySelector(".btn-cancel");

open.onclick = () => overlay.style.display = "flex";
close.onclick = () => overlay.style.display = "none";
cancel.onclick = () => overlay.style.display = "none";

const input = document.querySelector("#photoInput");
const avatar = document.querySelector("#avatar");

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
