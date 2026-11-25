const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = window.APP_CONFIG;
const db = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = (id) => document.getElementById(id);
const LABELS = { satisfied: '😊 만족', neutral: '😐 보통', dissatisfied: '😞 불만족' };

function show(view) {
  ['student', 'login', 'admin'].forEach((v) => ($(v).hidden = v !== view));
  $('adminBtn').hidden = view !== 'student';
}

document.querySelectorAll('.vote').forEach((btn) =>
  btn.addEventListener('click', async () => {
    const buttons = document.querySelectorAll('.vote');
    buttons.forEach((b) => (b.disabled = true));
    $('studentMsg').textContent = '';
    const { error } = await db.from('votes').insert({ rating: btn.dataset.rating });
    $('studentMsg').textContent = error
      ? '저장에 실패했습니다. 다시 시도해 주세요.'
      : '투표가 완료되었습니다. 감사합니다.';
    buttons.forEach((b) => (b.disabled = false));
  })
);

$('adminBtn').onclick = () => { $('loginMsg').textContent = ''; show('login'); };
$('cancelLogin').onclick = () => show('student');
$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await db.auth.signInWithPassword({
    email: $('email').value,
    password: $('password').value,
  });
  $('password').value = '';
  if (error) { $('loginMsg').textContent = '로그인에 실패했습니다. 이메일과 비밀번호를 확인하세요.'; return; }
  await openAdmin();
});

async function loadResults() {
  const { data, error } = await db.from('votes').select('rating');
  if (error) { $('adminMsg').textContent = '결과를 불러오지 못했습니다.'; return; }
  const count = { satisfied: 0, neutral: 0, dissatisfied: 0 };
  data.forEach((v) => count[v.rating]++);
  const total = data.length;
  $('total').textContent = total;
  $('bars').innerHTML = Object.keys(LABELS).map((k) => {
    const pct = total ? Math.round((count[k] / total) * 1000) / 10 : 0;
    return `<div class="row ${k}"><span>${LABELS[k]}</span>
      <div class="track"><div class="fill" style="width:${pct}%"></div></div>
      <span class="val">${count[k]}표 (${pct}%)</span></div>`;
  }).join('');
}

async function openAdmin() {
  $('adminMsg').textContent = '';
  show('admin');
  await loadResults();
}

$('refresh').onclick = loadResults;
$('reset').onclick = async () => {
  if (!confirm('모든 투표 결과를 초기화하시겠습니까? 삭제된 결과는 복구할 수 없습니다.')) return;
  const { error } = await db.from('votes').delete().gt('id', 0);
  if (error) { $('adminMsg').textContent = '초기화에 실패했습니다.'; return; }
  await loadResults();
  $('adminMsg').textContent = '투표 결과가 초기화되었습니다.';
};
$('logout').onclick = async () => {
  await db.auth.signOut();
  $('studentMsg').textContent = '';
  show('student');
};

db.auth.getSession().then(({ data }) => { if (data.session) openAdmin(); else show('student'); });
