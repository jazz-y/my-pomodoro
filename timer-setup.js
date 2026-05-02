export const clearPlan = () => {
    const plan = document.getElementById("plan-content");

    if (plan) 
        if (plan.children.length > 0) {
            Array.from(plan.children).forEach(child => child.remove());
        }
};

const syncRemoveButtonsState = (planContent) => {
    const rows = Array.from(planContent.querySelectorAll(".timer-period-row"));
    const shouldDisable = rows.length <= 1;

    rows.forEach((row) => {
        const removeButton = row.querySelector(".remove-period-button");
        if (removeButton) {
            removeButton.disabled = false;
            removeButton.classList.toggle("remove-period-button-disabled", shouldDisable);
            removeButton.setAttribute("aria-disabled", String(shouldDisable));
        }
    });
};

const notifyMinimumOneTimerRequired = () => {
    const toastElement = document.getElementById("minimum-period-toast");
    if (!toastElement) {
        return;
    }

    const bootstrapApi = window.bootstrap;
    const toast = bootstrapApi?.Toast?.getOrCreateInstance(toastElement, {
        autohide: true,
        delay: 2000
    });

    if (toast) {
        toast.show();
        return;
    }

    toastElement.classList.add("show");
    window.setTimeout(() => {
        toastElement.classList.remove("show");
    }, 2000);
};

export const appendPeriodRow = () => {
    const planContent = document.getElementById("plan-content");
    if (!planContent) {
        return;
    }

    const row = addPeriodRowTemplate();
    const removeButton = row.querySelector(".remove-period-button");
    removeButton?.addEventListener("click", () => {
        const rows = planContent.querySelectorAll(".timer-period-row");
        if (rows.length <= 1) {
            notifyMinimumOneTimerRequired();
            return;
        }

        row.remove();
        syncRemoveButtonsState(planContent);
    });

    planContent.appendChild(row);
    syncRemoveButtonsState(planContent);
};


