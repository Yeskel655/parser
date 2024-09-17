import { Heap } from "heap-js";
import { JSDOM } from "jsdom";

function* traverse(node: Document | ChildNode): Generator<string, undefined> {
  switch (node.nodeName) {
    case "#text":
      if (node.nodeValue) {
        yield node.nodeValue;
      }
      return;

    case "#comment":
    case "SCRIPT":
    case "STYLE":
      return;
  }

  for (const child of node.childNodes) {
    yield* traverse(child);
  }
}

export async function getWordsFromUrl(url: string): Promise<string[]> {
  const NUM_WORDS = 10;

  const dom = await JSDOM.fromURL(url);
  dom.serialize();

  const heap = new Heap<string>((a: string, b: string) => a.length - b.length);
  for (const str of traverse(dom.window.document)) {
    const words = str
      .split(/[\n\s.,\/#!$%\^&\*;:{}=\-_`~()]+/)
      .filter((word: string) => word && !heap.contains(word));

    heap.push(...words);
    while (heap.size() > NUM_WORDS) {
      heap.pop();
    }
  }

  return heap.toArray();
}
