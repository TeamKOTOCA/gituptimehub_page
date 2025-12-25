/* =====================
   初期データ
===================== */
let data = {
  meta:{
    title:"KOTOCA",
    logo:"https://kotoca.net/KOTOCA.webp",
    favicon:"https://kotoca.net/KOTOCA.webp",
    theme:"dark"
  },
  categories:[
    {id:"default",label:"default"},
    {id:"kotoca_services",label:"内部サービス"}
  ],
  targets:[{
    label:"kotoca公式サイト",
    category:"kotoca_services",
    type:"self",
    meta:{
      url:"https://kotoca.net",
      http:true,
      head:true,
      restime:true,
      dns:true,
      tcp:{port:443},
      ping:true
    }
  }]
};

const providers = [
    {provider:"github", services:["actions","pages","packages"]},
    {provider:"render", services:["dashboard","deployments"]},
    {provider:"cloudflare", services:["workers","pages"]},
    {provider:"dropbox", services:["website"]},
    {provider:"notion", services:["api"]},
    {provider:"openai", services:["api"]},
    {provider:"discord", services:["api","bots"]},
    {provider:"x", services:["gnip"]}
];

const $ = s => document.querySelector(s);

/* =====================
   DOM生成（初期描画と更新用）
===================== */

function renderServiceSelect(selectedProvider, selectedService){
  const provider = providers.find(p => p.provider === selectedProvider);
  const services = provider ? provider.services : [];
  
  const select = document.createElement("select");
  select.dataset.meta = "service";

  services.forEach(s => {
    const option = document.createElement("option");
    option.value = s;
    option.textContent = s;
    if(s === selectedService) option.selected = true;
    select.appendChild(option);
  });

  return select;
}

// ターゲット描画時に使う例
function renderProvider(t){
  const container = document.createElement("div");

  // Label
  const label = document.createElement("label");
  label.textContent = "Label";
  const input = document.createElement("input");
  input.dataset.field = "label";
  input.value = t.label;
  label.appendChild(input);
  container.appendChild(label);

  // Category
  const catLabel = document.createElement("label");
  catLabel.textContent = "Category";
  const catSelect = document.createElement("select");
  catSelect.dataset.field = "category";
  data.categories.forEach(c=>{
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.label;
    if(c.id === t.category) opt.selected = true;
    catSelect.appendChild(opt);
  });
  catLabel.appendChild(catSelect);
  container.appendChild(catLabel);

  // Provider
  const provLabel = document.createElement("label");
  provLabel.textContent = "Provider";
  const provSelect = document.createElement("select");
  provSelect.dataset.meta = "provider";
  providers.forEach(p=>{
    const opt = document.createElement("option");
    opt.value = p.provider;
    opt.textContent = p.provider;
    if(p.provider === t.meta.provider) opt.selected = true;
    provSelect.appendChild(opt);
  });
  provLabel.appendChild(provSelect);
  container.appendChild(provLabel);

  // Service（選択中プロバイダーに応じてリスト更新）
  const servLabel = document.createElement("label");
  servLabel.textContent = "Service";
  const serviceSelect = renderServiceSelect(t.meta.provider, t.meta.service);
  servLabel.appendChild(serviceSelect);
  container.appendChild(servLabel);

  return container;
}

function renderMeta(){
  const c = $("#meta-fields");
  c.innerHTML = "";

  ["title","logo","favicon"].forEach(k=>{
    const label = document.createElement("label");
    label.textContent = k;
    const input = document.createElement("input");
    input.value = data.meta[k];
    input.dataset.meta = k;
    label.appendChild(input);
    c.appendChild(label);
  });

  const k = "theme";
const label = document.createElement("label");
label.textContent = k;

const select = document.createElement("select");
select.dataset.meta = k;

// オプションの定義と生成
["light", "dark"].forEach(opt => {
  const option = document.createElement("option");
  option.value = opt;
  option.textContent = opt;
  // 現在の値(data.meta.theme)と一致すれば選択状態にする
  if (data.meta[k] === opt) option.selected = true;
  select.appendChild(option);
});

label.appendChild(select);
c.appendChild(label);
}

