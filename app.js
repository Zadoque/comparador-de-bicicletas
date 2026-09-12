const KEY = 'comparador-bicicletas-v1';
let bikes = readBikes();
let selectorMode = 'edit';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function readBikes() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function writeBikes() {
  localStorage.setItem(KEY, JSON.stringify(bikes));
  const status = $('#storageStatus');
  if (status) status.textContent = 'Salvo localmente ✓';
}
function esc(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function clean(value) { return String(value ?? '').trim(); }
function money(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'Preço não informado';
}
function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}
function route(name) {
  $$('.view').forEach((view) => view.classList.remove('active'));
  const target = $(`#${name}View`);
  if (target) target.classList.add('active');
  location.hash = name === 'home' ? 'home' : name;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'home') renderHome();
}
function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => element.classList.remove('show'), 2500);
}
function bikeTitle(bike) {
  return [bike.marca, bike.modelo].filter(Boolean).join(' ') || 'Bike sem identificação';
}
function summary(bike) {
  return `<article class="bike-card" data-id="${bike.id}">
    <span class="badge">${esc(bike.uso || 'Opção cadastrada')}</span>
    <h3>${esc(bikeTitle(bike))}</h3>
    <p><strong>Loja:</strong> ${esc(bike.loja || 'Não informada')}</p>
    <p><strong>Quadro:</strong> ${esc(bike.quadro || bike.materialQuadro || 'Não informado')}</p>
    <p class="price">${money(bike.precoVista)}</p>
  </article>`;
}
function renderHome() {
  const count = bikes.length;
  $('#bikeCount').textContent = count ? `${count} bicicleta${count === 1 ? '' : 's'} cadastrada${count === 1 ? '' : 's'} neste navegador.` : 'Nenhuma bike cadastrada ainda.';
  $('#recentBikes').innerHTML = bikes.slice().reverse().map(summary).join('');
  $('#clearAllBtn').hidden = !count;
  $$('#recentBikes .bike-card').forEach((card) => card.addEventListener('click', () => openForm(card.dataset.id)));
}
function renderSelector() {
  const action = selectorMode === 'edit' ? 'editar' : 'exportar';
  $('#selectorKicker').textContent = selectorMode === 'edit' ? 'Edição' : 'Exportação';
  $('#selectorTitle').textContent = `Escolha uma bicicleta para ${action}`;
  $('#selectorHelp').textContent = selectorMode === 'edit' ? 'Clique em um card para abrir o formulário.' : 'Clique em um card para copiar o relatório em Markdown.';
  $('#selectorBikes').innerHTML = bikes.map(summary).join('');
  $('#emptySelector').hidden = Boolean(bikes.length);
  $$('#selectorBikes .bike-card').forEach((card) => card.addEventListener('click', () => {
    if (selectorMode === 'edit') openForm(card.dataset.id);
    else copyOne(card.dataset.id);
  }));
}
function blankBike() { return { id: newId(), dataConsulta: new Date().toISOString().slice(0, 10) }; }
function openForm(bikeId = null) {
  const bike = bikeId ? bikes.find((item) => item.id === bikeId) : blankBike();
  if (!bike) return;
  const form = $('#bikeForm');
  form.reset();
  $('#bikeId').value = bike.id;
  Object.entries(bike).forEach(([key, value]) => {
    const field = form.elements[key];
    if (field) field.value = value ?? '';
  });
  const editing = Boolean(bikeId);
  $('#formMode').textContent = editing ? 'Editando dados' : 'Nova pesquisa';
  $('#formTitle').textContent = editing ? 'Editar bicicleta' : 'Adicionar bicicleta';
  $('#deleteBtn').hidden = !editing;
  $('#saveMessage').textContent = 'Salvamento local ativo: cada alteração é gravada imediatamente.';
  route('form');
}
function formBike() {
  const bike = { id: $('#bikeId').value || newId() };
  [...new FormData($('#bikeForm')).entries()].forEach(([key, value]) => { bike[key] = value; });
  return bike;
}
function autosave() {
  const bike = formBike();
  const position = bikes.findIndex((item) => item.id === bike.id);
  if (position < 0) bikes.push(bike);
  else bikes[position] = { ...bikes[position], ...bike };
  writeBikes();
  $('#saveMessage').textContent = `Salvo automaticamente às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`;
  renderHome();
}
function mdLine(label, value) {
  return clean(value) ? `| ${label} | ${String(value).replace(/\|/g, '\\|').replace(/\n/g, '<br>')} |\n` : '';
}
function bikeMarkdown(bike) {
  let output = `# ${bikeTitle(bike)}\n\n`;
  output += `> Registro criado no Comparador de Bicicletas${bike.dataConsulta ? ` em ${new Date(`${bike.dataConsulta}T12:00:00`).toLocaleDateString('pt-BR')}` : ''}.\n\n`;
  output += '## Resumo de compra\n\n| Campo | Informação |\n|---|---|\n';
  [['Loja', bike.loja], ['Marca', bike.marca], ['Modelo', bike.modelo], ['Tamanho do quadro', bike.tamanhoQuadro], ['Uso pretendido', bike.uso], ['Preço à vista', money(bike.precoVista)], ['Preço a prazo', money(bike.precoPrazo)], ['Parcelamento sem juros', bike.parcelamento], ['Formas de pagamento', bike.pagamento], ['Frete', money(bike.frete)], ['Montagem/revisão', money(bike.montagem)], ['Montagem', bike.montagemStatus]].forEach((item) => { output += mdLine(...item); });
  const groups = [
    ['Quadro, suspensão e direção', [['Quadro', bike.quadro], ['Material', bike.materialQuadro], ['Garantia do quadro', bike.garantiaQuadro], ['Garfo/suspensão', bike.garfo], ['Tipo/curso da suspensão', bike.suspensao], ['Caixa de direção', bike.caixaDirecao], ['Guidão', bike.guidao], ['Mesa/avanço', bike.mesa], ['Canote', bike.canote]]],
    ['Rodas, pneus e freios', [['Aros', bike.aros], ['Cubo dianteiro', bike.cuboDianteiro], ['Cubo traseiro', bike.cuboTraseiro], ['Sistema traseiro', bike.sistemaTraseiro], ['Raios', bike.raios], ['Pneus', bike.pneus], ['Freio dianteiro', bike.freioDianteiro], ['Freio traseiro', bike.freioTraseiro], ['Marca dos freios', bike.freiosMarca]]],
    ['Transmissão', [['Velocidades', bike.velocidades], ['Trocadores', bike.trocadores], ['Câmbio dianteiro', bike.cambioDianteiro], ['Câmbio traseiro', bike.cambioTraseiro], ['Catraca/cassete', bike.catraca], ['Corrente', bike.corrente], ['Pedivela', bike.pedivela], ['Movimento central', bike.movimentoCentral], ['Pedais', bike.pedais]]],
    ['Conforto e garantia', [['Selim', bike.selim], ['Peso', clean(bike.peso) ? `${bike.peso} kg` : ''], ['Limite de peso', clean(bike.limitePeso) ? `${bike.limitePeso} kg` : ''], ['Garantia do garfo', bike.garantiaGarfo], ['Garantia dos componentes', bike.garantiaComponentes], ['Pós-venda', bike.posVenda], ['Nota pessoal', clean(bike.nota) ? `${bike.nota}/10` : '']]]
  ];
  groups.forEach(([name, items]) => { output += `\n## ${name}\n\n| Campo | Informação |\n|---|---|\n`; items.forEach((item) => { output += mdLine(...item); }); });
  if (clean(bike.positivos)) output += `\n## Pontos positivos\n\n${bike.positivos}\n`;
  if (clean(bike.negativos)) output += `\n## Pontos negativos / riscos\n\n${bike.negativos}\n`;
  if (clean(bike.observacoes)) output += `\n## Observações\n\n${bike.observacoes}\n`;
  return output;
}
function allMarkdown() {
  let output = '# Comparativo de Bicicletas\n\n';
  if (!bikes.length) return `${output}Nenhuma bicicleta cadastrada.\n`;
  output += '| Bike | Loja | Preço à vista | Parcelamento | Quadro | Rodas/Pneus | Transmissão | Freios | Nota |\n|---|---|---:|---|---|---|---|---|---:|\n';
  bikes.forEach((bike) => {
    const wheels = [bike.aros, bike.pneus].filter(Boolean).join('; ');
    const brakes = [bike.freioDianteiro, bike.freioTraseiro].filter(Boolean).join('; ');
    output += `| ${bikeTitle(bike)} | ${clean(bike.loja) || '-'} | ${money(bike.precoVista)} | ${clean(bike.parcelamento) || '-'} | ${clean(bike.quadro) || clean(bike.materialQuadro) || '-'} | ${wheels || '-'} | ${clean(bike.velocidades) || '-'} | ${brakes || '-'} | ${clean(bike.nota) || '-'} |\n`;
  });
  output += '\n## Detalhes individuais\n';
  bikes.forEach((bike) => { output += `\n---\n\n${bikeMarkdown(bike)}`; });
  return output;
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  toast('Markdown copiado para a área de transferência.');
}
function copyOne(bikeId) { const bike = bikes.find((item) => item.id === bikeId); if (bike) copy(bikeMarkdown(bike)); }
function showClearModal() { $('#confirmModal').hidden = false; $('#confirmModal').setAttribute('aria-hidden', 'false'); $('#confirmClearBtn').focus(); }
function hideClearModal() { $('#confirmModal').hidden = true; $('#confirmModal').setAttribute('aria-hidden', 'true'); }

