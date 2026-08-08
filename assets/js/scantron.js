import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
    getDatabase,
    ref,
    get,
    update,
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

// Configure the correct bubble for questions 1-10 using "A", "B", "C", or "D".
const correctAnswers = [
    "B", "B", "A", "D", "A",
    "C", "D", "C", "B", "A"
];

const PASSING_SCORE = 7;
const ITEM_ID = "pass-exam";
const answers = ["A", "B", "C", "D"];
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const form = document.querySelector("#scantron-form");
const status = document.querySelector("#scantron-status");
const submitButton = form.querySelector("button[type='submit']");
const authGate = document.querySelector("#scantron-auth-gate");
const signOutMenuItem = document.querySelector("#sign-out-menu-item");
const signOutButton = document.querySelector("#sign-out");

function setSignOutVisible(isVisible) {
    signOutMenuItem.classList.toggle("bucketlist-hidden", !isVisible);
    signOutMenuItem.setAttribute("aria-hidden", String(!isVisible));
}

function setExamAvailable(isAvailable) {
    authGate.classList.toggle("scantron-hidden", isAvailable);
    authGate.setAttribute("aria-hidden", String(isAvailable));
    form.classList.toggle("scantron-hidden", !isAvailable);
    form.setAttribute("aria-hidden", String(!isAvailable));
}

const rememberedUsername = localStorage.getItem("bucketlistUsername");
const hasRememberedUsername = Boolean(
    rememberedUsername && /^[a-z0-9_-]{3,24}$/.test(rememberedUsername)
);

setSignOutVisible(false);
setExamAvailable(false);

if (hasRememberedUsername) {
    get(ref(database, `users/${rememberedUsername}`))
        .then(snapshot => {
            if (localStorage.getItem("bucketlistUsername") !== rememberedUsername) {
                return;
            }

            if (!snapshot.exists()) {
                localStorage.removeItem("bucketlistUsername");
                return;
            }

            setSignOutVisible(true);
            setExamAvailable(true);
        })
        .catch(error => {
            console.error("Unable to verify bucket-list profile:", error);
            setSignOutVisible(false);
            setExamAvailable(false);
        });
} else {
    localStorage.removeItem("bucketlistUsername");
}

signOutButton.addEventListener("click", event => {
    event.preventDefault();
    localStorage.removeItem("bucketlistUsername");
    setSignOutVisible(false);
    setExamAvailable(false);
    status.textContent = "";
});

document.querySelectorAll("[data-question]").forEach((container, questionIndex) => {
    const questionNumber = questionIndex + 1;

    answers.forEach(answer => {
        const input = document.createElement("input");
        const label = document.createElement("label");
        const id = `question-${questionNumber}-${answer.toLowerCase()}`;

        input.id = id;
        input.type = "radio";
        input.name = `question-${questionNumber}`;
        input.value = answer;
        input.required = true;
        label.htmlFor = id;
        label.textContent = answer;
        container.append(input, label);
    });
});

function isAnswerKeyConfigured() {
    return correctAnswers.length === 10 && correctAnswers.every(answer => answers.includes(answer));
}

async function markExamComplete(username) {
    const [profileSnapshot, totalSnapshot, finishedAtSnapshot] = await Promise.all([
        get(ref(database, `users/${username}`)),
        get(ref(database, "leaderboard/total")),
        get(ref(database, `leaderboard/users/${username}/finishedAt`))
    ]);

    if (!profileSnapshot.exists()) {
        throw new Error("Select your bucket-list profile before taking the exam.");
    }

    const profile = profileSnapshot.val();
    const nextBucketList = {
        ...(profile.bucketList || {}),
        [ITEM_ID]: {
            ...(profile.bucketList?.[ITEM_ID] || {}),
            completed: true
        }
    };
    const completed = Object.values(nextBucketList).filter(item => item?.completed === true).length;

    const updates = {
        [`users/${username}/updatedAt`]: serverTimestamp(),
        [`users/${username}/bucketList/${ITEM_ID}/completed`]: true,
        [`leaderboard/users/${username}/username`]: username,
        [`leaderboard/users/${username}/completed`]: completed,
        [`leaderboard/users/${username}/updatedAt`]: serverTimestamp()
    };

    if (completed === Number(totalSnapshot.val()) && !finishedAtSnapshot.exists()) {
        updates[`leaderboard/users/${username}/finishedAt`] = serverTimestamp();
    }

    await update(ref(database), updates);
}

form.addEventListener("submit", async event => {
    event.preventDefault();
    status.classList.remove("is-passing");

    if (!isAnswerKeyConfigured()) {
        status.textContent = "The exam answer key has not been configured yet.";
        return;
    }

    const selectedAnswers = correctAnswers.map((_, index) =>
        form.elements.namedItem(`question-${index + 1}`).value
    );
    const score = selectedAnswers.filter((answer, index) => answer === correctAnswers[index]).length;

    if (score < PASSING_SCORE) {
        status.textContent = `You scored ${score}/10. You need 7/10 to pass—try again!`;
        return;
    }

    const username = localStorage.getItem("bucketlistUsername");

    if (!username) {
        status.textContent = "Return to the bucket list and select your profile before submitting.";
        return;
    }

    submitButton.disabled = true;

    try {
        await markExamComplete(username);
        status.classList.add("is-passing");
        status.textContent = `You scored ${score}/10. You passed! The item is now complete.`;
    } catch (error) {
        console.error("Unable to save exam result:", error);
        status.textContent = error.message || "Unable to save your passing score.";
    } finally {
        submitButton.disabled = false;
    }
});
