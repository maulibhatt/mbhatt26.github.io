import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { confetti } from "https://cdn.jsdelivr.net/npm/@tsparticles/confetti@4.3.2/+esm";

import {
    getDatabase,
    ref,
    get,
    set,
    update,
    onValue,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

// Your web app's Firebase configuration
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

const usernameForm = document.querySelector("#username-form");
const usernameInput = document.querySelector("#username");
const usernameError = document.querySelector("#username-error");
const selectionSection = document.querySelector("#profile-selection");
const profileSection = document.querySelector("#bucketlist-profile");
const profileHeading = document.querySelector("#profile-heading");
const signOutMenuItem = document.querySelector("#sign-out-menu-item");
const signOutButton = document.querySelector("#sign-out");
const completionButtons = document.querySelectorAll("[data-completion-toggle]");
const hiddenClass = "bucketlist-hidden";

function setVisible(element, isVisible) {
    element.classList.toggle(hiddenClass, !isVisible);
    element.setAttribute("aria-hidden", String(!isVisible));
}

function normalizeUsername(value) {
    return value.trim().toLowerCase();
}

function isValidUsername(username) {
    return /^[a-z0-9_-]{3,24}$/.test(username);
}

async function selectProfile(rawUsername) {
    const username = normalizeUsername(rawUsername);

    if (!isValidUsername(username)) {
        throw new Error(
            "Use 3-24 letters, numbers, underscores, or hyphens."
        );
    }

    const profileRef = ref(database, `users/${username}`);
    const snapshot = await get(profileRef);

    if (!snapshot.exists()) {
        await set(profileRef, {
            displayName: rawUsername.trim(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            bucketList: {}
        });
    }

    localStorage.setItem("bucketlistUsername", username);
    showProfile(username);
}

function showProfile(username) {
    setVisible(selectionSection, false);
    setVisible(profileSection, true);
    setVisible(signOutMenuItem, true);
    profileHeading.textContent = `${username}'s bucket list`;

    watchProfile(username);
}

function showSignIn() {
    setVisible(profileSection, false);
    setVisible(selectionSection, true);
    setVisible(signOutMenuItem, false);
    usernameInput.focus();
}

function watchProfile(username) {
    const profileRef = ref(database, `users/${username}`);

    onValue(profileRef, snapshot => {
        const profile = snapshot.val();

        if (!profile) {
            localStorage.removeItem("bucketlistUsername");
            showSignIn();
            return;
        }

        renderBucketList(profile.bucketList ?? {});
    });
}

function renderBucketList(bucketList) {
    completionButtons.forEach(button => {
        const itemId = button.dataset.completionToggle;
        const isCompleted = bucketList[itemId]?.completed === true;

        button.dataset.completed = String(isCompleted);
        button.classList.toggle("primary", !isCompleted);
        button.textContent = isCompleted ? "Completed" : "Complete";
        button.setAttribute("aria-pressed", String(isCompleted));
    });
}

function celebrateCompletion(button) {
    const bounds = button.getBoundingClientRect();
    const origin = {
        x: (bounds.left + bounds.width / 2) / window.innerWidth,
        y: (bounds.top + bounds.height / 2) / window.innerHeight
    };

    void confetti({
        particleCount: 90,
        spread: 75,
        startVelocity: 38,
        origin,
        colors: ["#ff33ad", "#1cd9d6", "#ffffff", "#ffd166"],
        disableForReducedMotion: true,
        zIndex: 10000
    });
}

async function updateItem(username, itemId, changes) {
    const itemRef = ref(
        database,
        `users/${username}/bucketList/${itemId}`
    );

    await update(itemRef, changes);

    await update(ref(database, `users/${username}`), {
        updatedAt: serverTimestamp()
    });
}

usernameForm.addEventListener("submit", async event => {
    event.preventDefault();
    usernameError.textContent = "";

    try {
        await selectProfile(usernameInput.value);
    } catch (error) {
        console.error(error);
        usernameError.textContent = error?.message?.toLowerCase().includes("permission denied")
            ? "Firebase denied access. Publish the Realtime Database rules for username profiles."
            : error.message || "Unable to load that profile.";
    }
});

signOutButton.addEventListener("click", event => {
    event.preventDefault();
    localStorage.removeItem("bucketlistUsername");
    location.reload();
});

completionButtons.forEach(button => {
    button.addEventListener("click", async () => {
        const username = localStorage.getItem("bucketlistUsername");

        if (!username) {
            showSignIn();
            return;
        }

        const itemId = button.dataset.completionToggle;
        const isCompleted = button.dataset.completed === "true";
        button.disabled = true;

        try {
            await updateItem(username, itemId, {
                completed: !isCompleted
            });

            if (!isCompleted) {
                celebrateCompletion(button);
            }
        } catch (error) {
            console.error(`Unable to update ${itemId}:`, error);
        } finally {
            button.disabled = false;
        }
    });
});

const rememberedUsername =
    localStorage.getItem("bucketlistUsername");

if (rememberedUsername && isValidUsername(rememberedUsername)) {
    showProfile(rememberedUsername);
} else {
    localStorage.removeItem("bucketlistUsername");
    showSignIn();
}

// Make this available to ordinary page scripts and button handlers.
window.updateBucketListItem = (itemId, changes) => {
    const username =
        localStorage.getItem("bucketlistUsername");

    if (!username) {
        throw new Error("No profile is selected.");
    }

    return updateItem(username, itemId, changes);
};
