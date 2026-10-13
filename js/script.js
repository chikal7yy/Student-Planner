const DAYS=['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
const JDAYS=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MONTHS=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const MFULL=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const COLORS=['#3b6ef8','#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#10b981','#06b6d4','#64748b'];

let tasks=[],grades=[],schedule=[],dark=false,activeDay='Senin',tColor=COLORS[0],sColor=COLORS[0];
let currentUser=null; // {email, name, key}

function getUsers(){return JSON.parse(localStorage.getItem('fga_users')||'{}')}
function saveUsers(u){localStorage.setItem('fga_users',JSON.stringify(u))}
function userKey(email){return 'fga_u_'+email.replace(/[^a-z0-9]/gi,'_')}

function switchAuthTab(tab){
  document.getElementById('tabLogin').classList.toggle('active',tab==='login');
  document.getElementById('tabRegister').classList.toggle('active',tab==='register');
  document.getElementById('loginForm').style.display=tab==='login'?'':'none';
  document.getElementById('registerForm').style.display=tab==='register'?'':'none';
  document.getElementById('loginError').classList.remove('show');
  document.getElementById('regError').classList.remove('show');
  document.getElementById('regSuccess').classList.remove('show');
}

function togglePw(inputId, btn){
  const inp=document.getElementById(inputId);
  const isText=inp.type==='text';
  inp.type=isText?'password':'text';
  btn.querySelector('i').setAttribute('data-lucide',isText?'eye':'eye-off');
  lucide.createIcons();
}

function showForgot(){
  const email=document.getElementById('lEmail').value.trim();
  if(!email){showAuthError('loginError','Masukkan email dulu untuk reset password.');return}
  const users=getUsers();
  if(!users[email]){showAuthError('loginError','Email tidak ditemukan.');return}
  // Simulate password reset — show password (demo only)
  toast('Demo: Password kamu adalah "'+users[email].pass+'"','#6366f1');
}

function showAuthError(id,msg){
  const el=document.getElementById(id);el.textContent=msg;el.classList.add('show');
}

function doLogin(){
  const email=document.getElementById('lEmail').value.trim().toLowerCase();
  const pass=document.getElementById('lPass').value;
  document.getElementById('loginError').classList.remove('show');
  if(!email||!pass){showAuthError('loginError','Email dan password wajib diisi.');return}
  const users=getUsers();
  if(!users[email]){showAuthError('loginError','Akun tidak ditemukan. Silakan daftar dulu.');return}
  if(users[email].pass!==pass){showAuthError('loginError','Password salah. Coba lagi.');return}
  const remember=document.getElementById('rememberMe').checked;
  if(remember)localStorage.setItem('fga_session',email);
  else sessionStorage.setItem('fga_session',email);
  loginAs(email,users[email].name);
}

function doRegister(){
  const name=document.getElementById('rName').value.trim();
  const email=document.getElementById('rEmail').value.trim().toLowerCase();
  const pass=document.getElementById('rPass').value;
  const pass2=document.getElementById('rPass2').value;
  document.getElementById('regError').classList.remove('show');
  document.getElementById('regSuccess').classList.remove('show');
  if(!name||!email||!pass){showAuthError('regError','Semua field wajib diisi.');return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showAuthError('regError','Format email tidak valid.');return}
  if(pass.length<6){showAuthError('regError','Password minimal 6 karakter.');return}
  if(pass!==pass2){showAuthError('regError','Konfirmasi password tidak cocok.');return}
  const users=getUsers();
  if(users[email]){showAuthError('regError','Email sudah terdaftar. Silakan masuk.');return}
  users[email]={name,pass,createdAt:Date.now()};
  saveUsers(users);
  const el=document.getElementById('regSuccess');
  el.textContent='Akun berhasil dibuat! Silakan masuk.';el.classList.add('show');
  setTimeout(()=>{switchAuthTab('login');document.getElementById('lEmail').value=email;},1200);
}

function loginAs(email,name){
  currentUser={email,name,key:userKey(email)};
  const key=currentUser.key;
  if(!localStorage.getItem(key+'_name')){localStorage.setItem(key+'_name',name)}
  tasks=JSON.parse(localStorage.getItem(key+'_tasks')||'[]');
  grades=JSON.parse(localStorage.getItem(key+'_grades')||'[]');
  schedule=JSON.parse(localStorage.getItem(key+'_sch')||'[]');
  dark=localStorage.getItem(key+'_dark')==='true';
  if(dark){document.documentElement.setAttribute('data-theme','dark');document.getElementById('themeIco').setAttribute('data-lucide','sun')}
  else{document.documentElement.setAttribute('data-theme','light');document.getElementById('themeIco').setAttribute('data-lucide','moon')}
  document.getElementById('authScreen').style.display='none';
  document.getElementById('appScreen').classList.add('visible');
  const today=JDAYS[new Date().getDay()];
  activeDay=DAYS.includes(today)?today:'Senin';
  buildColors('tColors',()=>tColor,v=>tColor=v);
  buildColors('sColors',()=>sColor,v=>sColor=v);
  loadSavedProfile();
  updateTime(); renderAll(); lucide.createIcons();
  const displayName=localStorage.getItem(key+'_name')||name;
  toast('Selamat datang, '+displayName.split(' ')[0]+'! 👋','#3b6ef8');
}


function doLogout(){
  localStorage.removeItem('fga_session');
  sessionStorage.removeItem('fga_session');
  currentUser=null;tasks=[];grades=[];schedule=[];
  document.getElementById('appScreen').classList.remove('visible');
  document.getElementById('authScreen').style.display='flex';
  closeModal('logoutModal');
  document.getElementById('lEmail').value='';
  document.getElementById('lPass').value='';
  lucide.createIcons();
  toast('Berhasil keluar.','#64748b');
}

function checkSession(){
  const email=localStorage.getItem('fga_session')||sessionStorage.getItem('fga_session');
  if(!email)return false;
  const users=getUsers();
  if(!users[email])return false;
  loginAs(email,users[email].name);
  return true;
}

function ls(k){return JSON.parse(localStorage.getItem(k)||'[]')}
function lss(k,v){localStorage.setItem(k,JSON.stringify(v))}
function uk(suffix){return currentUser.key+'_'+suffix}

function renderAll(){
  renderTasks();renderGrades();renderDayTabs();renderSch();updateStats();
  document.getElementById('taskBadge').textContent=tasks.length;
  lucide.createIcons();
}

function updateTime(){
  const n=new Date(),h=n.getHours();
  const greet=h<12?'Selamat Pagi':h<15?'Selamat Siang':h<18?'Selamat Sore':'Selamat Malam';
  const uname=localStorage.getItem(currentUser?.key+'_name')||currentUser?.name||'Kamu';
  document.getElementById('greetTxt').textContent=`${greet}, ${uname.split(' ')[0]}! ✨`;
  document.getElementById('greetDate').textContent=`${JDAYS[n.getDay()]}, ${n.getDate()} ${MFULL[n.getMonth()]} ${n.getFullYear()}`;
  document.getElementById('dateDay').textContent=String(n.getDate()).padStart(2,'0');
  document.getElementById('dateInfo').textContent=`${MFULL[n.getMonth()]} ${n.getFullYear()}`;
}
setInterval(()=>{if(currentUser)updateTime()},60000);

function toggleTheme() {
  dark = !dark;

  document.documentElement.setAttribute(
    'data-theme',
    dark ? 'dark' : 'light'
  );

  const icon = document.getElementById('themeIco');

  if (dark) {
    icon.setAttribute('data-lucide', 'sun');
  } else {
    icon.setAttribute('data-lucide', 'moon');
  }

  lucide.createIcons();

  localStorage.setItem(uk('dark'), dark);
}

function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('overlay').classList.toggle('open')}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('overlay').classList.remove('open')}
function goTo(id) {
  const target = document.getElementById(id);

  if (target) {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  closeSidebar();
}

function openModal(id){
  document.getElementById(id).classList.add('open');
  if(id==='taskModal'){document.getElementById('tEId').value='';document.getElementById('taskMTitle').textContent='Tambah Tugas';document.getElementById('tName').value='';document.getElementById('tSubj').value='';document.getElementById('tDate').value='';document.getElementById('tProg').value=0;document.getElementById('progVal').textContent='0';tColor=COLORS[0];setColorSel('tColors',tColor)}
  if(id==='gradeModal'){document.getElementById('gEId').value='';document.getElementById('gradeMTitle').textContent='Target Nilai Baru';document.getElementById('gSubj').value='';document.getElementById('gTarget').value='';document.getElementById('gCur').value=''}
  if(id==='schModal'){document.getElementById('sEId').value='';document.getElementById('schMTitle').textContent='Tambah Jadwal';document.getElementById('sSubj').value='';document.getElementById('sTime').value='';document.getElementById('sDesc').value='';sColor=COLORS[0];setColorSel('sColors',sColor)}
  setTimeout(()=>lucide.createIcons(),30);
}
function closeModal(id){document.getElementById(id).classList.remove('open')}
document.querySelectorAll('.modal-bg').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal(m.id)}));

