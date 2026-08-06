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
const menuLoading = document.querySelector("#menu-loading");
const signOutMenuItem = document.querySelector("#sign-out-menu-item");
const signOutButton = document.querySelector("#sign-out");
const rememberedUsername = localStorage.getItem("bucketlistUsername");

function setVisible(element, isVisible) {
    element.classList.toggle("bucketlist-hidden", !isVisible);
    element.setAttribute("aria-hidden", String(!isVisible));
}

function finishLoading() {
    setVisible(pageLoading, false);
    setVisible(menuLoading, false);
    setVisible(
        signOutMenuItem,
        Boolean(rememberedUsername && /^[a-z0-9_-]{3,24}$/.test(rememberedUsername))
    );
}

signOutButton.addEventListener("click", event => {
    event.preventDefault();
    localStorage.removeItem("bucketlistUsername");
    setVisible(signOutMenuItem, false);
});

function completionPercentage(entry = {}, globalTotal = 0) {
    const completed = Number(entry.completed) || 0;

    return globalTotal > 0
        ? Math.max(0, Math.min(100, Math.round((completed / globalTotal) * 100)))
        : 0;
}

function createLeaderboardRow(entryKey, entry, globalTotal) {
    const username = entry.username || entryKey;
    const percentage = completionPercentage(entry, globalTotal);
    const row = document.createElement("div");
    const name = document.createElement("strong");
    const progress = document.createElement("div");
    const fill = document.createElement("div");
    const value = document.createElement("span");

    row.className = "leaderboard__row";
    name.className = "leaderboard__username";
    name.textContent = username;
    progress.className = "leaderboard__progress";
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-label", `${name.textContent}'s bucket-list completion`);
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", "100");
    progress.setAttribute("aria-valuenow", String(percentage));
    fill.className = "leaderboard__fill";
    fill.style.width = `${percentage}%`;
    value.className = "leaderboard__value";
    value.textContent = `${percentage}%`;
    progress.append(fill, value);
    row.append(name, progress);
    return { row, percentage, username };
}

function renderLeaderboard(leaderboard = {}) {
    const globalTotal = Number(leaderboard.total) || 0;
    const entries = leaderboard.users || {};
    const leaderboardRows = Object.entries(entries)
        .map(([entryKey, entry]) => createLeaderboardRow(entryKey, entry || {}, globalTotal))
        .sort((a, b) => b.percentage - a.percentage || a.username.localeCompare(b.username));

    rows.replaceChildren(...leaderboardRows.map(entry => entry.row));
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
