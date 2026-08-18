/**
 * A small, dependency-free Markdown renderer.
 *
 * Deliberately not a general-purpose implementation. The input is the set of
 * planning documents in this repository, which is known and controlled, so this
 * covers exactly the constructs those documents use: ATX headings, fenced code,
 * tables, blockquotes, lists, rules, and inline code/bold/italic/links.
 *
 * Written rather than installed so that adding the docs viewer could not
 * disturb the workspace lockfile while other work was in flight.
 */

const ESC: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ESC[c] ?? c);
}

/** Slug for heading anchors, matching GitHub's behaviour closely enough. */
export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function inline(src: string): string {
  let s = esc(src);

  // `code` first, so its contents are not further transformed.
  const codes: string[] = [];
  s = s.replace(/`([^`]+)`/g, (_m, c: string) => {
    codes.push(c);
    return `\u0000${codes.length - 1}\u0000`;
  });

  // [text](href)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, t: string, h: string) => {
    const ext = /^https?:/.test(h);
    const attrs = ext ? ' target="_blank" rel="noreferrer"' : "";
    return `<a href="${h}"${attrs}>${t}</a>`;
  });

  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");

  s = s.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => {
    const c = codes[Number(i)];
    return `<code>${c === undefined ? "" : c}</code>`;
  });

  return s;
}

function splitRow(line: string): string[] {
  return line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((c) => c.trim());
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  const para: string[] = [];

  const flushParagraph = () => {
    if (para.length === 0) return;
    out.push(`<p>${inline(para.join(" "))}</p>`);
    para.length = 0;
  };

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (/^\s*```/.test(line)) {
      flushParagraph();
      const lang = line.replace(/^\s*```/, "").trim();
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i] ?? "")) {
        body.push(lines[i] ?? "");
        i++;
      }
      i++;
      const cls = lang ? ` class="lang-${esc(lang)}"` : "";
      out.push(`<pre${cls}><code>${esc(body.join("\n"))}</code></pre>`);
      continue;
    }

    if (/^\s*$/.test(line)) {
      flushParagraph();
      i++;
      continue;
    }

    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      flushParagraph();
      out.push("<hr />");
      i++;
      continue;
    }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushParagraph();
      const lvl = (h[1] ?? "#").length;
      const text = h[2] ?? "";
      out.push(`<h${lvl} id="${slug(text)}">${inline(text)}</h${lvl}>`);
      i++;
      continue;
    }

    if (/^\s*<a\s+name=/.test(line)) {
      flushParagraph();
      out.push(line.trim());
      i++;
      continue;
    }

    if (/^\s*\|/.test(line) && /^\s*\|[\s:|-]+\|?\s*$/.test(lines[i + 1] ?? "")) {
      flushParagraph();
      const head = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i] ?? "")) {
        rows.push(splitRow(lines[i] ?? ""));
        i++;
      }
      const th = head.map((c) => `<th>${inline(c)}</th>`).join("");
      const tb = rows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
        .join("");
      out.push(`<table><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table>`);
      continue;
    }

    if (/^\s*>/.test(line)) {
      flushParagraph();
      const body: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i] ?? "")) {
        body.push((lines[i] ?? "").replace(/^\s*>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${renderMarkdown(body.join("\n"))}</blockquote>`);
      continue;
    }

    const isUl = /^\s*[-*+]\s+/.test(line);
    const isOl = /^\s*\d+\.\s+/.test(line);
    if (isUl || isOl) {
      flushParagraph();
      const tag = isUl ? "ul" : "ol";
      const items: string[] = [];
      const classes: string[] = [];
      while (i < lines.length) {
        const l = lines[i] ?? "";
        const m = isUl ? /^\s*[-*+]\s+(.*)$/.exec(l) : /^\s*\d+\.\s+(.*)$/.exec(l);
        if (!m) {
          if (/^\s{2,}\S/.test(l) && items.length > 0) {
            items[items.length - 1] += " " + inline(l.trim());
            i++;
            continue;
          }
          break;
        }
        let text = m[1] ?? "";
        let cls = "";
        if (/^\[[xX]\]\s*/.test(text)) {
          text = text.replace(/^\[[xX]\]\s*/, "");
          cls = "task task-done";
        } else if (/^\[ \]\s*/.test(text)) {
          text = text.replace(/^\[ \]\s*/, "");
          cls = "task task-open";
        }
        items.push(inline(text));
        classes.push(cls);
        i++;
      }
      out.push(
        `<${tag}>${items
          .map((t, n) => {
            const c = classes[n] ?? "";
            return c ? `<li class="${c}">${t}</li>` : `<li>${t}</li>`;
          })
          .join("")}</${tag}>`,
      );
      continue;
    }

    para.push(line.trim());
    i++;
  }

  flushParagraph();
  return out.join("\n");
}

/** Top-level headings, for building a table of contents. */
export function headings(md: string): { level: number; text: string; id: string }[] {
  const out: { level: number; text: string; id: string }[] = [];
  for (const line of md.replace(/\r\n/g, "\n").split("\n")) {
    const m = /^(#{1,3})\s+(.*)$/.exec(line);
    if (!m) continue;
    const text = (m[2] ?? "").replace(/[`*]/g, "");
    out.push({ level: (m[1] ?? "#").length, text, id: slug(m[2] ?? "") });
  }
  return out;
}
