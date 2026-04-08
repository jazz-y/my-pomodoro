import { initPlanListeners, clearPlan, appendPeriodRow } from "./timer-setup.js";

const timerNameEl = document.getElementById("cur-timer-name");
const timerMinutesEl = document.getElementById("timer-minutes");
const timerSecondsEl = document.getElementById("timer-seconds");
const timerImageEl = document.getElementById("timer-image");
const planRequiredToastEl = document.getElementById("plan-required-toast");
const notificationIssueToastEl = document.getElementById("notification-issue-toast");
const notificationIssueToastBodyEl = document.getElementById("notification-issue-toast-body");
const playPauseButton = document.getElementById("play-pause-btn");
const skipBackwardButton = document.getElementById("skip-backward-btn");
const skipForwardButton = document.getElementById("skip-forward-btn");
const resetButton = document.getElementById("reset-btn");
const timerControlButtons = [playPauseButton, skipBackwardButton, skipForwardButton, resetButton].filter(Boolean);

const PLAY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 16 16"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393"/></svg>`;
const PAUSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 16 16"><path d="M5.5 3.5A.5.5 0 0 1 6 4v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5m4 0A.5.5 0 0 1 10 4v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5"/></svg>`;

const timerState = {
    periods: [],
    currentIndex: 0,
    isRunning: false,
    remainingMs: 0,
    endTime: null,
    tickId: null,
    nextOnTaskNotificationAt: null,
    canNotifyThisRun: false,
    dogImageRequestToken: 0
};

const browserNotificationsSupported = typeof window.Notification !== "undefined";

const formatTypeName = (type) => {
    const safeType = type || "timer";
    return safeType.charAt(0).toUpperCase() + safeType.slice(1);
};

const getCurrentPeriod = () => timerState.periods[timerState.currentIndex];

const getPeriodDurationMs = (period) => {
    const minutes = Number(period?.minutes);
    const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 1;
    return safeMinutes * 60 * 1000;
};

const getPeriodDisplayName = (period) => {
    const trimmedName = period?.name?.trim();
    if (trimmedName) {
        return trimmedName;
    }

    return formatTypeName(period?.type);
};

const getOnTaskNotificationIntervalMs = (period) => {
    if (!period?.onTaskNotifications) {
        return null;
    }

    const intervalMinutes = Number(period.notificationIntervalMinutes);
    if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
        return null;
    }

    return intervalMinutes * 60 * 1000;
};

const showNotificationIssueToast = (message) => {
    if (!notificationIssueToastEl) {
        return;
    }

    if (notificationIssueToastBodyEl) {
        notificationIssueToastBodyEl.textContent = message;
    }

    const bootstrapApi = window.bootstrap;
    const toast = bootstrapApi?.Toast?.getOrCreateInstance(notificationIssueToastEl, {
        autohide: true,
        delay: 3000
    });

    if (toast) {
        toast.show();
        return;
    }

    notificationIssueToastEl.classList.add("show");
    window.setTimeout(() => {
        notificationIssueToastEl.classList.remove("show");
    }, 3000);
};

const hasGrantedBrowserNotificationPermission = () => {
    return browserNotificationsSupported && window.isSecureContext && window.Notification.permission === "granted";
};

const refreshNotificationCapabilityForCurrentPeriod = () => {
    const period = getCurrentPeriod();
    const intervalMs = getOnTaskNotificationIntervalMs(period);
    timerState.canNotifyThisRun = Boolean(intervalMs) && hasGrantedBrowserNotificationPermission();
};

const ensureNotificationPermission = async () => {
    if (!browserNotificationsSupported) {
        showNotificationIssueToast("This browser does not support notifications.");
        return false;
    }

    if (!window.isSecureContext) {
        showNotificationIssueToast("Notifications require HTTPS or localhost.");
        return false;
    }

    if (window.Notification.permission === "granted") {
        return true;
    }

    if (window.Notification.permission === "denied") {
        showNotificationIssueToast("Notifications are blocked. Allow notifications in browser settings.");
        return false;
    }

    try {
        const permission = await window.Notification.requestPermission();
        if (permission === "granted") {
            return true;
        }

        showNotificationIssueToast("Notification permission was not granted.");
        return false;
    } catch {
        showNotificationIssueToast("Could not request notification permission.");
        return false;
    }
};

const scheduleOnTaskNotifications = (baseTime = Date.now()) => {
    const currentPeriod = getCurrentPeriod();
    const intervalMs = getOnTaskNotificationIntervalMs(currentPeriod);

    if (!timerState.isRunning || !intervalMs || !timerState.canNotifyThisRun) {
        timerState.nextOnTaskNotificationAt = null;
        return;
    }

    timerState.nextOnTaskNotificationAt = baseTime + intervalMs;
};