function buildColors(containerId,getVal,setVal){
  const c=document.getElementById(containerId);
  c.innerHTML=COLORS.map((col,i)=>`<div class="color-opt${i===0?' sel':''}" style="background:${col}" data-c="${col}" onclick="pickColor('${containerId}',this,'${col.replace('#','_')}')"></div>`).join('');
}
function pickColor(cid,el,colEncoded){
  const col='#'+colEncoded.replace('_','');
  document.getElementById(cid).querySelectorAll('.color-opt').forEach(x=>x.classList.remove('sel'));
  el.classList.add('sel');
  if(cid==='tColors')tColor=col;else sColor=col;
}
function setColorSel(cid,color){
  document.getElementById(cid).querySelectorAll('.color-opt').forEach(el=>el.classList.toggle('sel',el.dataset.c===color));
}

function saveTask(){
  const id=document.getElementById('tEId').value;
  const name=document.getElementById('tName').value.trim();
  const subj=document.getElementById('tSubj').value.trim();
  const date=document.getElementById('tDate').value;
  const prog=parseInt(document.getElementById('tProg').value);
  if(!name){toast('Nama tugas kosong!','#ef4444');return}
  if(!date){toast('Pilih deadline!','#ef4444');return}
  if(id){const t=tasks.find(x=>x.id===id);if(t){t.name=name;t.subj=subj;t.date=date;t.prog=prog;t.color=tColor}}
  else tasks.push({id:Date.now()+'',name,subj,date,prog,color:tColor});
  lss(uk('tasks'),tasks);closeModal('taskModal');renderAll();toast(id?'Tugas diperbarui!':'Tugas ditambahkan!','#3b6ef8');
}
function editTask(id){
  const t=tasks.find(x=>x.id===id);if(!t)return;
  document.getElementById('tEId').value=t.id;document.getElementById('taskMTitle').textContent='Edit Tugas';
  document.getElementById('tName').value=t.name;document.getElementById('tSubj').value=t.subj||'';
  document.getElementById('tDate').value=t.date;document.getElementById('tProg').value=t.prog;
  document.getElementById('progVal').textContent=t.prog;tColor=t.color||COLORS[0];
  document.getElementById('taskModal').classList.add('open');setColorSel('tColors',tColor);setTimeout(()=>lucide.createIcons(),30);
}
function delTask(id){tasks=tasks.filter(x=>x.id!==id);lss(uk('tasks'),tasks);renderAll();toast('Tugas dihapus.','#64748b')}

