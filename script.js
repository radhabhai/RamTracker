// ==========================
// Firebase Configuration
// ==========================

const firebaseConfig = {
  apiKey: "AIzaSyAhkItut1AaP4PbwMCS1boOlOKb5SeImxk",
  authDomain: "ram-checker-ad686.firebaseapp.com",
  projectId: "ram-checker-ad686",
  storageBucket: "ram-checker-ad686.appspot.com",
  messagingSenderId: "301946828251",
  appId: "1:301946828251:web:8ab9cefed0fc59686d23fe"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
let currentUser;
let foodUnsub;
let waterUnsub;

// ==========================
// AUTH STATE
// ==========================

auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        updateProfileElements(user);
        document.getElementById("loginSection").style.display = "none";
        document.getElementById("appSection").style.display = "block";
        startRealtimeListeners();
        showTab('homePage');
    } else {
        document.getElementById("loginSection").style.display = "block";
        document.getElementById("appSection").style.display = "none";
        if(foodUnsub) foodUnsub();
        if(waterUnsub) waterUnsub();
    }
});

function updateProfileElements(user) {
    const nameEl = document.getElementById("homeDisplayName");
    const emailEl = document.getElementById("homeEmail");
    const imgEl = document.getElementById("homeProfileImg");
    const settingsNameEl = document.getElementById("displayNameInput");
    const settingsEmailEl = document.getElementById("emailDisplay");
    const settingsImgEl = document.getElementById("profileImage");
    const welcomeMessage = document.getElementById("welcomeMessage");

    if (nameEl) nameEl.innerText = user.displayName || "User";
    if (emailEl) emailEl.innerText = user.email;
    if (imgEl) imgEl.src = user.photoURL || "https://via.placeholder.com/150";
    if (settingsNameEl) settingsNameEl.value = user.displayName || "";
    if (settingsEmailEl) settingsEmailEl.innerText = user.email;
    if (settingsImgEl) settingsImgEl.src = user.photoURL || "https://via.placeholder.com/150";
    if (welcomeMessage) welcomeMessage.innerText = `WELCOME ${user.displayName || "User"}`;
}


// ==========================
// LOGIN
// ==========================

function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(showError);
}

function emailLogin() {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;

    auth.signInWithEmailAndPassword(email, pass)
        .catch(showError);
}

function logout() {
    auth.signOut();
}

function showError(error) {
    document.getElementById("authError").innerText = error.message;
}


// ==========================
// REALTIME LISTENERS
// ==========================

function startRealtimeListeners() {

    if(foodUnsub) foodUnsub();
    if(waterUnsub) waterUnsub();

    // FOOD
    foodUnsub = db.collection("users")
    .doc(currentUser.uid)
    .collection("food")
    .orderBy("time","desc")
    .onSnapshot(snapshot => {

        let html = "";

        snapshot.forEach(doc => {
            const d = doc.data();

            html += `
<li class="log-item">
    <div class="log-text">
        ${d.text}
        <div class="log-time">${d.time?.toDate().toLocaleString() || ""}</div>
    </div>
    <div class="log-actions">
        <button onclick="editFood('${doc.id}','${d.text}')">✏</button>
        <button onclick="deleteFood('${doc.id}')">🗑</button>
    </div>
</li>`;
        });

        document.getElementById("foodList").innerHTML = html;
    });

    // WATER (now matching food layout)
    waterUnsub = db.collection("users")
    .doc(currentUser.uid)
    .collection("water")
    .orderBy("time","desc")
    .onSnapshot(snapshot => {

        let html = "";

        snapshot.forEach(doc => {
            const d = doc.data();

            html += `
<li class="log-item">
    <div class="log-text">
        ${d.amount} ml
        <div class="log-time">${d.time?.toDate().toLocaleString() || ""}</div>
    </div>
    <div class="log-actions">
        <button onclick="editWater('${doc.id}','${d.amount}')">✏</button>
        <button onclick="deleteWater('${doc.id}')">🗑</button>
    </div>
</li>`;
        });

        document.getElementById("waterList").innerHTML = html;
    });
}


// ==========================
// FOOD
// ==========================

