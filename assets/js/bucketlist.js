import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { confetti } from "https://cdn.jsdelivr.net/npm/@tsparticles/confetti@4.3.2/+esm";

import {
    getDatabase,
    ref,
    get,
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

// Configure the shared destination used by every bucket-list upload button.
const bucketListUploadUrl = "https://www.dropbox.com/request/ul861omysg6dci2ntvlv";

const usernameForm = document.querySelector("#username-form");
const usernameInput = document.querySelector("#username");
const usernameError = document.querySelector("#username-error");
const pageLoading = document.querySelector("#bucketlist-loading");
const selectionSection = document.querySelector("#profile-selection");
const profileSection = document.querySelector("#bucketlist-profile");
const profileHeading = document.querySelector("#profile-heading");
const signOutMenuItem = document.querySelector("#sign-out-menu-item");
const signOutButton = document.querySelector("#sign-out");
const friendUsernameInput = document.querySelector("#new-friend-username");
const friendUsernameError = document.querySelector("#new-friend-error");
const bucketListCards = document.querySelectorAll(".bucketlist-card");
const completionButtons = document.querySelectorAll("[data-completion-toggle]");
const requiredInputs = document.querySelectorAll("[data-required-input]");
const uploadLinks = document.querySelectorAll("[data-upload-link]");
const completionGateLinks = document.querySelectorAll("[data-completion-gate]");
const bucketListItemIds = Array.from(completionButtons, button => button.dataset.completionToggle);
const hiddenClass = "bucketlist-hidden";
let activeBucketList = {};

function toggleCompletedCard(card) {
    if (card.dataset.completed !== "true") {
        return;
    }

    const isExpanded = card.classList.toggle("is-expanded");
    card.setAttribute("aria-expanded", String(isExpanded));
}

bucketListCards.forEach(card => {
    card.addEventListener("click", event => {
        if (event.target.closest("button, a, input, textarea, select, label")) {
            return;
        }

        toggleCompletedCard(card);
    });

    card.addEventListener("keydown", event => {
        if (event.target !== card || (event.key !== "Enter" && event.key !== " ")) {
            return;
        }

        event.preventDefault();
        toggleCompletedCard(card);
    });
});

completionGateLinks.forEach(link => {
    link.addEventListener("click", () => {
        const completionError = link.closest(".bucketlist-card")?.querySelector("[data-completion-error]");

        if (completionError) {
            completionError.textContent = "";
        }
    });
});

uploadLinks.forEach(link => {
    if (bucketListUploadUrl) {
        link.href = bucketListUploadUrl;
    } else {
        link.setAttribute("aria-disabled", "true");
    }

    link.addEventListener("click", async event => {
        if (!bucketListUploadUrl) {
            event.preventDefault();
            return;
        }

        const itemId = link.dataset.uploadCompletes;

        if (!itemId || activeBucketList[itemId]?.completed === true || link.dataset.saving === "true") {
            return;
        }

        const uploadError = link.closest(".bucketlist-card")?.querySelector("[data-upload-error]");

        if (uploadError) {
            uploadError.textContent = "";
        }

        const username = localStorage.getItem("bucketlistUsername");

        if (!username) {
            event.preventDefault();
            showSignIn();
            return;
        }

        link.dataset.saving = "true";

        try {
            await updateItem(username, itemId, { completed: true });
            celebrateCompletion(link);
        } catch (error) {
            console.error(`Unable to complete ${itemId} after upload:`, error);
        } finally {
            delete link.dataset.saving;
        }
    });
});

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

function setLoading(isLoading) {
    setVisible(pageLoading, isLoading);
}

function leaderboardRecord(username, bucketList = {}) {
    const completed = bucketListItemIds.filter(
        itemId => bucketList[itemId]?.completed === true
    ).length;

    return {
        username,
        completed,
        updatedAt: serverTimestamp()
    };
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
    let profile = snapshot.val();

    if (!snapshot.exists()) {
        profile = {
            displayName: rawUsername.trim(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            bucketList: {}
        };

        await update(ref(database), {
            [`users/${username}`]: profile,
            [`leaderboard/users/${username}`]: leaderboardRecord(username, profile.bucketList)
        });
    } else {
        // Adds existing users to the separate leaderboard the next time they sign in.
        await update(
            ref(database, `leaderboard/users/${username}`),
            leaderboardRecord(username, profile.bucketList)
        );
    }

    localStorage.setItem("bucketlistUsername", username);
    showProfile(username);
}

function showProfile(username) {
    setLoading(false);
    setVisible(selectionSection, false);
    setVisible(profileSection, true);
    setVisible(signOutMenuItem, true);
    profileHeading.textContent = `${username}'s bucket list`;

    watchProfile(username);
}

function showSignIn() {
    setLoading(false);
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
    activeBucketList = bucketList;

    if (document.activeElement !== friendUsernameInput) {
        friendUsernameInput.value = bucketList["make-new-friend"]?.friendUsername || "";
    }

    requiredInputs.forEach(input => {
        const itemId = input.dataset.requiredInput;
        const isCompleted = bucketList[itemId]?.completed === true;

        if (document.activeElement !== input) {
            input.value = bucketList[itemId]?.notes || "";
        }

        input.disabled = isCompleted;
    });

    completionButtons.forEach(button => {
        const itemId = button.dataset.completionToggle;
        const isCompleted = bucketList[itemId]?.completed === true;
        const wasInitialized = button.dataset.initialized === "true";
        const wasCompleted = button.dataset.completed === "true";
        const card = button.closest(".bucketlist-card");

        button.dataset.completed = String(isCompleted);
        button.dataset.initialized = "true";
        button.classList.toggle("is-completed", isCompleted);
        button.setAttribute("aria-checked", String(isCompleted));

        if (card) {
            card.dataset.completed = String(isCompleted);
            card.classList.toggle("is-completed", isCompleted);
            card.tabIndex = isCompleted ? 0 : -1;

            if (!isCompleted || !wasInitialized || !wasCompleted) {
                card.classList.remove("is-expanded");
            }

            if (isCompleted) {
                card.setAttribute("aria-expanded", String(card.classList.contains("is-expanded")));
            } else {
                card.removeAttribute("aria-expanded");
            }
        }

        if (itemId === "make-new-friend") {
            friendUsernameInput.disabled = isCompleted;
        }
    });

    uploadLinks.forEach(link => {
        const itemId = link.dataset.uploadCompletes;
        const isCompleted = itemId && bucketList[itemId]?.completed === true;

        link.classList.toggle("primary", isCompleted);
        link.textContent = isCompleted ? "Upload More" : "Upload";

        if (isCompleted) {
            const uploadError = link.closest(".bucketlist-card")?.querySelector("[data-upload-error]");

            if (uploadError) {
                uploadError.textContent = "";
            }
        }
    });

    completionGateLinks.forEach(link => {
        const itemId = link.dataset.completionGate;
        const isCompleted = bucketList[itemId]?.completed === true;

        link.classList.toggle("primary", isCompleted);

        if (isCompleted) {
            const completionError = link.closest(".bucketlist-card")?.querySelector("[data-completion-error]");

            if (completionError) {
                completionError.textContent = "";
            }
        }
    });
}

async function validateFriendUsername(currentUsername) {
    const friendUsername = normalizeUsername(friendUsernameInput.value);

    if (!isValidUsername(friendUsername)) {
        throw new Error("Enter a valid username using 3-24 letters, numbers, underscores, or hyphens.");
    }

    if (friendUsername === currentUsername) {
        throw new Error("Your new friend must be someone other than you.");
    }

    const friendSnapshot = await get(ref(database, `users/${friendUsername}`));

    if (!friendSnapshot.exists()) {
        throw new Error("That user has not joined the bucket list yet.");
    }

    return friendUsername;
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

// Adapted from Alexander Sands' "Canvas Fireworks Explosion" CodePen.
function celebrateSparks() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const particles = [];
    const burstTimes = [0, 250, 600, 950, 1350, 1800, 2350, 3000, 3700];
    const startTime = performance.now();
    let nextBurst = 0;
    let animationFrame;
    let width;
    let height;
    let pixelRatio;

    Object.assign(canvas.style, {
        background: "#091020",
        height: "100%",
        inset: "0",
        opacity: "1",
        pointerEvents: "none",
        position: "fixed",
        transition: "opacity 0.7s ease",
        width: "100%",
        zIndex: "20000"
    });
    canvas.setAttribute("aria-hidden", "true");
    document.body.append(canvas);

    function sizeCanvas() {
        pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    function createBurst(x, y) {
        const baseHue = Math.random() * 335;
        const particleCount = 110;

        for (let index = 0; index < particleCount; index += 1) {
            const angle = (Math.PI * 2 * index) / particleCount;
            const power = 2.5 + Math.random() * 5;

            particles.push({
                alpha: 1,
                color: `hsla(${baseHue + Math.random() * 25}, 78%, 62%, 0.9)`,
                radius: 1.25 + Math.random() * 1.75,
                velocityX: Math.cos(angle) * power,
                velocityY: Math.sin(angle) * power,
                x,
                y
            });
        }
    }

    function drawParticle(particle) {
        context.save();
        context.globalAlpha = particle.alpha;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = particle.color;
        context.fill();
        context.restore();
    }

    function animate(now) {
        const elapsed = now - startTime;

        context.fillStyle = "rgba(9, 16, 32, 0.16)";
        context.fillRect(0, 0, width, height);

        while (nextBurst < burstTimes.length && elapsed >= burstTimes[nextBurst]) {
            createBurst(
                width * (0.12 + Math.random() * 0.76),
                height * (0.15 + Math.random() * 0.65)
            );
            nextBurst += 1;
        }

        for (let index = particles.length - 1; index >= 0; index -= 1) {
            const particle = particles[index];

            particle.velocityX *= 0.985;
            particle.velocityY = particle.velocityY * 0.985 + 0.035;
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.alpha -= 0.011;

            if (particle.alpha <= 0) {
                particles.splice(index, 1);
            } else {
                drawParticle(particle);
            }
        }

        if (elapsed < 4700) {
            animationFrame = requestAnimationFrame(animate);
        } else {
            canvas.style.opacity = "0";
            window.setTimeout(() => canvas.remove(), 700);
            window.removeEventListener("resize", sizeCanvas);
        }
    }

    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);
    animationFrame = requestAnimationFrame(animate);

    canvas.addEventListener("transitioncancel", () => cancelAnimationFrame(animationFrame), { once: true });
}

async function updateItem(username, itemId, changes) {
    const nextBucketList = {
        ...activeBucketList,
        [itemId]: {
            ...activeBucketList[itemId],
            ...changes
        }
    };
    const updates = {
        [`users/${username}/updatedAt`]: serverTimestamp(),
        [`leaderboard/users/${username}`]: leaderboardRecord(username, nextBucketList)
    };

    Object.entries(changes).forEach(([field, value]) => {
        updates[`users/${username}/bucketList/${itemId}/${field}`] = value;
    });

    await update(ref(database), updates);
}

usernameForm.addEventListener("submit", async event => {
    event.preventDefault();
    usernameError.textContent = "";
    setVisible(selectionSection, false);
    setVisible(signOutMenuItem, false);
    setLoading(true);

    try {
        await selectProfile(usernameInput.value);
    } catch (error) {
        console.error(error);
        usernameError.textContent = error?.message?.toLowerCase().includes("permission denied")
            ? "Firebase denied access. Publish the Realtime Database rules for username profiles."
            : error.message || "Unable to load that profile.";
        showSignIn();
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
        const card = button.closest(".bucketlist-card");
        const uploadGate = card?.querySelector("[data-upload-completes]");
        const completionGate = card?.querySelector("[data-completion-gate]");
        const requiredInput = card?.querySelector(`[data-required-input="${itemId}"]`);
        const requiredInputError = card?.querySelector("[data-required-input-error]");

        if (requiredInputError) {
            requiredInputError.textContent = "";
        }

        if (requiredInput && !isCompleted && !requiredInput.value.trim()) {
            if (requiredInputError) {
                requiredInputError.textContent = "Enter the song you sang to complete this item";
            }

            requiredInput.focus();
            return;
        }

        if (uploadGate && !isCompleted) {
            const uploadError = card?.querySelector("[data-upload-error]");

            if (uploadError) {
                uploadError.textContent = uploadGate.dataset.uploadErrorMessage ||
                    "Upload a picture to complete this item";
            }

            uploadGate.focus();
            return;
        }

        if (completionGate && !isCompleted) {
            const completionError = card?.querySelector("[data-completion-error]");

            if (completionError) {
                completionError.textContent = completionGate.dataset.completionErrorMessage ||
                    "Complete the required activity first";
            }

            completionGate.focus();
            return;
        }

        button.disabled = true;
        friendUsernameError.textContent = "";

        try {
            const changes = { completed: !isCompleted };

            if (itemId === "make-new-friend" && !isCompleted) {
                changes.friendUsername = await validateFriendUsername(username);
                friendUsernameInput.value = changes.friendUsername;
            }

            if (requiredInput && !isCompleted) {
                changes.notes = requiredInput.value.trim();
            }

            await updateItem(username, itemId, changes);

            if (!isCompleted) {
                if (itemId === "sparks-fly") {
                    celebrateSparks();
                } else {
                    celebrateCompletion(button);
                }
            }
        } catch (error) {
            console.error(`Unable to update ${itemId}:`, error);

            if (itemId === "make-new-friend") {
                friendUsernameError.textContent = error.message || "Unable to verify that username.";
            }
        } finally {
            button.disabled = false;
        }
    });
});

const rememberedUsername =
    localStorage.getItem("bucketlistUsername");

if (rememberedUsername && isValidUsername(rememberedUsername)) {
    selectProfile(rememberedUsername).catch(error => {
        console.error("Unable to resume profile:", error);
        localStorage.removeItem("bucketlistUsername");
        usernameError.textContent = "Unable to resume that profile.";
        showSignIn();
    });
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