function daysLeft(d){const n=new Date();n.setHours(0,0,0,0);const x=new Date(d);x.setHours(0,0,0,0);return Math.round((x-n)/86400000)}
function urgClass(d){return d<0||d<=3?'urg':d<=7?'soon':'ok'}
function urgLabel(d){if(d<0)return'Terlambat';if(d===0)return'Hari ini!';if(d===1)return'Besok!';return`${d} hari lagi`}

function renderTasks(f){
  const c=document.getElementById('task-list');
  let list=[...tasks].sort((a,b)=>new Date(a.date)-new Date(b.date));
  if(f)list=list.filter(t=>t.name.toLowerCase().includes(f)||(t.subj||'').toLowerCase().includes(f));
  if(!list.length){c.innerHTML=`<div class="empty"><i data-lucide="inbox" style="width:28px;height:28px;display:block;margin:0 auto 8px;opacity:.2"></i>Belum ada tugas.</div>`;return}
  c.innerHTML=list.map(t=>{
    const dl=daysLeft(t.date),uc=urgClass(dl),ul=urgLabel(dl);
    return`<div class="task-item">
      <div class="task-dot" style="background:${t.color||'#3b6ef8'}"></div>
      <div class="task-info">
        <div class="task-name">${t.name}</div>
        <div class="task-meta"><i data-lucide="calendar" style="width:10px;height:10px"></i>${fmtDate(t.date)}${t.subj?` • ${t.subj}`:''}<span class="badge-urg ${uc}">${ul}</span></div>
        <div class="prog-wrap">
          <div class="prog-row"><span style="font-size:10px;color:var(--txt2)">Progress</span><span class="prog-pct">${t.prog}%</span></div>
          <div class="prog-track"><div class="prog-fill" style="width:${t.prog}%;background:linear-gradient(90deg,${t.color||'#3b6ef8'},${t.color||'#6366f1'})"></div></div>
        </div>
      </div>
      <div style="display:flex;gap:2px">
        <button class="btn-edit" onclick="editTask('${t.id}')"><i data-lucide="pencil" style="width:12px;height:12px"></i></button>
        <button class="btn-del" onclick="delTask('${t.id}')"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button>
      </div>
    </div>`;
  }).join('');
}

