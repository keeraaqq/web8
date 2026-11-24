"use strict";

const FORM_URL = "https://formcarry.com/s/OgN8UPJy25M";
const STORAGE_KEY = "feedbackFormValues";
const FORM_HASH = "#feedback";
const FIELD_NAMES = ["fio", "email", "phone", "organization", "message", "consent"];

function readStorage() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (ignore) {
        return {};
    }
}

function writeStorage(values) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
        return true;
    } catch (ignore) {
        return false;
    }
}

function clearStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (ignore) {
        return false;
    }
}

function init() {
    const popup = document.getElementById("popup");
    const openButton = document.getElementById("open-button");
    const closeButton = document.getElementById("close-button");
    const sendButton = document.getElementById("send-button");
    const form = document.getElementById("feedback-form");
    const statusBox = document.getElementById("status");
    let lastFocused = null;

    function showStatus(type, text) {
        statusBox.textContent = text;
        statusBox.className = "status " + type;
        statusBox.hidden = text === "";
    }

    function saveValues() {
        const values = {};
        FIELD_NAMES.forEach(function (name) {
            const field = form.elements[name];
            if (field.type === "checkbox") {
                values[name] = field.checked;
            } else {
                values[name] = field.value;
            }
        });
        writeStorage(values);
    }

    function restoreValues() {
        const values = readStorage();
        FIELD_NAMES.forEach(function (name) {
            const field = form.elements[name];
            if (values[name] === undefined) {
                return;
            }
            if (field.type === "checkbox") {
                field.checked = values[name] === true;
            } else {
                field.value = String(values[name]);
            }
        });
    }

    function showPopup() {
        if (!popup.hidden) {
            return;
        }
        lastFocused = document.activeElement;
        showStatus("", "");
        popup.hidden = false;
        document.body.classList.add("no-scroll");
        form.elements.fio.focus();
    }

    function hidePopup() {
        if (popup.hidden) {
            return;
        }
        popup.hidden = true;
        document.body.classList.remove("no-scroll");
        if (lastFocused) {
            lastFocused.focus();
        }
    }

    function openForm() {
        if (location.hash !== FORM_HASH) {
            history.pushState({form: true}, "", FORM_HASH);
        }
        showPopup();
    }

    function closeForm() {
        if (history.state && history.state.form) {
            history.back();
        } else {
            history.replaceState(null, "", location.pathname + location.search);
            hidePopup();
        }
    }

    async function sendForm(event) {
        event.preventDefault();
        sendButton.disabled = true;
        showStatus("info", "Отправка…");

        const data = {
            name: form.elements.fio.value.trim(),
            email: form.elements.email.value.trim(),
            phone: form.elements.phone.value.trim(),
            organization: form.elements.organization.value.trim(),
            message: form.elements.message.value.trim()
        };

        try {
            const response = await fetch(FORM_URL, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (response.ok && result.status === "success") {
                form.reset();
                clearStorage();
                showStatus("success", "Спасибо! Ваше сообщение успешно отправлено.");
            } else {
                showStatus(
                    "error",
                    "Не удалось отправить сообщение: " +
                            (result.message || "ошибка сервера") + "."
                );
            }
        } catch (ignore) {
            showStatus("error", "Ошибка сети. Проверьте подключение и попробуйте ещё раз.");
        }
        sendButton.disabled = false;
    }

    openButton.addEventListener("click", openForm);
    closeButton.addEventListener("click", closeForm);
    form.addEventListener("submit", sendForm);
    form.addEventListener("input", saveValues);
    form.addEventListener("change", saveValues);

    popup.addEventListener("click", function (event) {
        if (event.target === popup) {
            closeForm();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !popup.hidden) {
            closeForm();
        }
    });

    window.addEventListener("popstate", function () {
        if (location.hash === FORM_HASH) {
            showPopup();
        } else {
            hidePopup();
        }
    });

    restoreValues();

    if (location.hash === FORM_HASH) {
        showPopup();
    }
}

document.addEventListener("DOMContentLoaded", init);
