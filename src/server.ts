import fastify from "fastify";
import { pdfGenerate } from "./utils/pdf_generator.js";
import { Heap } from "heap-js";
import { JSDOM } from "jsdom";

const server = fastify();

interface IQuerystring {
  url: string;
}

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

async function main(url: string): Promise<string[]> {
  const NUM_WORDS = 10;

  const dom = await JSDOM.fromURL(url);
  dom.serialize();

  const heap = new Heap((a: string, b: string) => a.length - b.length);
  for (const str of traverse(dom.window.document)) {
    const words = str
      .split(/[\n\s.,\/#!$%\^&\*;:{}=\-_`~()]+/)
      .filter((word: string) => word && !heap.contains(word));

    heap.push(...words);
    while (heap.size() > NUM_WORDS) {
      heap.pop();
    }
  }

  return heap.toArray() as string[];
}

server.get<{ Querystring: IQuerystring }>(
  "/getLongWords",
  async (response, reply) => {
    const { url } = response.query;
    const strArray = await main(url);
    const buffer = await pdfGenerate(strArray);
    reply.type("application/pdf");
    reply.header("content-disposition", `attachment; filename="longWords.pdf"`);
    reply.send(buffer);
  }
);

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