function renderCategories(){
  const c = $("#categories-list");
  c.innerHTML = "";
  data.categories.forEach((cat,i)=>{
    const div = document.createElement("div");
    div.dataset.category = i;

    const input = document.createElement("input");
    input.value = cat.label;
    input.dataset.categoryLabel = "";
    div.appendChild(input);

    if(cat.id !== "default"){
      const btn = document.createElement("button");
      btn.textContent = "カテゴリーを削除";
      btn.dataset.categoryDelete = "";
      // ボタンクリックで削除
      btn.addEventListener("click", (e)=>{
        e.preventDefault(); // フォーム送信防止
        data.categories.splice(i,1);
        renderCategories(); // 再描画
      });
      div.appendChild(btn);
    }

    c.appendChild(div);
  });
}

function renderTargets(){
  const c = $("#targets-list");
  c.innerHTML = "";
  data.targets.forEach((t,i)=>{
    const div = document.createElement("div");
    div.className = "target";
    div.dataset.index = i;

    // Type
    const labelT = document.createElement("label");
    labelT.textContent = "Type";
    const sel = document.createElement("select");
    sel.dataset.type = "";
    ["self","provider"].forEach(v=>{
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      if(t.type===v) opt.selected = true;
      sel.appendChild(opt);
    });
    // type変更時に即反映
    sel.addEventListener("change", ()=>{
      t.type = sel.value;
      t.meta = sel.value==="provider"
        ? {provider: providers[0].provider, services: [providers[0].service]}
        : {url:"",http:true,head:true,restime:true,dns:true,tcp:{port:80},ping:true,theme:"dark"};
      renderTargets();
    });
    labelT.appendChild(sel);
    div.appendChild(labelT);

    // 自己監視
    if(t.type==="self"){
      const label = document.createElement("label");
      label.textContent = "Label";
      const input = document.createElement("input");
      input.value = t.label;
      input.dataset.field = "label";
      input.addEventListener("input", ()=>{ t.label = input.value; });
      label.appendChild(input);
      div.appendChild(label);

      const urlL = document.createElement("label");
      urlL.textContent = "URL";
      const urlI = document.createElement("input");
      urlI.value = t.meta.url;
      urlI.dataset.meta = "url";
      urlI.addEventListener("input", ()=>{ t.meta.url = urlI.value; });
      urlL.appendChild(urlI);
      div.appendChild(urlL);

      const tcpL = document.createElement("label");
      tcpL.textContent = "TCP";
      const tcpI = document.createElement("input");
      tcpI.type = "number";
      tcpI.value = t.meta.tcp.port;
      tcpI.dataset.tcp = "";
      tcpI.addEventListener("input", ()=>{ t.meta.tcp.port = +tcpI.value; });
      tcpL.appendChild(tcpI);
      div.appendChild(tcpL);

      ["http","head","restime","dns","ping"].forEach(k=>{
        const lbl = document.createElement("label");
        lbl.textContent = k;
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = t.meta[k];
        cb.dataset.toggle = k;
        cb.addEventListener("change", ()=>{ t.meta[k] = cb.checked; });
        lbl.appendChild(cb);
        div.appendChild(lbl);
      });
    } else {
      // provider
      const label = document.createElement("label");
      label.textContent = "Label";
      const input = document.createElement("input");
      input.value = t.label;
      input.dataset.field = "label";
      input.addEventListener("input", ()=>{ t.label = input.value; });
      label.appendChild(input);
      div.appendChild(label);

      // Category
      const catL = document.createElement("label");
      catL.textContent = "Category";
      const catS = document.createElement("select");
      catS.dataset.field = "category";
      data.categories.forEach(ca=>{
        const opt = document.createElement("option");
        opt.value = ca.id;
        opt.textContent = ca.label;
        if(ca.id===t.category) opt.selected = true;
        catS.appendChild(opt);
      });
      catS.addEventListener("change", ()=>{ t.category = catS.value; });
      catL.appendChild(catS);
      div.appendChild(catL);

      // Provider
      const provL = document.createElement("label");
      provL.textContent = "Provider";
      const provS = document.createElement("select");
      provS.dataset.meta = "provider";
      providers.forEach(p=>{
        const opt = document.createElement("option");
        opt.value = p.provider;
        opt.textContent = p.provider;
        if(p.provider===t.meta.provider) opt.selected = true;
        provS.appendChild(opt);
      });
      provS.addEventListener("change", ()=>{
        t.meta.provider = provS.value;
        const p = providers.find(p=>p.provider===provS.value);
        t.meta.services = [p.service]; // 初期サービスリスト
        renderTargets();
      });
      provL.appendChild(provS);
      div.appendChild(provL);

// Service (単一選択)
const servLabel = document.createElement("label");
servLabel.textContent = "Service";

const servS = document.createElement("select"); // multiple は削除
const providerObj = providers.find(p => p.provider === t.meta.provider);
(providerObj ? providerObj.services : []).forEach(sv => {
  const opt = document.createElement("option");
  opt.value = sv;
  opt.textContent = sv;
  if(t.meta.service === sv) opt.selected = true; // services → service に変更
  servS.appendChild(opt);
});

// 選択変更時は単一サービスを反映
servS.addEventListener("change", () => {
  t.meta.service = servS.value;
});

servLabel.appendChild(servS);
div.appendChild(servLabel);

    }

    // Delete
    const btnDel = document.createElement("button");
    btnDel.textContent = "Delete Target";
    btnDel.dataset.deleteTarget = "";
    btnDel.addEventListener("click", e=>{
      e.preventDefault();
      data.targets.splice(i,1);
      renderTargets();
    });
    div.appendChild(btnDel);

    c.appendChild(div);
  });
}


