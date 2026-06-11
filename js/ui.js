// Renders an algorithm's parameter schema into live controls
// (sliders, selects, checkboxes) and reports value changes.

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function decimalsOf(step) {
  const s = String(step ?? 1);
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
}

export function buildControls(container, schema, values, onChange) {
  container.textContent = '';
  for (const def of schema) {
    if (def.type === 'checkbox') {
      const row = el('label', 'control control-check');
      const input = el('input');
      input.type = 'checkbox';
      input.checked = !!values[def.key];
      input.addEventListener('change', () => onChange(def.key, input.checked));
      row.append(input, el('span', 'check-label', def.label));
      container.append(row);
    } else if (def.type === 'select') {
      const row = el('div', 'control');
      const select = el('select');
      for (const opt of def.options) {
        const o = el('option', '', opt.label);
        o.value = opt.value;
        select.append(o);
      }
      select.value = String(values[def.key]);
      select.addEventListener('change', () => onChange(def.key, select.value));
      row.append(el('label', 'control-label', def.label), select);
      container.append(row);
    } else {
      const row = el('div', 'control');
      const head = el('div', 'control-head');
      const dec = decimalsOf(def.step);
      const out = el('span', 'control-value', Number(values[def.key]).toFixed(dec));
      head.append(el('span', 'control-label', def.label), out);
      const input = el('input');
      input.type = 'range';
      input.min = def.min;
      input.max = def.max;
      input.step = def.step ?? 1;
      input.value = values[def.key];
      input.addEventListener('input', () => {
        const v = parseFloat(input.value);
        out.textContent = v.toFixed(dec);
        onChange(def.key, v);
      });
      row.append(head, input);
      container.append(row);
    }
  }
}