function saveGrade(){
  const id=document.getElementById('gEId').value;
  const subj=document.getElementById('gSubj').value.trim();
  const target=parseInt(document.getElementById('gTarget').value);
  const cur=parseInt(document.getElementById('gCur').value)||0;
  if(!subj){toast('Mata pelajaran kosong!','#ef4444');return}
  if(isNaN(target)||target<0||target>100){toast('Target harus 0–100!','#ef4444');return}
  if(id){const g=grades.find(x=>x.id===id);if(g){g.subj=subj;g.target=target;g.cur=cur}}
  else grades.push({id:Date.now()+'',subj,target,cur});
  lss(uk('grades'),grades);closeModal('gradeModal');renderAll();toast(id?'Target diperbarui!':'Target ditambahkan!','#3b6ef8');
}
function editGrade(id){
  const g=grades.find(x=>x.id===id);if(!g)return;
  document.getElementById('gEId').value=g.id;document.getElementById('gradeMTitle').textContent='Edit Target';
  document.getElementById('gSubj').value=g.subj;document.getElementById('gTarget').value=g.target;document.getElementById('gCur').value=g.cur;
  document.getElementById('gradeModal').classList.add('open');setTimeout(()=>lucide.createIcons(),30);
}
function delGrade(id){grades=grades.filter(x=>x.id!==id);lss(uk('grades'),grades);renderAll();toast('Dihapus.','#64748b')}
const GC=['#3b6ef8','#6366f1','#8b5cf6','#f59e0b','#ec4899','#06b6d4','#ef4444'];
function renderGrades(f){
  const c=document.getElementById('grade-list');
  let list=grades;
  if(f)list=list.filter(g=>g.subj.toLowerCase().includes(f));
  if(!list.length){c.innerHTML=`<div class="empty"><i data-lucide="star" style="width:28px;height:28px;display:block;margin:0 auto 8px;opacity:.2"></i>Belum ada target.</div>`;return}
  c.innerHTML=list.map((g,i)=>{
    const col=GC[i%GC.length],pct=g.target>0?Math.min(100,Math.round(g.cur/g.target*100)):0;
    return`<div class="grade-item">
      <div class="grade-hdr"><div class="grade-subj">${g.subj}</div><div style="text-align:right"><div class="grade-score" style="color:${col}">${g.target}</div><div class="grade-cur">Sekarang: ${g.cur}</div></div></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:5px;font-size:10px;color:var(--txt2)"><span>Target ${g.target} | Saat ini ${g.cur}</span><span style="font-weight:700;color:${col}">${pct}%</span></div>
      <div class="prog-track"><div class="prog-fill" style="width:${pct}%;background:${col}"></div></div>
      <div style="display:flex;justify-content:flex-end;gap:3px;margin-top:7px">
        <button class="btn-edit" onclick="editGrade('${g.id}')"><i data-lucide="pencil" style="width:11px;height:11px"></i></button>
        <button class="btn-del" onclick="delGrade('${g.id}')"><i data-lucide="trash-2" style="width:11px;height:11px"></i></button>
      </div>
    </div>`;
  }).join('');
}