/* =====================
   初期描画
===================== */
function renderAll(){
  renderMeta();
  renderCategories();
  renderTargets();
  $("#output-json").value = JSON.stringify(data,null,2);
}

renderAll();

/* =====================
   イベント処理（入力中は DOM 書き換えない）
===================== */
document.body.addEventListener("input", e=>{
  const t = e.target;
  if(t.dataset.meta) data.meta[t.dataset.meta] = t.value;
  if(t.dataset.metaColor) data.meta.color[t.dataset.metaColor] = t.value;
  if(t.dataset.footerField){
    const i = +t.closest("[data-footer]").dataset.footer;
    data.meta.footer_links[i][t.dataset.footerField] = t.value;
  }
  if(t.dataset.categoryLabel){
    const i = +t.closest("[data-category]").dataset.category;
    data.categories[i].label = t.value;
  }
  if(t.dataset.field){
    const i = +t.closest(".target").dataset.index;
    const tdata = data.targets[i];
    tdata[t.dataset.field] = t.value;
  }
  if(t.dataset.meta){
    const i = +t.closest(".target").dataset.index;
    data.targets[i].meta[t.dataset.meta] = t.value;
  }
  if(t.dataset.tcp){
    const i = +t.closest(".target").dataset.index;
    data.targets[i].meta.tcp.port = +t.value;
  }
  $("#output-json").value = JSON.stringify(data,null,2);
});

document.body.addEventListener("change", e=>{
  const t = e.target;
  if(t.dataset.toggle){
    const i = +t.closest(".target").dataset.index;
    data.targets[i].meta[t.dataset.toggle] = t.checked;
  }
  if(t.dataset.type){
    const i = +t.closest(".target").dataset.index;
    data.targets[i].type = t.value;
    data.targets[i].meta = t.value==="provider"
      ? {provider:providers[0].provider,service:providers[0].service}
      : {url:"",http:true,head:true,restime:true,dns:true,tcp:{port:80},ping:true,theme:"dark"};
    renderTargets(); // type変更だけ再描画
  }
});

document.body.addEventListener("click", e=>{
  const t = e.target;

  if(t.id==="add-target"){
    data.targets.push({
      label:"New Target",
      category:data.categories[0].id,
      type:"self",
      meta:{url:"",http:true,head:true,restime:true,dns:true,tcp:{port:80},ping:true,theme:"dark"}
    });
    renderTargets();
  }

  if(t.dataset.deleteTarget){
    const i = +t.closest(".target").dataset.index;
    data.targets.splice(i,1);
    renderTargets();
  }

  if(t.id==="add-category"){
    data.categories.push({id:"cat_"+Date.now(),label:"New Category"});
    renderCategories();
  }

  if(t.dataset.categoryDelete){
    const i = +t.closest("[data-category]").dataset.category;
    data.categories.splice(i,1);
    renderCategories();
  }

  if(t.id==="add-footer"){
    data.meta.footer_links.push({label:"",url:""});
    renderMeta();
  }

  if(t.dataset.footerDelete){
    const i = +t.closest("[data-footer]").dataset.footer;
    data.meta.footer_links.splice(i,1);
    renderMeta();
  }

  if(t.id==="import-text-btn"){
    try{
      data = JSON.parse($("#import-text").value);
    }catch{ alert("Invalid JSON"); }
    renderAll();
  }

  if(t.id==="download-json"){
    const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "data.json";
    a.click();
  }
});
