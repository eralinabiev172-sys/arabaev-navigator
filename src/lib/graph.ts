/** Неориентированный взвешенный граф: id узла → соседи с весами. */
export type Graph = Map<string, { to: string; weight: number }[]>;

export interface PathResult {
  /** Узлы пути от старта до найденной цели включительно. */
  nodes: string[];
  length: number;
  /** Какая из целей оказалась ближайшей. */
  target: string;
}

export function addEdge(graph: Graph, a: string, b: string, weight: number): void {
  if (!graph.has(a)) graph.set(a, []);
  if (!graph.has(b)) graph.set(b, []);
  graph.get(a)?.push({ to: b, weight });
  graph.get(b)?.push({ to: a, weight });
}

/** Дейкстра от одного старта до ближайшей из нескольких целей. null — если цели недостижимы. */
export function shortestPath(graph: Graph, from: string, targets: string[]): PathResult | null {
  if (!graph.has(from)) return null;
  const dist = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, string>();
  const done = new Set<string>();
  const goals = new Set(targets);

  for (;;) {
    let u: string | null = null;
    let best = Infinity;
    for (const [node, d] of dist) {
      if (!done.has(node) && d < best) {
        best = d;
        u = node;
      }
    }
    if (u === null) return null;
    if (goals.has(u)) return { nodes: unwind(prev, u), length: best, target: u };
    done.add(u);
    for (const { to, weight } of graph.get(u) ?? []) {
      const alt = best + weight;
      if (alt < (dist.get(to) ?? Infinity)) {
        dist.set(to, alt);
        prev.set(to, u);
      }
    }
  }
}

function unwind(prev: Map<string, string>, last: string): string[] {
  const nodes = [last];
  for (let n = prev.get(last); n !== undefined; n = prev.get(n)) nodes.unshift(n);
  return nodes;
}