const maybeSendOnTaskNotification = (now) => {
    const currentPeriod = getCurrentPeriod();
    const intervalMs = getOnTaskNotificationIntervalMs(currentPeriod);

    if (!timerState.isRunning || !intervalMs || !timerState.canNotifyThisRun) {
        timerState.nextOnTaskNotificationAt = null;
        return;
    }

    if (timerState.nextOnTaskNotificationAt === null) {
        timerState.nextOnTaskNotificationAt = now + intervalMs;
        return;
    }

    if (now < timerState.nextOnTaskNotificationAt) {
        return;
    }

    if (browserNotificationsSupported && window.Notification.permission === "granted") {
        try {
            new window.Notification("On-task reminder", {
                body: "Stay on task; your fuzzy friend wants you to!"
            });
        } catch {
            showNotificationIssueToast("Failed to show browser notification.");
        }
    }

    timerState.nextOnTaskNotificationAt = now + intervalMs;
};

const notifyPlanRequired = () => {
    if (!planRequiredToastEl) {
        return;
    }

    const bootstrapApi = window.bootstrap;
    const toast = bootstrapApi?.Toast?.getOrCreateInstance(planRequiredToastEl, {
        autohide: true,
        delay: 2000
    });

    if (toast) {
        toast.show();
        return;
    }

    planRequiredToastEl.classList.add("show");
    window.setTimeout(() => {
        planRequiredToastEl.classList.remove("show");
    }, 2000);
};

const fetchDogImageForCurrentPeriod = async () => {
    if (!timerImageEl || !getCurrentPeriod()) {
        return;
    }

    timerState.dogImageRequestToken += 1;
    const requestToken = timerState.dogImageRequestToken;

    try {
        const response = await fetch("https://dog.ceo/api/breeds/image/random", {
            method: "GET",
            cache: "no-store"
        });

        if (!response.ok) {
            return;
        }

        const payload = await response.json();
        const dogImageUrl = payload?.message;
        const isSuccess = payload?.status === "success";

        if (!isSuccess || typeof dogImageUrl !== "string" || !dogImageUrl) {
            return;
        }

        if (requestToken !== timerState.dogImageRequestToken) {
            return;
        }

        timerImageEl.src = dogImageUrl;
    } catch {
        alert("Failed to fetch dog image for inspo :(");
    }
};

const hasPlanOrNotify = () => {
    if (timerState.periods.length) {
        return true;
    }

    notifyPlanRequired();
    return false;
};

const updateTimerControlsAvailability = () => {
    const hasPlan = timerState.periods.length > 0;

    timerControlButtons.forEach((button) => {
        button.classList.toggle("timer-control-disabled", !hasPlan);
        button.setAttribute("aria-disabled", String(!hasPlan));
    });
};

const updatePlayPauseButton = () => {
    if (!playPauseButton) {
        return;
    }

    if (timerState.isRunning) {
        playPauseButton.classList.remove("btn-warning");
        playPauseButton.classList.add("btn-success");
        playPauseButton.setAttribute("aria-label", "Pause timer");
        playPauseButton.innerHTML = PAUSE_ICON;
        return;
    }

    playPauseButton.classList.remove("btn-warning");
    playPauseButton.classList.add("btn-success");
    playPauseButton.setAttribute("aria-label", "Start timer");
    playPauseButton.innerHTML = PLAY_ICON;
};

