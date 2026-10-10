/* Challenge 2 — visual playback of the original notebook, without executing Python.
 * Immutable scene IDs, subtitles and durations can also drive future narration. */
'use strict';

(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const root = $('#laboratorio');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const stateNames = Object.freeze([
    'Alta presencia de IRA y neumonía',
    'Vacunación y campañas preventivas',
    'Detección y vigilancia',
    'Atención médica y tratamiento',
    'Seguimiento y control sanitario',
    'Reducción de casos y defunciones'
  ]);
  // These lines retain the names and operations used in Challenge2.ipynb.
  const bfsCode = Object.freeze([
    'cola = deque([[estado_inicial]])',
    'visitados = []',
    'while cola:',
    '    camino = cola.popleft()',
    '    estado_actual = camino[-1]',
    '    if estado_actual == estado_objetivo:',
    '        return camino',
    '    if estado_actual not in visitados:',
    '        visitados.append(estado_actual)',
    '        for siguiente_estado in espacio_estados[estado_actual]:',
    '            nuevo_camino = camino + [siguiente_estado]',
    '            cola.append(nuevo_camino)'
  ]);
  const regCode = Object.freeze([
    'anios = np.array([2023, 2024, 2025]).reshape(-1, 1)',
    'defunciones = np.array([113, 82, 51])',
    'modelo = LinearRegression()',
    'modelo.fit(anios, defunciones)',
    'anio_futuro = np.array([[2026]])',
    'prediccion = modelo.predict(anio_futuro)'
  ]);
  const range = (length) => Array.from({ length }, (_, index) => index);
  function freezeScene(scene) {
    if (scene.queue) scene.queue = Object.freeze(scene.queue.map((path) => Object.freeze(path)));
    if (scene.visited) scene.visited = Object.freeze(scene.visited);
    if (scene.codeContext) scene.codeContext = Object.freeze(scene.codeContext);
    return Object.freeze(scene);
  }

  function makeBfsScenes() {
    const scenes = [{
      id: 'bfs-initial', phase: 'Preparar', title: 'Todo empieza en E0',
      subtitle: 'La cola recibe el primer camino: solo contiene E0.',
      queue: [[0]], visited: [], current: null, queued: 0, edge: -1,
      action: 'Entra el camino E0', caption: 'Una ruta · seis estados',
      codeLine: 0, codeContext: [0, 1], duration: 1900
    }];
    for (let state = 0; state < 5; state += 1) {
      scenes.push({
        id: `bfs-pop-${state}`, phase: 'Extraer', title: `E${state} sale de la cola`,
        subtitle: `Se extrae el primer camino; E${state} es su último estado.`,
        queue: [], visited: range(state), current: state, queued: null, edge: -1,
        action: 'Sale el primer camino', caption: 'Primero en entrar, primero en salir',
        codeLine: 3, codeContext: [2, 3, 4], duration: 1700
      }, {
        id: `bfs-visit-${state}`, phase: 'Visitar', title: `E${state} queda registrado`,
        subtitle: `E${state} todavía no es la meta: se registra como visitado.`,
        queue: [], visited: range(state + 1), current: state, queued: null, edge: -1,
        action: 'La cola espera', caption: 'El estado se añade a visitados',
        codeLine: 8, codeContext: [7, 8], duration: 1600
      }, {
        id: `bfs-enqueue-${state + 1}`, phase: 'Encolar', title: `El camino suma E${state + 1}`,
        subtitle: `Se añade E${state + 1} al camino y vuelve a la cola.`,
        queue: [range(state + 2)], visited: range(state + 1), current: state,
        queued: state + 1, edge: state, action: `Entra el camino hasta E${state + 1}`,
        caption: 'La cola guarda caminos completos',
        codeLine: 11, codeContext: [9, 10, 11], duration: 1900
      });
    }
    scenes.push({
      id: 'bfs-pop-5', phase: 'Extraer', title: 'E5 sale de la cola',
      subtitle: 'Se extrae el camino completo y se comprueba su último estado.',
      queue: [], visited: range(5), current: 5, queued: null, edge: -1,
      action: 'Sale el camino completo', caption: 'El siguiente paso comprueba la meta',
      codeLine: 3, codeContext: [3, 4, 5], duration: 1800
    }, {
      id: 'bfs-goal', phase: 'Meta', title: 'Ruta encontrada',
      subtitle: 'E5 es la meta: se devuelve el camino y termina BFS.',
      queue: [], visited: range(5), current: 5, queued: null, edge: -1, goal: true,
      action: 'Cola vacía · recorrido terminado', caption: 'E0 → E1 → E2 → E3 → E4 → E5',
      codeLine: 6, codeContext: [4, 5, 6], duration: 2200
    });
    return Object.freeze(scenes.map(freezeScene));
  }

  const scenes = Object.freeze({
    bfs: makeBfsScenes(),
    reg: Object.freeze([
      { id: 'reg-initial', phase: 'Datos', phaseKey: 'data', title: 'Tres años, mismo corte',
        subtitle: 'Comparamos defunciones hasta la semana epidemiológica 24 de cada año.',
        codeLine: 0, codeContext: [0, 1], duration: 2200, points: 0 },
      { id: 'reg-point-2023', phase: 'Datos', phaseKey: 'data', title: '2023 · 113 defunciones',
        subtitle: 'Aparece el primer registro: 113 defunciones hasta la SE 24.',
        codeLine: 1, codeContext: [0, 1], duration: 1800, points: 1 },
      { id: 'reg-point-2024', phase: 'Datos', phaseKey: 'data', title: '2024 · 82 defunciones',
        subtitle: 'El segundo registro incorpora 82 defunciones para el mismo corte.',
        codeLine: 1, codeContext: [0, 1], duration: 1800, points: 2 },
      { id: 'reg-point-2025', phase: 'Datos', phaseKey: 'data', title: '2025 · 51 defunciones',
        subtitle: 'El tercer registro completa los datos: 51 defunciones hasta SE 24.',
        codeLine: 1, codeContext: [0, 1], duration: 2000, points: 3 },
      { id: 'reg-trend', phase: 'Tendencia', phaseKey: 'trend', title: 'Las defunciones disminuyen',
        subtitle: 'Los tres registros bajan 31 defunciones entre años consecutivos.',
        codeLine: 1, codeContext: [0, 1], duration: 2100, points: 3 },
      { id: 'reg-fit', phase: 'Modelo', phaseKey: 'model', title: 'Una recta se ajusta',
        subtitle: 'La regresión lineal ajusta una recta a las tres observaciones.',
        codeLine: 3, codeContext: [2, 3], duration: 2400, points: 3 },
      { id: 'reg-extrapolate', phase: 'Estimación', phaseKey: 'estimate', title: '2026 · 20 estimadas*',
        subtitle: 'Extendemos la recta a 2026: 20 para el mismo corte.',
        codeLine: 5, codeContext: [4, 5], duration: 2600, points: 3, estimate: true },
      { id: 'reg-caution', phase: 'Cautela', phaseKey: 'caution', title: 'Una estimación, con límites',
        subtitle: 'Solo tres observaciones: esta extrapolación no es un pronóstico médico validado.',
        codeLine: 5, codeContext: [4, 5], duration: 2600, points: 3, estimate: true }
    ].map(freezeScene))
  });

  let mode = 'bfs';
  let step = 0;
  let playing = false;
  let speed = 1;
  let playbackTimer = null;
  let signalFrame = null;
  let layoutFrame = null;
  const animations = new Set();
  const tabs = $$('.mode-tab');
  const signal = $('#signal');
  const machine = $('#bfs-machine');
  const codePanel = $('#code-panel');
  const infoDialog = $('#info-dialog');
  const currentScene = () => scenes[mode][step];
  const lastStep = () => scenes[mode].length - 1;

  function clearTimer() {
    if (playbackTimer !== null) window.clearTimeout(playbackTimer);
    playbackTimer = null;
  }

  function stopMotion() {
    if (signalFrame !== null) cancelAnimationFrame(signalFrame);
    signalFrame = null;
    signal.setAttribute('opacity', '0');
    animations.forEach((animation) => animation.cancel());
    animations.clear();
    $$('.is-leaving').forEach((element) => element.remove());
  }

  function animate(element, frames, duration) {
    if (!element || reducedMotion.matches || typeof element.animate !== 'function') return;
    const animation = element.animate(frames, {
      duration: duration / speed, easing: 'cubic-bezier(.16, 1, .3, 1)'
    });
    animations.add(animation);
    animation.onfinish = () => animations.delete(animation);
    animation.oncancel = () => animations.delete(animation);
    return animation;
  }

  function animateSignal(edgeIndex) {
    if (reducedMotion.matches || edgeIndex < 0) return;
    const path = $(`#edge-${edgeIndex}`);
    const length = path.getTotalLength();
    if (!length) return;
    const start = performance.now();
    const duration = 650 / speed;
    signal.setAttribute('opacity', '1');
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const point = path.getPointAtLength(length * progress);
      signal.setAttribute('cx', point.x);
      signal.setAttribute('cy', point.y);
      if (progress < 1) signalFrame = requestAnimationFrame(tick);
      else { signalFrame = null; signal.setAttribute('opacity', '0'); }
    }
    signalFrame = requestAnimationFrame(tick);
  }

  function drawConnections() {
    if (mode !== 'bfs' || !machine.clientWidth) return;
    const bounds = machine.getBoundingClientRect();
    const svg = $('#bfs-connections');
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    const orbs = range(6).map((index) => {
      const orb = $(`#node-${index} .node-orb`).getBoundingClientRect();
      return { x: orb.left + orb.width / 2 - bounds.left,
        y: orb.top + orb.height / 2 - bounds.top, radius: orb.width / 2 };
    });
    const horizontalLayout = Math.abs(orbs[0].y - orbs[1].y) < 8;
    for (let index = 0; index < 5; index += 1) {
      const from = orbs[index];
      const to = orbs[index + 1];
      let path;
      if (Math.abs(from.y - to.y) < 8) {
        const direction = Math.sign(to.x - from.x);
        path = `M ${from.x + from.radius * direction + 6 * direction} ${from.y} L ${to.x - to.radius * direction - 6 * direction} ${to.y}`;
      } else if (horizontalLayout) {
        // Route around the outside of the snake, clear of each node's caption.
        const outsideX = Math.min(bounds.width - 8, from.x + from.radius + 34);
        path = `M ${from.x + from.radius + 5} ${from.y} H ${outsideX} V ${to.y} H ${to.x + to.radius + 5}`;
      } else {
        const direction = Math.sign(to.y - from.y);
        const startY = from.y + direction * (from.radius + 5);
        const endY = to.y - direction * (to.radius + 5);
        const middleY = (startY + endY) / 2;
        path = `M ${from.x} ${startY} V ${middleY} H ${to.x} V ${endY}`;
      }
      $(`#edge-${index}`).setAttribute('d', path);
    }
  }

  function svgElement(tag, attributes, text) {
    const element = document.createElementNS(svgNamespace, tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function drawChart() {
    if (mode !== 'reg') return;
    const wrap = $('#chart-wrap');
    const width = wrap.clientWidth;
    if (!width) return;
    const height = wrap.clientHeight || (width < 600 ? 285 : 355);
    const padding = { top: 43, right: width < 400 ? 28 : 38, bottom: 44, left: 38 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const x = (year) => padding.left + ((year - 2023) / 3) * plotWidth;
    const y = (value) => height - padding.bottom - (value / 120) * plotHeight;
    const chart = $('#reg-chart');
    chart.setAttribute('viewBox', `0 0 ${width} ${height}`);
    chart.style.height = `${height}px`;
    const grid = $('#chart-grid');
    const labels = $('#chart-labels');
    grid.replaceChildren();
    labels.replaceChildren();
    [0, 30, 60, 90, 120].forEach((value) => {
      grid.append(svgElement('line', { x1: padding.left, y1: y(value), x2: width - padding.right,
        y2: y(value), class: 'chart-grid-line' }));
      labels.append(svgElement('text', { x: padding.left - 10, y: y(value) + 4,
        'text-anchor': 'end', class: 'axis-label', 'font-size': 12 }, value));
    });
    [2023, 2024, 2025, 2026].forEach((year) => {
      labels.append(svgElement('text', { x: x(year), y: height - 16,
        'text-anchor': 'middle', class: `axis-label${year === 2026 ? ' future-label' : ''}`,
        'font-size': 12 }, year));
    });
    const observedPath = `M ${x(2023)} ${y(113)} L ${x(2024)} ${y(82)} L ${x(2025)} ${y(51)}`;
    ['trend-line', 'model-line'].forEach((id) => {
      $(`#${id}`).setAttribute('d', observedPath);
      $(`#${id}`).classList.add('draw-line');
    });
    $('#model-line').setAttribute('pathLength', '1');
    $('#trend-line').removeAttribute('pathLength');
    $('#forecast-line').setAttribute('d', `M ${x(2025)} ${y(51)} L ${x(2026)} ${y(20)}`);
    $('#forecast-line').removeAttribute('pathLength');
    $('#forecast-line').setAttribute('stroke-dasharray', '6 6');
    const area = $('#forecast-area');
    const areaStart = x(2025) + plotWidth / 12;
    Object.entries({ x: areaStart, y: padding.top, width: width - padding.right - areaStart,
      height: plotHeight, rx: 6 }).forEach(([name, value]) => area.setAttribute(name, value));
    [[2023, 113], [2024, 82], [2025, 51], [2026, 20]].forEach(([year, value]) => {
      const point = $(`#point-${year}`);
      point.replaceChildren();
      point.setAttribute('transform', `translate(${x(year)} ${y(value)})`);
      point.setAttribute('aria-label', `${year}: ${value}${year === 2026 ? ', estimación ilustrativa' : ' defunciones observadas'}`);
      if (year === 2026) point.append(svgElement('path', { d: 'M 0 -7 L 7 0 L 0 7 L -7 0 Z', class: 'future-point' }));
      else point.append(svgElement('circle', { cx: 0, cy: 0, r: 6, class: 'observed-point' }));
      // Offset the first value so it cannot collide with the top y-axis tick.
      point.append(svgElement('text', { x: year === 2023 ? 12 : 0, y: -18, 'text-anchor': 'middle',
        class: `point-label${year === 2026 ? ' future-label' : ''}`, 'font-size': width < 400 ? 19 : 23 },
      `${value}${year === 2026 ? '*' : ''}`));
    });
  }

  function queueToken(path) {
    const token = document.createElement('span');
    token.className = 'queue-token';
    token.setAttribute('role', 'group');
    token.setAttribute('aria-label', `Camino ${path.map((index) => `E${index}`).join(', ')}`);
    path.forEach((state, index) => {
      if (index) {
        const arrow = document.createElement('span');
        arrow.className = 'queue-arrow';
        arrow.textContent = '→';
        arrow.setAttribute('aria-hidden', 'true');
        token.append(arrow);
      }
      const chip = document.createElement('span');
      chip.className = 'queue-state';
      chip.textContent = `E${state}`;
      chip.setAttribute('aria-hidden', 'true');
      token.append(chip);
    });
    return token;
  }

  function renderBfs(scene, motion) {
    range(6).forEach((state) => {
      const node = $(`#node-${state}`);
      node.setAttribute('role', 'group');
      const isCurrent = state === scene.current;
      const isVisited = scene.visited.includes(state);
      const isQueued = state === scene.queued;
      const isGoal = Boolean(scene.goal && state === 5);
      node.classList.toggle('is-current', isCurrent);
      node.classList.toggle('is-visited', isVisited);
      node.classList.toggle('is-queued', isQueued);
      node.classList.toggle('is-goal', isGoal);
      const status = isGoal ? 'Meta alcanzada' : isQueued ? 'En cola' : isCurrent ? 'Actual' : isVisited ? 'Visitado' : 'En espera';
      $(`#node-status-${state}`).textContent = status;
      node.setAttribute('aria-label', `E${state}: ${stateNames[state]}. ${status}.`);
      if (isCurrent) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
    });
    const furthest = scene.queued ?? scene.current ?? 0;
    range(5).forEach((index) => $(`#edge-${index}`).classList.toggle('is-active', index < furthest));
    const track = $('#queue-track');
    const previous = track.querySelector('.queue-token');
    const leaving = motion && previous && !scene.queue.length ? previous.cloneNode(true) : null;
    track.replaceChildren();
    if (scene.queue.length) {
      const token = queueToken(scene.queue[0]);
      track.append(token);
      if (motion) animate(token, [{ opacity: 0, transform: 'translateX(24px)' }, { opacity: 1, transform: 'translateX(0)' }], 430);
    } else {
      const empty = document.createElement('span');
      empty.className = 'queue-empty';
      empty.textContent = 'Vacía';
      track.append(empty);
      if (leaving && !reducedMotion.matches) {
        leaving.classList.add('is-leaving');
        leaving.setAttribute('aria-hidden', 'true');
        track.append(leaving);
        const animation = animate(leaving, [{ opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: 'translateX(-30px)' }], 330);
        if (animation) animation.onfinish = () => { animations.delete(animation); leaving.remove(); };
        else leaving.remove();
      }
    }
    $('#queue-count').textContent = `${scene.queue.length} ${scene.queue.length === 1 ? 'camino' : 'caminos'}`;
    $('#queue-action').textContent = scene.action;
    $('#visited-count').textContent = scene.visited.length;
    const visited = $('#visited-list');
    visited.replaceChildren();
    scene.visited.forEach((state) => {
      const chip = document.createElement('span');
      chip.className = 'visited-chip';
      chip.textContent = `E${state}`;
      visited.append(chip);
    });
    if (!scene.visited.length) {
      const empty = document.createElement('span');
      empty.className = 'visited-empty';
      empty.textContent = 'Ninguno';
      visited.append(empty);
    }
    $('#bfs-caption').textContent = 'Secuencia conceptual · no implica efectividad clínica.';
    $('#state-description').textContent = stateNames[scene.current ?? scene.queued ?? 0];
    drawConnections();
    if (motion && scene.edge >= 0) animateSignal(scene.edge);
  }

  function setVisible(element, visible) {
    element.classList.toggle('is-visible', visible);
    element.setAttribute('aria-hidden', String(!visible));
  }

  function renderReg(scene, motion) {
    [2023, 2024, 2025].forEach((year, index) => {
      const point = $(`#point-${year}`);
      const previouslyVisible = point.classList.contains('is-visible');
      const visible = index < scene.points;
      setVisible(point, visible);
      if (motion && visible && !previouslyVisible) {
        animate(point, [{ opacity: 0 }, { opacity: 1 }], 450);
        animate(point.querySelector('circle'), [{ r: 0 }, { r: 6 }], 450);
      }
    });
    setVisible($('#trend-line'), step >= 4 && step < 5);
    setVisible($('#model-line'), step >= 5);
    setVisible($('#forecast-line'), Boolean(scene.estimate));
    setVisible($('#forecast-area'), Boolean(scene.estimate));
    setVisible($('#point-2026'), Boolean(scene.estimate));
    $('#estimate-note').hidden = !scene.estimate;
    $('#state-description').textContent = step >= 6 ? '*Estimación ilustrativa, no dato real.' : 'Datos comparables hasta SE 24 · no son años completos.';
    if ($('#reg-result')) {
      $('#reg-result').textContent = scene.estimate ? '20*' : scene.points ? [113, 82, 51][scene.points - 1] : '3';
      $('#reg-result').classList.toggle('is-estimate', Boolean(scene.estimate));
    }
    if ($('#reg-result-label')) $('#reg-result-label').textContent = scene.estimate ? 'Estimación para 2026' : scene.points ? `Registro ${2022 + scene.points}` : 'Observaciones disponibles';
    const phaseKeys = ['data', 'trend', 'model', 'estimate', 'caution'];
    const currentPhase = phaseKeys.indexOf(scene.phaseKey);
    $$('#reg-phase-list [data-phase]').forEach((item) => {
      const index = phaseKeys.indexOf(item.dataset.phase);
      item.classList.toggle('is-active', index === currentPhase);
      item.classList.toggle('is-complete', index < currentPhase);
      if (index === currentPhase) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    if (motion && step === 4) animate($('#trend-line'), [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], 700);
    if (motion && step === 5) animate($('#model-line'), [{ strokeDashoffset: '1' }, { strokeDashoffset: '0' }], 850);
    if (motion && step === 6) {
      animate($('#forecast-line'), [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], 900);
      animate($('#point-2026'), [{ opacity: 0 }, { opacity: 0, offset: .55 }, { opacity: 1 }], 1100);
    }
  }

  function renderCode(scene) {
    const code = mode === 'bfs' ? bfsCode : regCode;
    const content = $('#code-content');
    content.replaceChildren();
    scene.codeContext.forEach((lineIndex) => {
      const row = document.createElement('span');
      row.className = 'code-line';
      if (lineIndex === scene.codeLine) {
        row.classList.add('is-highlighted');
        row.setAttribute('aria-current', 'true');
      }
      row.textContent = code[lineIndex];
      content.append(row);
    });
    $('#code-caption').textContent = `${mode === 'bfs' ? 'BFS' : 'Regresión'} · ${scene.phase.toLowerCase()}`;
  }

  function renderControls() {
    root.dataset.playing = String(playing);
    const atEnd = step === lastStep();
    $('#back-btn').disabled = step === 0;
    $('#next-btn').disabled = atEnd;
    $('#run-state').textContent = playing ? 'En movimiento' : atEnd ? 'Completado' : step === 0 ? 'Listo para explorar' : 'En pausa';
    $('#play-label').textContent = playing ? 'Pausar' : atEnd ? 'Repetir' : 'Reproducir';
    $('#play-btn').setAttribute('aria-label', playing ? 'Pausar animación' : atEnd ? 'Repetir animación' : 'Reproducir animación');
    const icon = $('#play-icon');
    (icon.matches('use') ? icon : icon.querySelector('use')).setAttribute('href', playing ? '#icon-pause' : '#icon-play');
  }

  function render(motion = false) {
    stopMotion();
    const scene = currentScene();
    root.dataset.mode = mode;
    root.dataset.step = String(step);
    root.dataset.scene = scene.id;
    root.style.setProperty('--motion-speed', String(speed));
    $('#step-number').textContent = String(step + 1).padStart(2, '0');
    $('#step-total').textContent = String(scenes[mode].length).padStart(2, '0');
    $('#step-phase').textContent = scene.phase;
    $('#step-title').textContent = scene.title;
    $('#step-explanation').textContent = scene.subtitle;
    $('#progress-fill').style.width = `${(step / lastStep()) * 100}%`;
    if (mode === 'bfs') renderBfs(scene, motion);
    else renderReg(scene, motion);
    renderCode(scene);
    renderControls();
    $('#sr-status').textContent = `Paso ${step + 1} de ${scenes[mode].length}. ${scene.title}. ${scene.subtitle}`;
  }

  function pause() {
    playing = false;
    clearTimer();
    stopMotion();
    renderControls();
  }

  function scheduleNext() {
    clearTimer();
    if (!playing) return;
    playbackTimer = window.setTimeout(() => {
      playbackTimer = null;
      if (!playing) return;
      step = Math.min(step + 1, lastStep());
      if (step === lastStep()) playing = false;
      render(true);
      if (playing) scheduleNext();
    }, currentScene().duration / speed);
  }

  function play() {
    if (step === lastStep()) step = 0;
    playing = true;
    render(false);
    scheduleNext();
  }

  function jump(delta) {
    pause();
    step = Math.min(lastStep(), Math.max(0, step + delta));
    render(delta > 0);
  }

  function selectMode(nextMode) {
    if (nextMode !== 'bfs' && nextMode !== 'reg') return;
    pause();
    mode = nextMode;
    step = 0;
    $('#panel-bfs').hidden = mode !== 'bfs';
    $('#panel-reg').hidden = mode !== 'reg';
    if ($('#bfs-details')) $('#bfs-details').hidden = mode !== 'bfs';
    if ($('#reg-details')) $('#reg-details').hidden = mode !== 'reg';
    tabs.forEach((tab) => {
      const selected = tab.dataset.mode === mode;
      tab.classList.toggle('is-selected', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    $('#scene-label').textContent = mode === 'bfs' ? 'El recorrido de BFS' : 'De los datos a la recta';
    if (mode === 'reg') drawChart();
    render(false);
  }

  function toggleCode(open) {
    codePanel.hidden = !open;
    $('#code-toggle').setAttribute('aria-expanded', String(open));
    if (!open && codePanel.contains(document.activeElement)) $('#code-toggle').focus();
  }

  $('#play-btn').addEventListener('click', () => playing ? pause() : play());
  $('#back-btn').addEventListener('click', () => jump(-1));
  $('#next-btn').addEventListener('click', () => jump(1));
  $('#reset-btn').addEventListener('click', () => { pause(); step = 0; render(false); });
  $('#speed-select').addEventListener('change', (event) => {
    speed = [0.5, 1, 2].includes(Number(event.target.value)) ? Number(event.target.value) : 1;
    root.style.setProperty('--motion-speed', String(speed));
    stopMotion();
    if (playing) scheduleNext();
  });
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => { if (tab.dataset.mode !== mode) selectMode(tab.dataset.mode); });
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const target = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[tabs.length - 1]
        : tabs[(tabs.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      if (target.dataset.mode !== mode) selectMode(target.dataset.mode);
      target.focus();
    });
  });
  $('#code-toggle').addEventListener('click', () => toggleCode(codePanel.hidden));
  $('#code-close').addEventListener('click', () => toggleCode(false));
  codePanel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.preventDefault(); toggleCode(false); }
  });
  $('#info-toggle').addEventListener('click', () => {
    pause();
    const content = $('#info-content');
    content.replaceChildren();
    const paragraphs = mode === 'bfs' ? [
      'El espacio de estados tiene una única ruta: E0 → E1 → E2 → E3 → E4 → E5. No se comparan estrategias alternativas.',
      'La cola FIFO almacena caminos completos. Se extrae el primero, se comprueba la meta y, si no es la meta, se registra el estado como visitado.',
      'E5 termina la búsqueda antes de añadirse a visitados. La ruta encontrada tiene seis estados; la lista de visitados contiene E0 a E4.',
      'Los estados representan acciones conceptuales. El recorrido no demuestra su efectividad clínica ni una relación causal con los datos.'
    ] : [
      'Los valores 113, 82 y 51 corresponden a defunciones por neumonía en menores de cinco años en el Perú, hasta la semana epidemiológica 24 de 2023, 2024 y 2025. No son años completos.',
      'La recta se ajusta con solo tres observaciones. Su prolongación da 20 para el corte equivalente de 2026: una estimación ilustrativa, no un dato observado.',
      'Esta extrapolación no es un pronóstico médico validado. La tendencia no demuestra que las intervenciones sanitarias hayan causado la reducción.',
      'La animación reproduce la lógica del notebook; no ejecuta Python ni entrena un modelo nuevo en el navegador.'
    ];
    paragraphs.forEach((text) => { const paragraph = document.createElement('p'); paragraph.textContent = text; content.append(paragraph); });
    if ($('#info-title')) $('#info-title').textContent = mode === 'bfs' ? 'Qué representa esta ruta' : 'Cómo leer esta estimación';
    infoDialog.showModal();
  });
  $('#info-close').addEventListener('click', () => infoDialog.close());
  infoDialog.addEventListener('click', (event) => {
    if (event.target !== infoDialog) return;
    const bounds = infoDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) infoDialog.close();
  });
  infoDialog.addEventListener('close', () => $('#info-toggle').focus());
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  reducedMotion.addEventListener('change', stopMotion);
  function requestLayout() {
    if (layoutFrame !== null) return;
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = null;
      stopMotion();
      if (mode === 'bfs') drawConnections();
      else drawChart();
    });
  }
  const resizeObserver = new ResizeObserver(requestLayout);
  resizeObserver.observe(machine);
  resizeObserver.observe($('#chart-wrap'));
  const viewportObserver = new IntersectionObserver(([entry]) => {
    root.classList.toggle('is-in-view', entry.isIntersecting);
  }, { threshold: 0 });
  viewportObserver.observe(root);
  window.addEventListener('resize', requestLayout, { passive: true });
  window.addEventListener('pagehide', () => {
    pause();
    if (layoutFrame !== null) cancelAnimationFrame(layoutFrame);
    layoutFrame = null;
  });
  // Read-only scene metadata is useful for synchronized subtitles/narration later.
  window.challengeScenes = scenes;
  selectMode('bfs');
})();
