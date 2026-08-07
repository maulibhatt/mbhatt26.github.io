import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
    getDatabase,
    ref,
    get,
    onValue,
    push,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCtB6Ke-4liWRY57Pxnti8czQtqvQ-s5U4",
    authDomain: "bucketlistparty.firebaseapp.com",
    databaseURL: "https://bucketlistparty-default-rtdb.firebaseio.com/",
    projectId: "bucketlistparty",
    storageBucket: "bucketlistparty.firebasestorage.app",
    messagingSenderId: "926366020196",
    appId: "1:926366020196:web:ba88f49b377ced57d26571"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const itemsRef = ref(database, "twentynine/items");
const form = document.querySelector("#twentynine-form");
const input = document.querySelector("#twentynine-entry");
const submitButton = form.querySelector("button[type='submit']");
const list = document.querySelector("#twentynine-list");
const status = document.querySelector("#twentynine-status");
const username = localStorage.getItem("bucketlistUsername");
let canSubmit = false;

function setFormEnabled(isEnabled) {
    canSubmit = isEnabled;
    input.disabled = !isEnabled;
    submitButton.disabled = !isEnabled;
}

function createListItem(entry = {}) {
    const item = document.createElement("li");
    const text = document.createElement("p");
    const attribution = document.createElement("small");

    text.textContent = entry.text || "";
    attribution.textContent = `— ${entry.username || "unknown"}`;
    item.append(text, attribution);
    return item;
}

setFormEnabled(false);

if (username && /^[a-z0-9_-]{3,24}$/.test(username)) {
    get(ref(database, `users/${username}`))
        .then(snapshot => {
            if (!snapshot.exists()) {
                throw new Error("That profile no longer exists.");
            }

            setFormEnabled(true);
            status.textContent = "";
        })
        .catch(error => {
            console.error("Unable to verify profile:", error);
            status.innerHTML = 'Return to the <a href="bucketlist.html">bucket list</a> and select your profile first.';
        });
} else {
    status.innerHTML = 'Return to the <a href="bucketlist.html">bucket list</a> and select your profile before adding an item.';
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!canSubmit) {
        return;
    }

    const text = input.value.trim();

    if (!text) {
        status.textContent = "A blank bucket list item can't be added.";
        input.focus();
        return;
    }

    submitButton.disabled = true;
    status.textContent = "";
    let holdButton = false;

    try {
        await push(itemsRef, {
            createdAt: serverTimestamp(),
            text,
            username
        });
        input.value = "";
        input.focus();
        holdButton = true;
        submitButton.textContent = "Added";
        window.setTimeout(() => {
            submitButton.textContent = "Add";
            submitButton.disabled = !canSubmit;
        }, 2000);
    } catch (error) {
        console.error("Unable to add before-30 item:", error);
        status.textContent = error?.message?.toLowerCase().includes("permission denied")
            ? "Firebase denied this entry. Publish the rules for the before-30 list."
            : error.message || "Unable to add that item.";
    } finally {
        if (!holdButton) {
            submitButton.disabled = false;
        }
    }
});

onValue(itemsRef,
    snapshot => {
        const entries = Object.values(snapshot.val() || {})
            .sort((a, b) => (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0));

        list.replaceChildren(...entries.map(createListItem));

        if (!entries.length && !status.textContent) {
            status.textContent = "No ideas yet—be the first to add one!";
        }
    },
    error => {
        console.error("Unable to load before-30 list:", error);
        status.textContent = "Unable to load Mauli's bucket list.";
    }
);