export const addPeriodRowTemplate = () => {

    const row = document.createElement("div");
    row.classList.add("row", "g-2", "align-items-end", "timer-period-row", "mb-2", "border", "gap-0", "mx-0", "p-2");

    const typeCol = document.createElement("div");
    typeCol.classList.add("col-md-2");

    const typeLabel = document.createElement("label");
    typeLabel.classList.add("form-label");
    typeLabel.innerText = "Type";

    const typeInput = document.createElement("select");
    typeInput.classList.add("form-select", "timer-type-input");
    typeInput.required = true;

    const workOption = document.createElement("option");
    workOption.value = "work";
    workOption.innerText = "Work";

    const breakOption = document.createElement("option");
    breakOption.value = "break";
    breakOption.innerText = "Break";

    typeInput.appendChild(workOption);
    typeInput.appendChild(breakOption);
    typeCol.appendChild(typeLabel);
    typeCol.appendChild(typeInput);

    const nameCol = document.createElement("div");
    nameCol.classList.add("col-md-4");

    const nameLabel = document.createElement("label");
    nameLabel.classList.add("form-label");
    nameLabel.innerText = "Name";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Study time, focus, ...";
    nameInput.classList.add("form-control", "timer-name-input");

    nameCol.appendChild(nameLabel);
    nameCol.appendChild(nameInput);

    const timeCol = document.createElement("div");
    timeCol.classList.add("col-md-3");

    const timeLabel = document.createElement("label");
    timeLabel.classList.add("form-label");
    timeLabel.innerText = "Minutes";

    const timeInput = document.createElement("input");
    timeInput.type = "number";
    timeInput.min = "1";
    timeInput.step = "1";
    timeInput.placeholder = "25";
    timeInput.classList.add("form-control", "timer-time-input");
    timeInput.required = true;

    timeCol.appendChild(timeLabel);
    timeCol.appendChild(timeInput);

    const removeCol = document.createElement("div");
    removeCol.classList.add("col-md-3");

    const controlsWrap = document.createElement("div");
    controlsWrap.classList.add("d-flex", "gap-2");

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.classList.add("btn", "btn-outline-danger", "remove-period-button");
    removeButton.setAttribute("aria-label", "Remove period");

    removeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16"> <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"></path> </svg>`;

    const settingsToggleButton = document.createElement("button");
    settingsToggleButton.type = "button";
    settingsToggleButton.classList.add("btn", "btn-outline-secondary", "period-settings-toggle-button");
    settingsToggleButton.setAttribute("aria-label", "Toggle period settings");
    settingsToggleButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 2.5a.5.5 0 0 1 .5.5v4.5H13a.5.5 0 0 1 0 1H8.5V13a.5.5 0 0 1-1 0V8.5H3a.5.5 0 0 1 0-1h4.5V3a.5.5 0 0 1 .5-.5"/></svg>`;

    controlsWrap.appendChild(removeButton);
    controlsWrap.appendChild(settingsToggleButton);
    removeCol.appendChild(controlsWrap);

    const settingsCol = document.createElement("div");
    settingsCol.classList.add("col-12", "d-none", "p-2", "period-settings-container");

    const settingsRow = document.createElement("div");
    settingsRow.classList.add("row", "g-2", "align-items-end", "pt-2", "border-top", "mt-1");

    const notifyCol = document.createElement("div");
    notifyCol.classList.add("col-md-6");

    const notifySwitchWrap = document.createElement("div");
    notifySwitchWrap.classList.add("form-check", "form-switch", "mb-0");

    const notifyInput = document.createElement("input");
    notifyInput.type = "checkbox";
    notifyInput.classList.add("form-check-input", "timer-notify-input");

    const notifyLabel = document.createElement("label");
    notifyLabel.classList.add("form-check-label", "ms-1");
    notifyLabel.innerText = "On-task notifications";

    notifySwitchWrap.appendChild(notifyInput);
    notifySwitchWrap.appendChild(notifyLabel);
    notifyCol.appendChild(notifySwitchWrap);

    const intervalCol = document.createElement("div");
    intervalCol.classList.add("col-md-6");

    const intervalLabel = document.createElement("label");
    intervalLabel.classList.add("form-label");
    intervalLabel.innerText = "Notification Interval (min)";

    const intervalInput = document.createElement("input");
    intervalInput.type = "number";
    intervalInput.min = "1";
    intervalInput.step = "1";
    intervalInput.placeholder = "10";
    intervalInput.classList.add("form-control", "timer-notify-interval-input");
    intervalInput.disabled = true;

    const syncNotificationFieldsState = () => {
        const isSettingsOpen = !settingsCol.classList.contains("d-none");
        const isNotifyEnabled = notifyInput.checked;

        notifyInput.disabled = !isSettingsOpen;
        intervalInput.disabled = !isSettingsOpen || !isNotifyEnabled;
        intervalInput.required = isSettingsOpen && isNotifyEnabled;

        if (!isNotifyEnabled) {
            intervalInput.value = "";
        }
    };

    notifyInput.addEventListener("change", () => {
        syncNotificationFieldsState();
    });

    let settingsOpen = false;
    settingsToggleButton.addEventListener("click", () => {
        settingsOpen = !settingsOpen;
        settingsCol.classList.toggle("d-none", !settingsOpen);
        settingsToggleButton.innerHTML = settingsOpen
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-lg" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 2.5a.5.5 0 0 1 .5.5v4.5H13a.5.5 0 0 1 0 1H8.5V13a.5.5 0 0 1-1 0V8.5H3a.5.5 0 0 1 0-1h4.5V3a.5.5 0 0 1 .5-.5"/></svg>`;

        syncNotificationFieldsState();
    });

    syncNotificationFieldsState();

    intervalCol.appendChild(intervalLabel);
    intervalCol.appendChild(intervalInput);

    settingsRow.appendChild(notifyCol);
    settingsRow.appendChild(intervalCol);
    settingsCol.appendChild(settingsRow);

    

    row.appendChild(typeCol);
    row.appendChild(nameCol);
    row.appendChild(timeCol);
    row.appendChild(removeCol);
    row.appendChild(settingsCol);

    return row;
};

const serializePeriodsFromForm = (form) => {
    const rows = Array.from(form.querySelectorAll(".timer-period-row"));

    return rows.map((row, index) => {
        const type = row.querySelector(".timer-type-input")?.value || "work";
        const name = row.querySelector(".timer-name-input")?.value.trim() || "";
        const minutesValue = row.querySelector(".timer-time-input")?.value || "0";
        const onTaskNotifications = row.querySelector(".timer-notify-input")?.checked || false;
        const notificationIntervalValue = row.querySelector(".timer-notify-interval-input")?.value || "0";

        return {
            order: index + 1,
            type,
            name,
            minutes: Number(minutesValue),
            onTaskNotifications,
            notificationIntervalMinutes: onTaskNotifications ? Number(notificationIntervalValue) : null
        };
    });
};

const showPlanSavedNotice = () => {
    const toastElement = document.getElementById("plan-save-toast");
    if (!toastElement) {
        return;
    }

    const bootstrapApi = window.bootstrap;
    const toast = bootstrapApi?.Toast?.getOrCreateInstance(toastElement, {
        autohide: true,
        delay: 1800
    });

    if (toast) {
        toast.show();
        return;
    }

    toastElement.classList.add("show");
    window.setTimeout(() => {
        toastElement.classList.remove("show");
    }, 1800);
};

export const initPlanListeners = () => {
    const addButton = document.getElementById("add-period-btn");

    addButton?.addEventListener("click", () => {
        appendPeriodRow();
    });

    const form = document.getElementById("plan-form");
    form?.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const periods = serializePeriodsFromForm(form);
        window.pomodoroPeriods = periods;
        window.dispatchEvent(new CustomEvent("pomodoro-plan-saved", { detail: { periods } }));
        showPlanSavedNotice();
        console.log("Pomodoro periods:", periods);
    });
};