// SCHEDULE
function saveSch(){
  const id=document.getElementById('sEId').value;
  const day=document.getElementById('sDay').value;
  const subj=document.getElementById('sSubj').value.trim();
  const time=document.getElementById('sTime').value;
  const desc=document.getElementById('sDesc').value.trim();
  if(!subj){toast('Mata pelajaran kosong!','#ef4444');return}
  if(!time){toast('Waktu harus diisi!','#ef4444');return}
  if(id){const s=schedule.find(x=>x.id===id);if(s){s.day=day;s.subj=subj;s.time=time;s.desc=desc;s.color=sColor}}
  else schedule.push({id:Date.now()+'',day,subj,time,desc,color:sColor});
  lss(uk('sch'),schedule);closeModal('schModal');renderAll();toast(id?'Jadwal diperbarui!':'Jadwal ditambahkan!','#3b6ef8');
}
function editSch(id){
  const s=schedule.find(x=>x.id===id);if(!s)return;
  document.getElementById('sEId').value=s.id;document.getElementById('schMTitle').textContent='Edit Jadwal';
  document.getElementById('sDay').value=s.day;document.getElementById('sSubj').value=s.subj;
  document.getElementById('sTime').value=s.time;document.getElementById('sDesc').value=s.desc||'';
  sColor=s.color||COLORS[0];document.getElementById('schModal').classList.add('open');
  setColorSel('sColors',sColor);setTimeout(()=>lucide.createIcons(),30);
}
function delSch(id){schedule=schedule.filter(x=>x.id!==id);lss(uk('sch'),schedule);renderAll();toast('Jadwal dihapus.','#64748b')}

function renderDayTabs(){
  const today=JDAYS[new Date().getDay()];
  document.getElementById('dayTabs').innerHTML=DAYS.map(d=>{
    const cnt=schedule.filter(s=>s.day===d).length;
    return`<button class="day-tab${d===activeDay?' active':''}" onclick="switchDay('${d}')">${d}${d===today?' 🔵':''}${cnt?` (${cnt})`:''}</button>`;
  }).join('');
}
function switchDay(d){activeDay=d;renderDayTabs();renderSch()}

function renderSch(f){
  const c=document.getElementById('sch-content');
  let list=schedule.filter(s=>s.day===activeDay).sort((a,b)=>a.time.localeCompare(b.time));
  if(f)list=list.filter(s=>s.subj.toLowerCase().includes(f)||(s.desc||'').toLowerCase().includes(f));
  if(!list.length){c.innerHTML=`<div class="empty" style="padding:36px 0"><i data-lucide="calendar-x" style="width:28px;height:28px;display:block;margin:0 auto 8px;opacity:.2"></i>Belum ada jadwal hari ${activeDay}.</div>`;return}
  c.innerHTML=`<table class="sch-table"><thead><tr><th>Mata Pelajaran</th><th>Waktu</th><th>Tugas</th><th style="text-align:right">Aksi</th></tr></thead><tbody>${
    list.map(s=>`<tr>
      <td><span class="subj-pill" style="background:${s.color||'#3b6ef8'}22;color:${s.color||'#3b6ef8'};border:1px solid ${s.color||'#3b6ef8'}33">${s.subj}</span></td>
      <td><span class="time-pill" style="background:${s.color||'#3b6ef8'}15;color:${s.color||'#3b6ef8'}"><i data-lucide="clock" style="width:10px;height:10px"></i>${s.time}</span></td>
      <td style="color:${s.desc?'var(--txt)':'var(--txt2)'};font-size:12px">${s.desc||'—'}</td>
      <td style="text-align:right"><div style="display:flex;justify-content:flex-end;gap:2px">
        <button class="btn-edit" onclick="editSch('${s.id}')"><i data-lucide="pencil" style="width:11px;height:11px"></i></button>
        <button class="btn-del" onclick="delSch('${s.id}')"><i data-lucide="trash-2" style="width:11px;height:11px"></i></button>
      </div></td>
    </tr>`).join('')
  }</tbody></table>`;
}

function updateStats(){
  document.getElementById('sTasks').textContent=tasks.length;
  document.getElementById('sUrgent').textContent=tasks.filter(t=>{const d=daysLeft(t.date);return d>=0&&d<=3}).length;
  document.getElementById('sGrades').textContent=grades.length;
  const today=JDAYS[new Date().getDay()];
  document.getElementById('sSch').textContent=schedule.filter(s=>s.day===today).length;
}

function doSearch(v){const f=v.toLowerCase().trim()||undefined;renderTasks(f);renderGrades(f);renderSch(f);lucide.createIcons()}
function fmtDate(d){if(!d)return'';const x=new Date(d);return`${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`}

function toast(msg,color){
  const c=document.getElementById('toasts');const t=document.createElement('div');
  t.className='toast';t.style.background=color;t.textContent=msg;
  c.appendChild(t);setTimeout(()=>t.remove(),2500);
}