const renderTimer = () => {
    const totalSeconds = Math.max(0, Math.ceil(timerState.remainingMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (timerMinutesEl) {
        timerMinutesEl.textContent = String(minutes);
    }

    if (timerSecondsEl) {
        timerSecondsEl.textContent = String(seconds).padStart(2, "0");
    }

    const currentPeriod = getCurrentPeriod();
    if (timerNameEl) {
        timerNameEl.textContent = currentPeriod ? getPeriodDisplayName(currentPeriod) : "Timer";
    }

    updateTimerControlsAvailability();
    updatePlayPauseButton();
};

const stopTicking = () => {
    if (timerState.tickId !== null) {
        window.clearInterval(timerState.tickId);
        timerState.tickId = null;
    }
};

const moveToPeriod = (periodIndex) => {
    timerState.currentIndex = periodIndex;
    const period = getCurrentPeriod();
    timerState.remainingMs = period ? getPeriodDurationMs(period) : 0;
    timerState.endTime = null;
    timerState.nextOnTaskNotificationAt = null;
    renderTimer();

    if (period) {
        void fetchDogImageForCurrentPeriod();
    }
};

const handlePeriodEnd = () => {
    const nextIndex = timerState.currentIndex + 1;
    if (nextIndex >= timerState.periods.length) {
        timerState.isRunning = false;
        timerState.remainingMs = 0;
        timerState.endTime = null;
        timerState.nextOnTaskNotificationAt = null;
        stopTicking();
        renderTimer();
        return;
    }

    moveToPeriod(nextIndex);

    if (timerState.isRunning) {
        timerState.endTime = Date.now() + timerState.remainingMs;
        refreshNotificationCapabilityForCurrentPeriod();
        scheduleOnTaskNotifications();
    }
};

const updateFromClock = () => {
    if (!timerState.isRunning || !timerState.endTime) {
        return;
    }

    const now = Date.now();
    timerState.remainingMs = Math.max(0, timerState.endTime - now);

    if (timerState.remainingMs > 0) {
        maybeSendOnTaskNotification(now);
    }

    renderTimer();

    if (timerState.remainingMs <= 0) {
        handlePeriodEnd();
    }
};

const startTimer = async () => {
    if (!hasPlanOrNotify()) {
        return;
    }

    const currentPeriod = getCurrentPeriod();
    if (getOnTaskNotificationIntervalMs(currentPeriod)) {
        await ensureNotificationPermission();
    }

    if (timerState.remainingMs <= 0) {
        moveToPeriod(timerState.currentIndex);
    }

    timerState.isRunning = true;
    timerState.endTime = Date.now() + timerState.remainingMs;
    refreshNotificationCapabilityForCurrentPeriod();
    scheduleOnTaskNotifications();

    if (timerState.tickId === null) {
        timerState.tickId = window.setInterval(updateFromClock, 250);
    }

    renderTimer();
};

const pauseTimer = () => {
    if (!timerState.isRunning) {
        return;
    }

    timerState.remainingMs = Math.max(0, (timerState.endTime || Date.now()) - Date.now());
    timerState.isRunning = false;
    timerState.endTime = null;
    timerState.nextOnTaskNotificationAt = null;
    timerState.canNotifyThisRun = false;
    stopTicking();
    renderTimer();
};

const resetCurrentPeriod = () => {
    if (!hasPlanOrNotify()) {
        return;
    }

    moveToPeriod(timerState.currentIndex);

    if (timerState.isRunning) {
        timerState.endTime = Date.now() + timerState.remainingMs;
        refreshNotificationCapabilityForCurrentPeriod();
        scheduleOnTaskNotifications();
    }
};

const setRunningForCurrentPeriod = (shouldRun) => {
    timerState.isRunning = shouldRun;

    if (shouldRun) {
        timerState.endTime = Date.now() + timerState.remainingMs;
        refreshNotificationCapabilityForCurrentPeriod();
        scheduleOnTaskNotifications();
        if (timerState.tickId === null) {
            timerState.tickId = window.setInterval(updateFromClock, 250);
        }
        return;
    }

    timerState.endTime = null;
    timerState.nextOnTaskNotificationAt = null;
    timerState.canNotifyThisRun = false;
    stopTicking();
};

const skipBackward = () => {
    if (!hasPlanOrNotify()) {
        return;
    }

    const nextIndex = Math.max(0, timerState.currentIndex - 1);
    const shouldRun = timerState.isRunning;
    moveToPeriod(nextIndex);
    setRunningForCurrentPeriod(shouldRun);
    renderTimer();
};

const skipForward = () => {
    if (!hasPlanOrNotify()) {
        return;
    }

    const nextIndex = timerState.currentIndex + 1;
    if (nextIndex >= timerState.periods.length) {
        timerState.isRunning = false;
        timerState.remainingMs = 0;
        timerState.endTime = null;
        timerState.nextOnTaskNotificationAt = null;
        timerState.canNotifyThisRun = false;
        stopTicking();
        renderTimer();
        return;
    }

    const shouldRun = timerState.isRunning;
    moveToPeriod(nextIndex);
    setRunningForCurrentPeriod(shouldRun);
    renderTimer();
};

const togglePlayPause = () => {
    if (timerState.isRunning) {
        pauseTimer();
        return;
    }

    void startTimer();
};

const applyPeriods = (periods) => {
    const validPeriods = (periods || []).filter((period) => {
        const minutes = Number(period?.minutes);
        return Number.isFinite(minutes) && minutes > 0;
    });

    timerState.periods = validPeriods;
    timerState.currentIndex = 0;
    timerState.isRunning = false;
    timerState.endTime = null;
    timerState.nextOnTaskNotificationAt = null;
    timerState.canNotifyThisRun = false;
    stopTicking();

    if (validPeriods.length) {
        moveToPeriod(0);
    } else {
        timerState.remainingMs = 0;
        if (timerImageEl) {
            timerImageEl.src = "";
        }
        renderTimer();
    }
};

const initTimerControls = () => {
    playPauseButton?.addEventListener("click", togglePlayPause);
    skipBackwardButton?.addEventListener("click", skipBackward);
    skipForwardButton?.addEventListener("click", skipForward);
    resetButton?.addEventListener("click", resetCurrentPeriod);

    window.addEventListener("pomodoro-plan-saved", (event) => {
        applyPeriods(event.detail?.periods || []);
    });

    renderTimer();
};

const pageSetup = () => {
    clearPlan();
    appendPeriodRow();
    initPlanListeners();
    initTimerControls();
};

document.addEventListener("DOMContentLoaded", pageSetup);