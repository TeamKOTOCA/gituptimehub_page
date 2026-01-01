window.addEventListener("DOMContentLoaded", () => {
    const dialog = document.getElementById("whereisrepo");
    const userInput = document.getElementById("ghUser");
    const repoInput = document.getElementById("ghRepo");

    const local_user = localStorage.getItem("User");
    const local_repo = localStorage.getItem("Repo");

    if (local_user !== null && local_repo !== null) {
        userInput.value = local_user;
        repoInput.value = local_repo;
    }

    const ref = document.referrer;

    if (ref) {
        const m = ref.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/?#]+)/);
        if (m) {
            userInput.value = m[1];
            repoInput.value = m[2];
        }
    }
    dialog.showModal();
});

async function closerepodig() {
    const dialog = document.getElementById("whereisrepo");
    const user = document.getElementById("ghUser").value.trim();
    const repo = document.getElementById("ghRepo").value.trim();
    dialog.close();
    if (!user || !repo) {
        return;
    }

    localStorage.setItem("User", user);
    localStorage.setItem("Repo", repo);

    const url = `https://raw.githubusercontent.com/${user}/${repo}/main/setting.json`;
    try {
        const res = await fetch(url, { cache: "no-store" });
        console.log(res)
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        const text = await res.text();
        data = JSON.parse(text);
        renderAll();
    } catch (err) {
        console.error(err);
        alert("setting.json の読み込みまたは JSON の解析に失敗しました");
    }
}

/* =====================
   初期データ
===================== */
let data = {
    common: {
        title: "KOTOCA",
        logo: "https://kotoca.net/KOTOCA.webp",
        favicon: "https://kotoca.net/KOTOCA.webp",
        theme: "dark",
        footer_links: []
    },
    categories: [
        { id: "default", label: "既定" }
    ],
    targets: [{
        label: "kotoca公式サイト",
        category: "default",
        type: "self",
        meta: {
            url: "https://kotoca.net",
            http: true,
            head: true,
            restime: true,
            dns: true,
            tcp: { port: 443 },
            ping: true
        }
    }]
};

const providers = [
    { provider: "github", services: ["actions", "pages", "packages"] },
    { provider: "render", services: ["dashboard", "deployments"] },
    { provider: "cloudflare", services: ["workers", "pages"] },
    { provider: "dropbox", services: ["website"] },
    { provider: "notion", services: ["api"] },
    { provider: "openai", services: ["api"] },
    { provider: "discord", services: ["api", "bots"] },
    { provider: "x", services: ["gnip"] }
];

const $ = s => document.querySelector(s);

/* =====================
   DOM生成
===================== */

function renderCommon() {
    const c = $("#meta-fields");
    c.innerHTML = "";

    ["title", "logo", "favicon"].forEach(k => {
        const label = document.createElement("label");
        label.textContent = k;
        const input = document.createElement("input");
        input.value = data.common[k] || "";
        input.dataset.common = k;
        label.appendChild(input);
        c.appendChild(label);
    });

    const label = document.createElement("label");
    label.textContent = "theme";
    const select = document.createElement("select");
    select.dataset.common = "theme";
    ["light", "dark"].forEach(opt => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        if (data.common.theme === opt) option.selected = true;
        select.appendChild(option);
    });
    label.appendChild(select);
    c.appendChild(label);
}

function renderCategories() {
    const c = $("#categories-list");
    c.innerHTML = "";
    data.categories.forEach((cat, i) => {
        const div = document.createElement("div");
        div.dataset.categoryIndex = i;

        const input = document.createElement("input");
        input.value = cat.label;
        input.dataset.categoryLabel = ""; // カテゴリ名入力用フラグ
        div.appendChild(input);

        if (cat.id !== "default") {
            const btn = document.createElement("button");
            btn.textContent = "削除";
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                data.categories.splice(i, 1);
                renderAll();
            });
            div.appendChild(btn);
        }
        c.appendChild(div);
    });
}

