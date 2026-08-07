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

function formatEasternTime(timestamp) {
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/New_York"
    }).format(new Date(timestamp));
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
    const progressGroup = document.createElement("div");
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
    progressGroup.className = "leaderboard__progress-group";
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
    progressGroup.append(progress);

    if (globalTotal > 0 && completed === globalTotal && Number.isFinite(Number(entry.finishedAt))) {
        const finishedAt = document.createElement("small");

        finishedAt.className = "leaderboard__finished-at";
        finishedAt.textContent = `Finished at ${formatEasternTime(Number(entry.finishedAt))}`;
        progressGroup.append(finishedAt);
    }

    row.append(nameGroup, progressGroup);
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
            finishedAt: Number(entry?.finishedAt),
            username: entry?.username || entryKey
        }))
        .sort((a, b) => {
            const completionDifference = b.completed - a.completed;

            if (completionDifference) {
                return completionDifference;
            }

            if (globalTotal > 0 && a.completed === globalTotal) {
                const aTime = Number.isFinite(a.finishedAt) ? a.finishedAt : Number.POSITIVE_INFINITY;
                const bTime = Number.isFinite(b.finishedAt) ? b.finishedAt : Number.POSITIVE_INFINITY;

                if (aTime !== bTime) {
                    return aTime - bTime;
                }
            }

            return a.username.localeCompare(b.username);
        });
    const rankingKey = entry => {
        if (globalTotal > 0 && entry.completed === globalTotal && Number.isFinite(entry.finishedAt)) {
            return `finished:${entry.finishedAt}`;
        }

        return `completed:${entry.completed}`;
    };
    const topRanks = [...new Set(
        sortedEntries.filter(entry => entry.completed > 0).map(rankingKey)
    )].slice(0, 3);
    const leaderboardRows = sortedEntries.map(entry =>
        createLeaderboardRow(
            entry.entryKey,
            entry.entry,
            globalTotal,
            topRanks.indexOf(rankingKey(entry)) + 1
        )
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
