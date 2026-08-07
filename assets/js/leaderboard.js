import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getDatabase, onValue, ref } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

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
const rows = document.querySelector("#leaderboard-rows");
const status = document.querySelector("#leaderboard-status");
const pageLoading = document.querySelector("#leaderboard-loading");
const signOutMenuItem = document.querySelector("#sign-out-menu-item");
const signOutButton = document.querySelector("#sign-out");
let rememberedUsername = localStorage.getItem("bucketlistUsername");

function setVisible(element, isVisible) {
    element.classList.toggle("bucketlist-hidden", !isVisible);
    element.setAttribute("aria-hidden", String(!isVisible));
}

function finishLoading() {
    setVisible(pageLoading, false);
    setVisible(
        signOutMenuItem,
        Boolean(rememberedUsername && /^[a-z0-9_-]{3,24}$/.test(rememberedUsername))
    );
}

signOutButton.addEventListener("click", event => {
    event.preventDefault();
    localStorage.removeItem("bucketlistUsername");
    rememberedUsername = null;
    setVisible(signOutMenuItem, false);
    document.querySelector(".leaderboard__current-user")?.remove();
});

function completedCount(entry = {}) {
    return Math.max(0, Math.floor(Number(entry.completed) || 0));
}

function createLeaderboardRow(entryKey, entry, globalTotal, rank) {
    const username = entry.username || entryKey;
    const isCurrentUser = entryKey === rememberedUsername;
    const completed = completedCount(entry);
    const percentage = globalTotal > 0
        ? Math.min(100, Math.round((completed / globalTotal) * 100))
        : 0;
    const row = document.createElement("div");
    const nameGroup = document.createElement("div");
    const name = document.createElement("strong");
    const progress = document.createElement("div");
    const fill = document.createElement("div");
    const value = document.createElement("span");

    row.className = "leaderboard__row";
    nameGroup.className = "leaderboard__entrant";
    name.className = "leaderboard__username";
    name.textContent = username;
    nameGroup.append(name);

    if (isCurrentUser) {
        const currentUserLabel = document.createElement("span");

        currentUserLabel.className = "leaderboard__current-user";
        currentUserLabel.textContent = "You";
        nameGroup.append(currentUserLabel);
    }

    if (rank) {
        const badge = document.createElement("span");
        const ordinal = ["1st", "2nd", "3rd"][rank - 1];

        badge.className = `leaderboard__badge leaderboard__badge--${rank}`;
        badge.textContent = ordinal;
        badge.setAttribute("aria-label", `${ordinal} place`);
        nameGroup.append(badge);
    }

    progress.className = "leaderboard__progress";
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-label", `${name.textContent}'s bucket-list completion`);
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", String(globalTotal));
    progress.setAttribute("aria-valuenow", String(completed));
    fill.className = "leaderboard__fill";
    fill.style.width = `${percentage}%`;
    value.className = "leaderboard__value";
    value.textContent = `${completed} ${completed === 1 ? "item" : "items"} completed`;
    progress.append(fill, value);
    row.append(nameGroup, progress);
    return row;
}

function renderLeaderboard(leaderboard = {}) {
    const globalTotal = Number(leaderboard.total) || 0;
    const entries = leaderboard.users || {};
    const sortedEntries = Object.entries(entries)
        .map(([entryKey, entry]) => ({
            entryKey,
            entry: entry || {},
            completed: completedCount(entry),
            username: entry?.username || entryKey
        }))
        .sort((a, b) => b.completed - a.completed || a.username.localeCompare(b.username));
    const topScores = [...new Set(
        sortedEntries.map(entry => entry.completed).filter(completed => completed > 0)
    )].slice(0, 3);
    const leaderboardRows = sortedEntries.map(({ entryKey, entry, completed }) =>
        createLeaderboardRow(entryKey, entry, globalTotal, topScores.indexOf(completed) + 1)
    );

    rows.replaceChildren(...leaderboardRows);
    finishLoading();
    status.textContent = leaderboardRows.length ? "" : "No users have joined yet.";
    setVisible(status, !leaderboardRows.length);
}

onValue(ref(database, "leaderboard"),
    snapshot => renderLeaderboard(snapshot.val() || {}),
    error => {
        console.error("Unable to load leaderboard:", error);
        finishLoading();
        status.textContent = "Unable to load the leaderboard. Check the Firebase leaderboard rules.";
        setVisible(status, true);
    }
);