function bindEvents() {
  $$('[data-route]').forEach((element) => element.addEventListener('click', (event) => { event.preventDefault(); route(element.dataset.route); }));
  $$('[data-action]').forEach((element) => element.addEventListener('click', () => {
    const action = element.dataset.action;
    if (action === 'add') openForm();
    if (action === 'edit' || action === 'export-one') {
      selectorMode = action === 'edit' ? 'edit' : 'export';
      renderSelector();
      route('selector');
    }
    if (action === 'export-all') copy(allMarkdown());
  }));
  $('#bikeForm').addEventListener('input', autosave);
  $('#bikeForm').addEventListener('change', autosave);
  $('#doneBtn').addEventListener('click', () => { autosave(); route('home'); toast('Bike salva com sucesso.'); });
  $('#copyCurrentBtn').addEventListener('click', () => { autosave(); copyOne($('#bikeId').value); });
  $('#deleteBtn').addEventListener('click', () => {
    const bike = bikes.find((item) => item.id === $('#bikeId').value);
    if (bike && confirm(`Excluir ${bikeTitle(bike)}?`)) { bikes = bikes.filter((item) => item.id !== bike.id); writeBikes(); route('home'); toast('Bicicleta excluída.'); }
  });
  $('#clearAllBtn').addEventListener('click', showClearModal);
  $('#cancelClearBtn').addEventListener('click', hideClearModal);
  $('#confirmClearBtn').addEventListener('click', () => { bikes = []; writeBikes(); hideClearModal(); renderHome(); toast('Todos os dados foram excluídos.'); });
  $$('[data-close-modal]').forEach((element) => element.addEventListener('click', hideClearModal));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !$('#confirmModal').hidden) hideClearModal(); });
}

bindEvents();
renderHome();