function addFood() {
    const val = document.getElementById("foodInput").value.trim();
    if(!val) return;

    db.collection("users")
    .doc(currentUser.uid)
    .collection("food")
    .add({
        text: val,
        time: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById("foodInput").value = "";
}

function deleteFood(docId) {
    db.collection("users")
    .doc(currentUser.uid)
    .collection("food")
    .doc(docId)
    .delete();
}

function editFood(docId, oldValue) {
    const newValue = prompt("Edit Food:", oldValue);
    if(!newValue || newValue.trim() === "") return;

    db.collection("users")
    .doc(currentUser.uid)
    .collection("food")
    .doc(docId)
    .update({
        text: newValue.trim()
    });
}


// ==========================
// WATER
// ==========================

function addWater() {
    const val = document.getElementById("waterInput").value;
    if(!val || val <= 0) return;

    db.collection("users")
    .doc(currentUser.uid)
    .collection("water")
    .add({
        amount: val,
        time: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById("waterInput").value = "";
}

function deleteWater(docId) {
    db.collection("users")
    .doc(currentUser.uid)
    .collection("water")
    .doc(docId)
    .delete();
}

function editWater(docId, oldValue) {
    const newValue = prompt("Edit Water (ml):", oldValue);
    if(!newValue || newValue <= 0) return;

    db.collection("users")
    .doc(currentUser.uid)
    .collection("water")
    .doc(docId)
    .update({
        amount: newValue
    });
}


// ==========================
// HEALTH MODAL
// ==========================

function openTest() {
    document.getElementById("testModal").style.display = "flex";
}

function closeTest() {
    document.getElementById("testModal").style.display = "none";
}

function saveHealth() {

    const form = document.forms["healthForm"];
    if(!form.checkValidity()) {
        alert("Fill all health fields");
        return;
    }

    db.collection("users")
    .doc(currentUser.uid)
    .collection("health")
    .add({
        gas: form.gas.value,
        headache: form.headache.value,
        body: form.body.value,
        energy: form.energy.value,
        sleep: form.sleep.value,
        stress: form.stress.value,
        note: document.getElementById("note").value,
        time: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        form.reset();
        showToast("Health data saved!");
    });
}


// ==========================
// SETTINGS
// ==========================

function openSettings() {
    const user = auth.currentUser;
    if (user) {
        updateProfileElements(user);
    }
}

function closeSettings() {
    document.getElementById("settingsPage").classList.remove("active");
}

function toggleTheme() {
    document.documentElement.classList.toggle("dark");
}

function toggleEditProfile() {
    const displayNameInput = document.getElementById("displayNameInput");
    const fileInput = document.querySelector(".edit-profile-image input");
    const editBtn = document.getElementById("editProfileBtn");
    const saveBtn = document.getElementById("saveProfileBtn");

    displayNameInput.disabled = !displayNameInput.disabled;
    fileInput.disabled = !fileInput.disabled;

    if (displayNameInput.disabled) {
        editBtn.innerText = "Edit";
        saveBtn.style.display = "none";
    } else {
        editBtn.innerText = "Cancel";
        saveBtn.style.display = "inline-block";
    }
}

function saveProfile() {
    const name = document.getElementById("displayNameInput").value;
    const user = auth.currentUser;
    if (user) {
        user.updateProfile({ displayName: name }).then(() => {
            updateProfileElements(user);
            toggleEditProfile();
            showToast("Profile saved!");
        });
    }
}

function changeProfileImage(event) {
    const file = event.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const user = auth.currentUser;
        if (user) {
            user.updateProfile({ photoURL: e.target.result }).then(() => {
                updateProfileElements(user);
                showToast("Profile image updated!");
            });
        }
    };
    reader.readAsDataURL(file);
}


// ==========================
// CSV EXPORT
// ==========================

async function downloadExcel() {

    let csv = "Type,Value,Time\n";

    const foodSnap = await db.collection("users")
    .doc(currentUser.uid)
    .collection("food").get();

    foodSnap.forEach(doc=>{
        const d = doc.data();
        csv += `Food,${d.text},${d.time?.toDate().toLocaleString() || ""}\n`;
    });

    const waterSnap = await db.collection("users")
    .doc(currentUser.uid)
    .collection("water").get();

    waterSnap.forEach(doc=>{
        const d = doc.data();
        csv += `Water,${d.amount}ml,${d.time?.toDate().toLocaleString() || ""}\n`;
    });

    const healthSnap = await db.collection("users")
    .doc(currentUser.uid)
    .collection("health").get();

    healthSnap.forEach(doc=>{
        const d = doc.data();
        csv += `Health,Gas:${d.gas}|Headache:${d.headache}|Body:${d.body}|Energy:${d.energy}|Sleep:${d.sleep}|Stress:${d.stress},${d.time?.toDate().toLocaleString() || ""}\n`;
    });

    const blob = new Blob([csv],{type:"text/csv"});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "health_data.csv";
    a.click();
}
// ==========================
// TAB NAVIGATION (FINAL FIX)
// ==========================

function showTab(tabId) {
    setTimeout(() => {
        const tabs = document.querySelectorAll('.tab-page');
        tabs.forEach(tab => {
            if (tab.id === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }, 0);
}

function showToast(message, type = 'success') {
    const toast = document.createElement("div");
    toast.classList.add("toast", `toast-${type}`);
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }, 100);
}

const V4 = {
    showToast: (message) => {
        const toast = document.createElement("div");
        toast.classList.add("toast-v4");
        toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    },
    login: () => {
        const email = document.getElementById("email").value;
        const pass = document.getElementById("password").value;

        auth.signInWithEmailAndPassword(email, pass)
            .catch(showError);
    }
};