function renderTargets() {
    const c = $("#targets-list");
    c.innerHTML = "";
    data.targets.forEach((t, i) => {
        const div = document.createElement("div");
        div.className = "target";
        div.dataset.index = i;

        // Type Select
        const labelT = document.createElement("label");
        labelT.textContent = "Type";
        const selType = document.createElement("select");
        ["self", "provider"].forEach(v => {
            const opt = document.createElement("option");
            opt.value = v;
            opt.textContent = v;
            if (t.type === v) opt.selected = true;
            selType.appendChild(opt);
        });
        selType.addEventListener("change", () => {
            t.type = selType.value;
            t.meta = t.type === "provider"
                ? { provider: providers[0].provider, service: providers[0].services[0] }
                : { url: "", http: true, head: true, restime: true, dns: true, tcp: { port: 80 }, ping: true };
            renderTargets();
        });
        labelT.appendChild(selType);
        div.appendChild(labelT);

        // Common Fields (Label & Category)
        const labelL = document.createElement("label");
        labelL.textContent = "Label";
        const inputL = document.createElement("input");
        inputL.value = t.label;
        inputL.addEventListener("input", () => { t.label = inputL.value; updateJSON(); });
        labelL.appendChild(inputL);
        div.appendChild(labelL);

        const labelC = document.createElement("label");
        labelC.textContent = "Category";
        const selCat = document.createElement("select");
        data.categories.forEach(ca => {
            const opt = document.createElement("option");
            opt.value = ca.id;
            opt.textContent = ca.label;
            if (ca.id === t.category) opt.selected = true;
            selCat.appendChild(opt);
        });
        selCat.addEventListener("change", () => { t.category = selCat.value; updateJSON(); });
        labelC.appendChild(selCat);
        div.appendChild(labelC);

        // Specific Fields
        if (t.type === "self") {
            const urlL = document.createElement("label");
            urlL.textContent = "URL";
            const urlI = document.createElement("input");
            urlI.value = t.meta.url;
            urlI.addEventListener("input", () => { t.meta.url = urlI.value; updateJSON(); });
            urlL.appendChild(urlI);
            div.appendChild(urlL);

            ["http", "head", "restime", "dns", "ping"].forEach(k => {
                const lbl = document.createElement("label");
                lbl.textContent = k;
                const cb = document.createElement("input");
                cb.type = "checkbox";
                cb.checked = t.meta[k];
                cb.addEventListener("change", () => { t.meta[k] = cb.checked; updateJSON(); });
                lbl.appendChild(cb);
                div.appendChild(lbl);
            });
        } else {
            // Provider Select
            const provL = document.createElement("label");
            provL.textContent = "Provider";
            const provS = document.createElement("select");
            providers.forEach(p => {
                const opt = document.createElement("option");
                opt.value = p.provider;
                opt.textContent = p.provider;
                if (p.provider === t.meta.provider) opt.selected = true;
                provS.appendChild(opt);
            });
            provS.addEventListener("change", () => {
                t.meta.provider = provS.value;
                t.meta.service = providers.find(p => p.provider === provS.value).services[0];
                renderTargets();
            });
            provL.appendChild(provS);
            div.appendChild(provL);

            // Service Select
            const servL = document.createElement("label");
            servL.textContent = "Service";
            const servS = document.createElement("select");
            const pObj = providers.find(p => p.provider === t.meta.provider);
            (pObj ? pObj.services : []).forEach(sv => {
                const opt = document.createElement("option");
                opt.value = sv;
                opt.textContent = sv;
                if (t.meta.service === sv) opt.selected = true;
                servS.appendChild(opt);
            });
            servS.addEventListener("change", () => { t.meta.service = servS.value; updateJSON(); });
            servL.appendChild(servS);
            div.appendChild(servL);
        }

        const btnDel = document.createElement("button");
        btnDel.textContent = "Delete Target";
        btnDel.addEventListener("click", () => {
            data.targets.splice(i, 1);
            renderTargets();
            updateJSON();
        });
        div.appendChild(btnDel);
        c.appendChild(div);
    });
}

function updateJSON() {
    $("#output-json").value = JSON.stringify(data, null, 2);
}

function renderAll() {
    renderCommon();
    renderCategories();
    renderTargets();
    updateJSON();
}

/* =====================
   イベントリスナー
===================== */

document.body.addEventListener("input", e => {
    const t = e.target;

    // 共通設定の更新
    if (t.dataset.common) {
        data.common[t.dataset.common] = t.value;
    }

    // カテゴリーラベルの同期修正
    if (t.hasAttribute('data-category-label')) {
        const i = +t.closest("[data-category-index]").dataset.categoryIndex;
        data.categories[i].label = t.value;
        // ターゲット側の表示名のみ更新（フォーカスが外れないようrenderTargetsはここでは呼ばず、
        // セレクトボックスのoptionを直接書き換えるか、最後に一括で更新する）
        const selects = document.querySelectorAll(`select[data-field="category"]`);
        selects.forEach(sel => {
            const opt = sel.querySelector(`option[value="${data.categories[i].id}"]`);
            if (opt) opt.textContent = t.value;
        });
    }

    updateJSON();
});

document.body.addEventListener("click", e => {
    const t = e.target;

    if (t.id === "add-target") {
        data.targets.push({
            label: "New Target",
            category: data.categories[0].id,
            type: "self",
            meta: { url: "", http: true, head: true, restime: true, dns: true, tcp: { port: 80 }, ping: true }
        });
        renderTargets();
    }

    if (t.id === "add-category") {
        data.categories.push({ id: "cat_" + Date.now(), label: "New Category" });
        renderCategories();
        renderTargets(); // ターゲット側のリストを更新
    }

    if (t.id === "add-footer") {
        if (!data.common.footer_links) data.common.footer_links = [];
        data.common.footer_links.push({ label: "", url: "" });
        renderCommon();
    }

    if (t.id === "import-text-btn") {
        try {
            const imported = JSON.parse($("#import-text").value);
            data = imported;
            renderAll();
        } catch (err) { alert("Invalid JSON"); }
    }

    if (t.id === "download-json") {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "data.json";
        a.click();
    }
    if (t.id === "to_next") {
        const userInput = document.getElementById("ghUser");
        const repoInput = document.getElementById("ghRepo");
        const dialog = document.getElementById("whereisrepo");
        
        const user = userInput.value.trim();
        const repo = repoInput.value.trim();

        if (!user || !repo) {
            dialog.showModal;
            alert("GitHubのユーザー名とリポジトリ名を入力してください。");
            return;
        }

        // 1. JSONデータを文字列化
        const jsonText = JSON.stringify(data, null, 2);

        // 2. クリップボードに書き込み
        navigator.clipboard.writeText(jsonText).then(() => {
            alert("設定JSONをクリップボードにコピーしました。移動先のページで貼り付けてください。");

            // 3. GitHubの編集ページを新しいタブで開く
            // 注: ブランチ名が 'main' であると仮定しています。'master' の場合は書き換えてください。
            const editUrl = `https://github.com/${user}/${repo}/edit/main/setting.json`;
            window.open(editUrl, "_blank");
            
        }).catch(err => {
            console.error("クリップボードへのコピーに失敗しました:", err);
            alert("コピーに失敗しました。手動でコピーするか、ブラウザの権限を確認してください。");
        });
    }
    updateJSON();
});

// 起動
renderAll();