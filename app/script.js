window.addEventListener("DOMContentLoaded", () => {
    const dialog = document.getElementById("whereisrepo");
    const userInput = document.getElementById("ghUser");
    const repoInput = document.getElementById("ghRepo");

    const ref = document.referrer;

    if (ref) {
        // https://github.com/user/repo (以降は無視)
        const m = ref.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/?#]+)/);

        if (m) {
        userInput.value = m[1];
        repoInput.value = m[2];
        }
    }

    dialog.showModal();
});

function closerepodig(){
    const dialog = document.getElementById("whereisrepo");
    dialog.close();
}

document.addEventListener("focusin", e => {
    console.log("focus ->", e.target);
});
document.addEventListener("focusout", e => {
    console.log("blur ->", e.target);
});