let pColor=COLORS[0];
function openProfileModal(){
  const key=currentUser.key;
  const name=localStorage.getItem(key+'_name')||currentUser.name;
  pColor=localStorage.getItem(key+'_pcolor')||COLORS[0];
  document.getElementById('pName').value=name;
  document.getElementById('pClass').value=localStorage.getItem(key+'_class')||'';
  document.getElementById('pSchool').value=localStorage.getItem(key+'_school')||'';
  document.getElementById('pBio').value=localStorage.getItem(key+'_bio')||'';
  document.getElementById('pStatTasks').textContent=tasks.length;
  document.getElementById('pStatGrades').textContent=grades.length;
  document.getElementById('pStatSch').textContent=schedule.length;
  const saved=localStorage.getItem(key+'_avatar');
  if(saved){document.getElementById('profileAvatarImg').src=saved;document.getElementById('profileAvatarImg').style.display='block';document.getElementById('profileAvatarInitial').style.display='none'}
  else{document.getElementById('profileAvatarImg').style.display='none';document.getElementById('profileAvatarInitial').style.display='';document.getElementById('profileAvatarInitial').textContent=name.charAt(0).toUpperCase()}
  const c=document.getElementById('profileColors');
  c.innerHTML=COLORS.map(col=>`<div class="color-opt${col===pColor?' sel':''}" style="background:${col}" data-c="${col}" onclick="pickProfileColor(this,'${col}')"></div>`).join('');
  document.getElementById('profileModal').classList.add('open');setTimeout(()=>lucide.createIcons(),30);
}
function pickProfileColor(el,col){
  pColor=col;document.getElementById('profileColors').querySelectorAll('.color-opt').forEach(x=>x.classList.remove('sel'));el.classList.add('sel');
}
function saveProfile(){
  const key=currentUser.key;
  const name=document.getElementById('pName').value.trim()||currentUser.name;
  localStorage.setItem(key+'_name',name);
  localStorage.setItem(key+'_class',document.getElementById('pClass').value.trim());
  localStorage.setItem(key+'_school',document.getElementById('pSchool').value.trim());
  localStorage.setItem(key+'_bio',document.getElementById('pBio').value.trim());
  localStorage.setItem(key+'_pcolor',pColor);
  document.getElementById('sName').textContent=name;
  const av=document.getElementById('sAv');
  const savedAvatar=localStorage.getItem(key+'_avatar');
  if(savedAvatar){av.innerHTML=`<img src="${savedAvatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`}
  else{av.style.background=`linear-gradient(135deg,${pColor},${pColor}88)`;av.textContent=name.charAt(0).toUpperCase()}
  const cls=localStorage.getItem(key+'_class')||'';
  document.getElementById('sRole').textContent=(cls||currentUser.email)+' ✦';
  updateTime();closeModal('profileModal');toast('Profil disimpan! ✦','#3b6ef8');
}
function handleAvatarUpload(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const data=e.target.result,key=currentUser.key;
    localStorage.setItem(key+'_avatar',data);
    document.getElementById('profileAvatarImg').src=data;
    document.getElementById('profileAvatarImg').style.display='block';
    document.getElementById('profileAvatarInitial').style.display='none';
    document.getElementById('sAv').innerHTML=`<img src="${data}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    toast('Foto diperbarui!','#3b6ef8');
  };reader.readAsDataURL(file);
}
function loadSavedProfile(){
  const key=currentUser.key;
  const name=localStorage.getItem(key+'_name')||currentUser.name;
  const savedAvatar=localStorage.getItem(key+'_avatar');
  const pColorSaved=localStorage.getItem(key+'_pcolor')||COLORS[0];
  document.getElementById('sName').textContent=name;
  const av=document.getElementById('sAv');
  if(savedAvatar){av.innerHTML=`<img src="${savedAvatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`}
  else{av.style.background=`linear-gradient(135deg,${pColorSaved},${pColorSaved}88)`;av.textContent=name.charAt(0).toUpperCase()}
  const cls=localStorage.getItem(key+'_class')||'';
  document.getElementById('sRole').textContent=(cls||currentUser.email)+' ✦';
}

window.addEventListener('DOMContentLoaded',()=>{
  lucide.createIcons();
  if(!checkSession()){
    document.getElementById('authScreen').style.display='flex';
  }
});

document.addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    if(document.getElementById('loginForm').style.display!=='none'&&document.getElementById('authScreen').style.display!=='none'){doLogin()}
    else if(document.getElementById('registerForm').style.display!=='none'&&document.getElementById('authScreen').style.display!=='none'){doRegister()}
  }
});